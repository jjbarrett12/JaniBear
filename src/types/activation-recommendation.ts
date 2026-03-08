/**
 * Types for AI crew/operator assignment recommendations.
 * Used by assignment engine and activation_recommendations table.
 */

export type ActivationType =
  | 'new_account'
  | 'crew_change'
  | 'recovery'
  | 'expansion'
  | 'restart';

export type ActivationEntityType =
  | 'launch_packet'
  | 'crew_change_request'
  | 'account'
  | 'facility';

export type RecommendationRiskLevel = 'low' | 'medium' | 'high';

/** Normalized account/facility requirements for scoring (from payload, facility, or manual). */
export interface AccountRequirementsInput {
  square_footage?: number | null;
  building_type?: string | null;
  room_restroom_count?: number | null;
  kitchen_breakroom_count?: number | null;
  service_frequency?: string | null;
  service_days?: string[] | null;
  service_window?: string | null;
  estimated_labor_hours_per_visit?: number | null;
  complexity_score?: number | null;
  special_requirements?: string | null;
}

/** Route-fit detail for a candidate crew. */
export interface RouteFitDetail {
  route_fit_score: number;
  added_travel_minutes: number | null;
  distance_to_nearest_miles: number | null;
  distance_to_centroid_miles: number | null;
  cluster_id: string | null;
  cluster_name: string | null;
  service_window_match: boolean;
}

/** Four score groups for route-aware assignment. */
export interface ScoreGroups {
  capability_fit: number;
  capacity_fit: number;
  route_fit: number;
  risk_fit: number;
}

/** Single crew candidate with factor breakdown (from scoring layer). */
export interface CrewCandidateScore {
  crew_id: string;
  crew_name: string;
  supervisor_id?: string | null;
  supervisor_name?: string | null;
  performance_score: number;
  capacity_score: number;
  proximity_score: number;
  reliability_score: number;
  complaint_penalty: number;
  final_score: number;
  distance_miles?: number | null;
  active_accounts: number;
  max_accounts: number;
  /** Route-aware: four groups (0–100 each). */
  capability_fit?: number;
  capacity_fit?: number;
  route_fit?: number;
  risk_fit?: number;
  /** Route-fit detail when route-aware scoring is used. */
  route_fit_detail?: RouteFitDetail | null;
}

/** Nightly/day staffing split: day key -> { evening: number, day: number }. */
export type NightlyStaffingSplit = Record<string, { evening: number; day: number }>;

/** Full recommendation output: primary, secondary, backup, labor, reasoning, confidence, risk, route. */
export interface ActivationRecommendationResult {
  primary_crew_id: string | null;
  primary_crew_name: string | null;
  primary_supervisor_id: string | null;
  primary_supervisor_name: string | null;
  secondary_crew_ids: string[];
  secondary_crews: { id: string; name: string }[];
  backup_crew_ids: string[];
  backup_crews: { id: string; name: string }[];
  recommended_headcount: number | null;
  weekly_labor_hours: number | null;
  evening_day_split: string | null;
  reasoning_summary: string;
  confidence_score: number;
  risk_level: RecommendationRiskLevel;
  risk_flags: string[];
  scores_jsonb: Record<string, unknown>;
  candidate_scores: CrewCandidateScore[];
  /** Route-aware: route fit score for primary crew (0–100). */
  route_fit_score?: number | null;
  /** Route-aware: added drive time in minutes (per visit or weekly). */
  added_travel_minutes?: number | null;
  /** Route-aware: recommended route cluster to absorb this account. */
  recommended_cluster_id?: string | null;
  recommended_cluster_name?: string | null;
  /** Route-aware: day-by-day staffing (e.g. Mon: 2 evening, 0 day). */
  nightly_staffing_split?: NightlyStaffingSplit | null;
  /** Route-aware: capability, capacity, route, risk breakdown. */
  score_groups?: ScoreGroups | null;
}

/** Row shape for activation_recommendations table (DB). */
export interface ActivationRecommendationRow {
  id: string;
  org_id: string;
  activation_type: ActivationType;
  entity_type: ActivationEntityType;
  entity_id: string;
  primary_crew_id: string | null;
  primary_supervisor_id: string | null;
  secondary_crew_ids: string[];
  backup_crew_ids: string[];
  recommended_headcount: number | null;
  weekly_labor_hours: number | null;
  evening_day_split: string | null;
  reasoning_summary: string | null;
  confidence_score: number | null;
  risk_level: RecommendationRiskLevel | null;
  risk_flags: string[];
  scores_jsonb: Record<string, unknown>;
  computed_at: string;
  created_at: string;
  updated_at: string;
  route_fit_score?: number | null;
  added_travel_minutes?: number | null;
  recommended_cluster_id?: string | null;
  nightly_staffing_split?: NightlyStaffingSplit | null;
  score_groups_jsonb?: Record<string, unknown> | null;
}
