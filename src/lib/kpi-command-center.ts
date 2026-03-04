/**
 * KPI Command Center — types and data contracts.
 * Strategic performance view; org-scoped. No duplication with dashboard (reactive) or financial-health (pure money).
 */

export type KpiTileStatus = 'good' | 'warning' | 'danger';

export interface ExecutiveKpiTileProps {
  title: string;
  value: number | string;
  trendPercent: number;
  status: KpiTileStatus;
  comparisonLabel: string;
  drilldownRoute?: string;
}

/** One row from kpi_summary_view (org-scoped) */
export interface KpiSummaryRow {
  org_id: string;
  mrr: number | null;
  gross_margin_percent: number | null;
  net_mrr_change_30d: number | null;
  accounts_at_risk_count: number | null;
  crew_utilization_percent: number | null;
  inspection_pass_rate: number | null;
  ar_over_60_percent: number | null;
  pipeline_value: number | null;
  close_rate_percent: number | null;
  avg_contract_size: number | null;
  sales_cycle_days: number | null;
  sla_breaches_count: number | null;
  open_issues_count: number | null;
  contracts_expiring_90d_count: number | null;
  client_health_decay_risk_count: number | null;
}

export type KpiDateRange = 'today' | '7d' | '30d' | '90d' | 'ytd';

export interface KpiCommandCenterFilters {
  dateRange: KpiDateRange;
  comparePreviousPeriod: boolean;
  territory?: string;
  accountSize?: string;
  serviceType?: string;
}
