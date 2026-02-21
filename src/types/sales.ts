/**
 * Sales Command Center types (sales_proposals pipeline, metrics, leaderboard).
 */

export const SALES_PROPOSAL_STAGES = [
  'prospect',
  'walkthrough',
  'drafted',
  'delivered',
  'negotiating',
  'verbal_yes',
  'signed',
  'lost',
] as const;

export type SalesProposalStage = (typeof SALES_PROPOSAL_STAGES)[number];

export const SALES_PROPOSAL_STATUSES = ['active', 'won', 'lost'] as const;
export type SalesProposalStatus = (typeof SALES_PROPOSAL_STATUSES)[number];

export interface RepSalesMetrics {
  org_id: string;
  rep_id: string;
  proposals_delivered_7d: number;
  proposals_delivered_30d: number;
  mrr_closed_mtd: number;
  weighted_pipeline: number;
  pipeline_coverage_ratio: number;
  close_rate_30d: number | null;
  avg_contract_size_30d: number | null;
  revenue_per_proposal_30d: number | null;
  avg_sales_cycle_days_30d: number | null;
  monthly_mrr_target: number;
  commission_rate: number;
}

export interface RepPipelineByStage {
  org_id: string;
  rep_id: string;
  stage: string;
  count_active: number;
  sum_estimated_mrr: number;
  sum_weighted_mrr: number;
}

export interface LeaderboardRow {
  org_id: string;
  rep_id: string;
  rep_name: string | null;
  rank: number;
  performance_score: number;
  badge: string | null;
}

export interface StalledDeal {
  id: string;
  name: string | null;
  stage: string;
  estimated_mrr: number;
  last_activity_at: string | null;
}

/** Pipeline health row for Command Center: stage with count, value, avg days, conversion %, bottleneck flag */
export interface PipelineStageHealth {
  stage: string;
  stageLabel: string;
  count: number;
  totalValue: number;
  avgDaysInStage: number;
  conversionPct: number | null;
  isBottleneck: boolean;
}

/** Single action for the Action Queue (follow-up, proposal not viewed, etc.) */
export interface SalesActionItem {
  id: string;
  type: 'follow_up_due' | 'proposal_not_viewed' | 'walkthrough_not_scheduled' | 'no_activity' | 'high_value_near_close';
  title: string;
  subtitle: string;
  href?: string;
  revenueImpact?: number;
  urgency: 'high' | 'medium' | 'low';
  stage?: string;
  dueDate?: string;
}

/** Revenue leakage signal for Command Center */
export interface RevenueLeakageSignal {
  id: string;
  type: 'lost_pricing' | 'lost_scope' | 'walkthrough_not_converted' | 'proposal_sitting';
  label: string;
  count: number;
  amount?: number;
}

export function isSalesRepRole(role: string | null, roleEnum: string | null): boolean {
  const effective = roleEnum ?? role ?? '';
  return (
    effective === 'sales_rep' ||
    effective === 'sales' ||
    effective === 'op_sales' ||
    effective === 'fr_sales'
  );
}

export function isSalesAdminOrManager(role: string | null, roleEnum: string | null): boolean {
  const effective = roleEnum ?? role ?? '';
  return [
    'owner',
    'admin',
    'manager',
    'op_admin',
    'fr_admin',
    'op_ops_manager',
  ].includes(effective);
}
