/**
 * Overview (executive snapshot) — trend and business health.
 * Uses command center data; org-scoped.
 */
import { getCommandCenterData } from '@/lib/command-center-data';
import { getARSnapshotForOrg } from '@/lib/command-center-data';

export type OverviewTrendMetric = {
  id: string;
  title: string;
  value: string | number | null;
  subvalue?: string | null;
  delta?: string | null;
  status: 'neutral' | 'good' | 'warn' | 'bad';
};

export type OverviewTrendSeries = {
  id: string;
  label: string;
  /** Placeholder: e.g. last 30 days delta; real chart data can be wired later */
  deltaLabel?: string | null;
  value?: number | null;
};

export type OperationalRiskItem = {
  label: string;
  count: number;
  delta?: number | null;
};

export type ARBucket = {
  label: string;
  amount: number;
  count?: number;
};

export type OverviewPayload = {
  /** 6–8 trend/business tiles */
  trendMetrics: OverviewTrendMetric[];
  /** Small trend strip (sparkline placeholders) */
  trends: OverviewTrendSeries[];
  /** Operational risk (30 days) */
  operationalRisk: OperationalRiskItem[];
  /** Financial health: AR buckets + collections risk */
  financialHealth: {
    arBuckets: ARBucket[];
    collectionsRiskCount: number;
  };
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export async function getOverviewData(orgId: string): Promise<OverviewPayload> {
  try {
    const [cc, arExtended] = await Promise.all([
      getCommandCenterData(orgId),
      getARSnapshotForOrg(orgId).catch(() => null),
    ]);

    const revenue = cc.revenue;
    const risk = cc.risk;
    const accountHealth = cc.accountHealth;
    const quality = cc.quality;
    const ar = cc.ar;
    const pipeline = cc.pipeline;
    const crew = cc.crew;

    const mrr = revenue.monthlyTarget ?? 0;
    const monthPacing = revenue.monthPacingPct ?? null;
    const marginPct = null; // Gross margin % would come from P&L view if available
    const retention30 = accountHealth.totalAccounts ? Math.round(accountHealth.pctAbove80) : null;
    const churnRiskCount = accountHealth.countBelow60 ?? 0;
    const pipelineValue = pipeline.pipelineValue ?? 0;
    const totalCrews = crew.totalCrews || 1;
    const utilization30 = crew.totalCrews > 0 ? Math.round((crew.crewsClockedIn / crew.totalCrews) * 100) : null;
    const arOutstanding = arExtended?.totalOutstanding ?? ar.totalOutstanding ?? 0;
    const accountsAtRisk = risk.accountsBelow60 ?? 0;
    const serviceDeliveryScore = quality.avgScore;

    const trendMetrics: OverviewTrendMetric[] = [
      { id: 'mrr', title: 'Monthly recurring revenue', value: mrr > 0 ? formatCurrency(mrr) : null, subvalue: monthPacing != null ? `Pacing ${monthPacing}%` : null, delta: null, status: monthPacing != null && monthPacing >= 90 ? 'good' : monthPacing != null && monthPacing < 70 ? 'warn' : 'neutral' },
      { id: 'margin', title: 'Gross margin %', value: marginPct != null ? `${marginPct}%` : null, subvalue: null, delta: null, status: 'neutral' },
      { id: 'retention', title: 'Accounts above 80 (30d)', value: retention30 != null ? `${retention30}%` : null, subvalue: null, delta: null, status: (retention30 ?? 0) >= 80 ? 'good' : (retention30 ?? 0) < 60 ? 'warn' : 'neutral' },
      { id: 'churn_risk', title: 'Churn risk count', value: churnRiskCount, subvalue: 'Accounts below 60', delta: null, status: churnRiskCount > 0 ? 'warn' : 'good' },
      { id: 'pipeline', title: 'Open pipeline value', value: pipelineValue > 0 ? formatCurrency(pipelineValue) : null, subvalue: pipeline.openBids > 0 ? `${pipeline.openBids} open bids` : null, delta: null, status: 'neutral' },
      { id: 'util_30', title: 'Crew utilization (30d avg)', value: utilization30 != null ? `${utilization30}%` : null, subvalue: null, delta: null, status: utilization30 != null && utilization30 >= 85 ? 'good' : utilization30 != null && utilization30 < 60 ? 'warn' : 'neutral' },
      { id: 'ar', title: 'AR outstanding', value: arOutstanding > 0 ? formatCurrency(arOutstanding) : null, subvalue: arExtended?.overdueInvoiceCount ? `${arExtended.overdueInvoiceCount} overdue` : null, delta: null, status: (arExtended?.overdueInvoiceCount ?? 0) > 0 ? 'warn' : 'neutral' },
      { id: 'delivery', title: 'Service delivery score (30d)', value: serviceDeliveryScore != null ? `${serviceDeliveryScore}` : null, subvalue: quality.inspectionsYesterday > 0 ? `${quality.inspectionsYesterday} inspections` : null, delta: null, status: (serviceDeliveryScore ?? 0) >= 85 ? 'good' : (serviceDeliveryScore ?? 0) < 70 ? 'warn' : 'neutral' },
    ];

    const trends: OverviewTrendSeries[] = [
      { id: 'mrr', label: 'MRR trend', deltaLabel: monthPacing != null ? `Pacing ${monthPacing}%` : null, value: mrr },
      { id: 'margin', label: 'Margin trend', deltaLabel: null, value: null },
      { id: 'util', label: 'Utilization trend', deltaLabel: utilization30 != null ? `${utilization30}% avg` : null, value: utilization30 },
    ];

    const operationalRisk: OperationalRiskItem[] = [
      { label: 'Accounts below threshold', count: risk.accountsBelow60, delta: null },
      { label: 'Sites with no coverage incidents', count: 0, delta: null },
      { label: 'SLA breaches', count: risk.openComplaints, delta: null },
    ];

    const arBuckets: ARBucket[] = [
      { label: '0–30 days', amount: arOutstanding - (arExtended?.overdue30 ?? ar.overdue30) - (arExtended?.overdue60 ?? ar.overdue60) - (arExtended?.overdue90 ?? ar.overdue90), count: undefined },
      { label: '31–60 days', amount: arExtended?.overdue30 ?? ar.overdue30, count: undefined },
      { label: '61–90 days', amount: arExtended?.overdue60 ?? ar.overdue60, count: undefined },
      { label: '90+ days', amount: arExtended?.overdue90 ?? ar.overdue90, count: undefined },
    ];
    const collectionsRiskCount = arExtended?.overdueInvoiceCount ?? 0;

    return {
      trendMetrics,
      trends,
      operationalRisk,
      financialHealth: { arBuckets, collectionsRiskCount },
    };
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('[getOverviewData]', e);
    return {
      trendMetrics: [],
      trends: [],
      operationalRisk: [],
      financialHealth: { arBuckets: [], collectionsRiskCount: 0 },
    };
  }
}
