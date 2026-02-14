/**
 * Mock KPI data for Sales, Operations, and Franchisor (KMI) dashboards.
 * Replace with real API/Supabase when available.
 */

import type { KpiTileData, KmiKpiRow, StandaloneKpiRow } from '@/lib/kpi-metrics';
import {
  KMI_WEIGHTS,
  KMI_TOTAL_REGIONS,
  computeWeightedScore,
  computeKmi,
  type KmiKpiKey,
} from '@/lib/kpi-metrics';

function last12(): number[] {
  const out: number[] = [];
  const d = new Date();
  for (let i = 11; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(38 + (m.getMonth() % 5)); // placeholder trend
  }
  return out;
}

/** Sales KPIs for customer (operator) dashboard */
export function getMockSalesKpis(): KpiTileData[] {
  const spark = last12();
  return [
    {
      label: '$ Value of Account Proposals Closed (YTD)',
      value: '$77,734',
      delta: 4.2,
      sparkline: [62, 65, 68, 70, 72, 74, 75, 76, 77, 77.5, 77.7, 77.734],
      health: 'green',
      rank: 21,
      rankOutOf: KMI_TOTAL_REGIONS,
    },
    {
      label: 'Gross Monthly Billing Growth (YTD)',
      value: '$73,960',
      delta: 8.1,
      sparkline: [65, 67, 68, 70, 71, 72, 73, 73.5, 73.8, 73.9, 73.95, 73.96],
      health: 'green',
      rank: 4,
      rankOutOf: KMI_TOTAL_REGIONS,
    },
    {
      label: 'Avg $ Value of Account Proposals Closed (YTD)',
      value: '$7,773',
      delta: 2.0,
      sparkline: [7.2, 7.3, 7.4, 7.5, 7.6, 7.65, 7.7, 7.72, 7.75, 7.77, 7.77, 7.773],
      health: 'green',
      rank: 2,
      rankOutOf: KMI_TOTAL_REGIONS,
    },
    {
      label: 'Avg Gross Monthly Billings per Unit',
      value: '$43,841',
      delta: 1.5,
      sparkline: [40, 41, 42, 42.5, 43, 43.2, 43.5, 43.7, 43.8, 43.84, 43.84, 43.841],
      health: 'green',
      rank: 2,
      rankOutOf: KMI_TOTAL_REGIONS,
    },
    {
      label: 'Gross Monthly Billings (EOM)',
      value: '$306,890',
      delta: -2.0,
      sparkline: [300, 302, 304, 305, 306, 307, 306, 306.5, 306.8, 306.9, 306.89, 306.89],
      health: 'amber',
      rank: 38,
      rankOutOf: KMI_TOTAL_REGIONS,
    },
    {
      label: 'Attrition % YTD',
      value: '0.8%',
      delta: -0.2,
      sparkline: [1.2, 1.1, 1.0, 0.95, 0.9, 0.88, 0.85, 0.82, 0.81, 0.8, 0.8, 0.8],
      health: 'green',
      rank: 10,
      rankOutOf: KMI_TOTAL_REGIONS,
    },
    {
      label: 'Account Sales Closing Rate (%) YTD',
      value: '50.0%',
      delta: 1.5,
      sparkline: [45, 46, 47, 48, 48.5, 49, 49.5, 50, 50, 50, 50, 50],
      health: 'green',
      rank: 6,
      rankOutOf: KMI_TOTAL_REGIONS,
    },
  ];
}

/** Operations KPIs for customer dashboard (outcome-based only) */
export function getMockOperationsKpis(): KpiTileData[] {
  const spark = last12();
  return [
    {
      label: 'Inspection Completion Rate (%)',
      value: '94%',
      delta: 2,
      sparkline: [88, 90, 91, 92, 92, 93, 93, 94, 94, 94, 94, 94],
      health: 'green',
    },
    {
      label: 'Average Inspection Score',
      value: '92',
      delta: 1,
      sparkline: [88, 89, 90, 90, 91, 91, 92, 92, 92, 92, 92, 92],
      health: 'green',
    },
    {
      label: 'Issues Resolved Within SLA (%)',
      value: '87%',
      delta: -1,
      sparkline: [85, 86, 87, 88, 87, 87, 87, 87, 87, 87, 87, 87],
      health: 'amber',
    },
    {
      label: 'Schedule Adherence (%)',
      value: '96%',
      delta: 0.5,
      sparkline: [94, 94.5, 95, 95, 95.5, 96, 96, 96, 96, 96, 96, 96],
      health: 'green',
    },
    {
      label: 'Contract Retention Rate (%)',
      value: '91%',
      delta: 0.8,
      sparkline: [88, 89, 89.5, 90, 90.5, 91, 91, 91, 91, 91, 91, 91],
      health: 'green',
    },
    {
      label: 'Client Satisfaction (NPS)',
      value: '72',
      delta: 3,
      sparkline: [65, 67, 68, 70, 70, 71, 72, 72, 72, 72, 72, 72],
      health: 'green',
    },
  ];
}

/** Franchisor KMI table rows (top KPIs from spec). Based out of 47 regions. */
export function getMockFranchisorKmiRows(): KmiKpiRow[] {
  const rows: { key: KmiKpiKey; label: string; currentValue: string; prevRank: number; nationalRank: number }[] = [
    { key: 'accountProposalClosedYtd', label: '$ Value of Account Proposal Closed (YTD)', currentValue: '$77,734', prevRank: 26, nationalRank: 21 },
    { key: 'grossMonthlyBillingGrowthYtd', label: 'Gross Monthly Billing Growth (YTD)', currentValue: '$73,960', prevRank: 8, nationalRank: 4 },
    { key: 'avgAccountProposalClosedYtd', label: 'Average $ Value of Account Proposals Closed (YTD)', currentValue: '$7,773', prevRank: 2, nationalRank: 2 },
    { key: 'avgGrossBillingsPerUnit', label: 'Average Gross Monthly Billings per Unit Franchise', currentValue: '$43,841', prevRank: 1, nationalRank: 2 },
    { key: 'grossMonthlyBillingsEom', label: 'Gross Monthly Billings (end of current Month)', currentValue: '$306,890', prevRank: 38, nationalRank: 38 },
    { key: 'attritionPctYtd', label: 'Attrition % YTD', currentValue: '0.8%', prevRank: 22, nationalRank: 10 },
  ];
  return rows.map((r) => {
    const weight = KMI_WEIGHTS[r.key];
    const weightedScore = computeWeightedScore(r.nationalRank, weight);
    return {
      id: r.key,
      label: r.label,
      currentValue: r.currentValue,
      previousMonthRank: r.prevRank,
      nationalRank: r.nationalRank,
      weight,
      weightedScore,
    };
  });
}

/** KMI total (sum of weighted scores) */
export function getMockFranchisorKmiTotal(): number {
  const rows = getMockFranchisorKmiRows();
  return computeKmi(rows.map((r) => r.weightedScore));
}

/** Standalone KPI below KMI table: Account Sales Closing Rate */
export function getMockFranchisorStandaloneKpi(): StandaloneKpiRow {
  return {
    id: 'accountSalesClosingRateYtd',
    label: 'Account Sales Closing Rate (%) YTD',
    currentValue: '50.0%',
    previousMonthRank: 7,
    nationalRank: 6,
  };
}
