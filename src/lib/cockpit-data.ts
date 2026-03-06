/**
 * Executive cockpit: maps CommandCenterData to KPI strip and alert rail.
 * Single source of truth for the 6 primary KPIs and attention count.
 * KPI labels use JANIBEAR dashboard copy (war room / control tower voice).
 */
import type { CommandCenterData } from '@/lib/command-center-data';
import { DASHBOARD_COPY } from '@/lib/dashboard-copy';

export type KpiVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'revenue';

export interface CockpitKpiItem {
  id: string;
  title: string;
  value: string | number;
  subvalue?: string;
  delta?: { value: number; label: string };
  trend?: number[]; // sparkline, 0–1 normalized
  status?: 'ok' | 'warning' | 'danger';
  variant: KpiVariant;
  href?: string;
}

export interface CockpitKpis {
  buildingsScheduledToday: CockpitKpiItem;
  crewActiveRequired: CockpitKpiItem;
  inspectionsDueToday: CockpitKpiItem;
  accountsBelowHealth: CockpitKpiItem;
  slaBreaches: CockpitKpiItem;
  revenueScheduledToday: CockpitKpiItem;
  attentionCount: number;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

export function commandCenterDataToCockpitKpis(data: CommandCenterData): CockpitKpis {
  const buildings = data.buildingsScheduledToday ?? data.accountHealth.visitsDueToday ?? 0;
  const crewActive = data.crew.crewsClockedIn;
  const crewRequired = data.crew.totalCrews;
  const crewGap = Math.max(0, crewRequired - crewActive) + data.crew.jobsNotStarted;
  const inspectionsDue = data.inspectionsDueToday ?? 0;
  const belowHealth = data.accountHealth.countBelow60;
  const slaBreaches = data.risk.totalRisk;
  const revenueToday = data.revenue.todayTotal;

  const attentionCount =
    belowHealth +
    slaBreaches +
    (crewGap > 0 ? 1 : 0) +
    (data.risk.openComplaints > 0 ? data.risk.openComplaints : 0);

  // Simple sparkline placeholders (could be from real time-series later)
  const neutralTrend = [0.5, 0.55, 0.5, 0.6, 0.58, 0.62, 0.6];
  const revenueTrend = [0.4, 0.5, 0.45, 0.6, 0.65, 0.7, 0.68];

  return {
    buildingsScheduledToday: {
      id: 'buildings_today',
      title: DASHBOARD_COPY.kpi.buildingsOnRoute,
      value: buildings,
      variant: 'neutral',
      trend: neutralTrend,
      status: 'ok',
      href: '/app/schedule',
    },
    crewActiveRequired: {
      id: 'crew_today',
      title: DASHBOARD_COPY.kpi.crewCoverage,
      value: `${crewActive} / ${crewRequired}`,
      subvalue: crewGap > 0 ? `${crewGap} gap` : undefined,
      variant: crewGap > 0 ? 'warning' : 'success',
      status: crewGap > 0 ? 'warning' : 'ok',
      href: '/app/crews',
    },
    inspectionsDueToday: {
      id: 'inspections_today',
      title: DASHBOARD_COPY.kpi.inspectionsDue,
      value: inspectionsDue,
      variant: 'neutral',
      status: 'ok',
      href: '/app/inspections',
    },
    accountsBelowHealth: {
      id: 'health_below',
      title: DASHBOARD_COPY.kpi.healthAtRisk,
      value: belowHealth,
      variant: belowHealth > 0 ? 'danger' : 'success',
      status: belowHealth > 0 ? 'danger' : 'ok',
      href: '/app/accounts',
    },
    slaBreaches: {
      id: 'sla_breaches',
      title: DASHBOARD_COPY.kpi.slaAtRisk,
      value: slaBreaches,
      variant: slaBreaches > 0 ? 'danger' : 'neutral',
      status: slaBreaches > 0 ? 'danger' : 'ok',
      href: '/app/ops/issues-sla',
    },
    revenueScheduledToday: {
      id: 'revenue_today',
      title: DASHBOARD_COPY.kpi.revenueToday,
      value: formatCurrency(revenueToday),
      delta:
        data.revenue.monthPacingPct != null
          ? { value: data.revenue.monthPacingPct, label: '% of month' }
          : undefined,
      variant: 'revenue',
      trend: revenueTrend,
      status: 'ok',
      href: '/app/financial-health',
    },
    attentionCount,
  };
}
