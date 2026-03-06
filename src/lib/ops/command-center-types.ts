/**
 * Types for Operations Command Center aggregation and UI.
 */

export interface CommandCenterFilters {
  date?: string;
  territoryId?: string | null;
  verticalId?: string | null;
  riskLevel?: string | null;
  search?: string | null;
}

export interface CommandCenterKPIs {
  coverageGapsTonight: number;
  highRiskAccounts: number;
  reliabilityAlerts: number;
  backupCapacityAvailable: number;
  avgQcScore?: number;
  missedTasksToday?: number;
  complaintsLast7Days?: number;
}

export interface CoverageGapRow {
  id: string;
  account_id: string;
  account_name: string;
  facility_id: string | null;
  facility_name: string | null;
  territory_id: string | null;
  territory_name: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  primary_operator_id: string | null;
  primary_operator_name: string | null;
  backup_operator_id: string | null;
  backup_operator_name: string | null;
  coverage_status: 'scheduled' | 'coverage_needed' | 'backup_assigned' | 'completed';
  recommended_backup_name: string | null;
}

export interface RiskAccountRow {
  id: string;
  account_id: string;
  account_name: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  top_reason: string | null;
  operator_type: string;
  operator_id: string;
  operator_name: string | null;
  status: string;
  recommended_backup_name: string | null;
}

export interface ReliabilityRow {
  id: string;
  operator_type: 'crew' | 'franchisee';
  operator_id: string;
  operator_name: string;
  reliability_score: number;
  attendance_score: number;
  no_show_rate: number;
  late_rate: number;
  shift_completion_rate: number;
  qc_consistency_score: number;
  trend: 'improving' | 'flat' | 'declining';
  updated_at: string;
}

export interface BackupPoolMemberRow {
  id: string;
  operator_type: 'crew' | 'franchisee';
  operator_id: string;
  operator_name: string;
  performance_score: number;
  reliability_score: number;
  capacity_score: number;
  backup_shifts_this_week: number;
  max_backup_shifts_per_week: number;
}

export interface BackupPoolRow {
  id: string;
  name: string;
  territory_id: string | null;
  territory_name: string | null;
  vertical_id: string | null;
  vertical_name: string | null;
  available_tonight: number;
  avg_backup_score: number;
  coverage_health: 'healthy' | 'thin' | 'critical';
  members: BackupPoolMemberRow[];
}

export interface RecommendedAction {
  type: 'coverage_gap' | 'risk_account' | 'reliability_alert' | 'backup_pool_gap';
  priority: number;
  title: string;
  subtitle: string;
  entity_type: string;
  entity_id: string;
  /** For risk_account type, link to account detail. */
  account_id?: string;
  suggested_action: string;
}

export interface CommandCenterData {
  kpis: CommandCenterKPIs;
  coverageGaps: CoverageGapRow[];
  riskAccounts: RiskAccountRow[];
  reliabilityAlerts: ReliabilityRow[];
  backupPools: BackupPoolRow[];
  recommendedActions: RecommendedAction[];
  territories: { id: string; name: string }[];
  verticals: { id: string; label: string }[];
}
