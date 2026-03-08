/**
 * Account Intelligence Profile — central AI profile per lead/account.
 * Evolves from lead (Hunt) through walkthrough, proposal, close, activation, service.
 * Canonical lifecycle: Hunt → Stalk → Kill → Launch to Ops.
 */

export type VerificationState =
  | 'ai_estimated'
  | 'human_confirmed'
  | 'contract_confirmed'
  | 'inferred'
  | 'stale';

export type ServiceWindow = 'evening' | 'day' | 'mixed';

export type ProfileSourceEntityType = 'lead' | 'walkthrough' | 'proposal' | 'account' | 'contract' | 'bid';

export type ExtractedSpaceType = 'zone' | 'room' | 'floor' | 'area';

export type AIRecommendationStatus = 'pending' | 'accepted' | 'dismissed';

export type AIReadinessTaskType =
  | 'missing_data'
  | 'proposal_readiness'
  | 'activation_readiness'
  | 'missing_lidar'
  | 'confirm_sqft'
  | 'verify_flooring'
  | 'confirm_service_window'
  | 'confirm_restroom_count'
  | 'assign_supervisor'
  | 'finalize_schedule'
  | 'verify_scope';

export type AIReadinessTaskStatus = 'open' | 'done' | 'dismissed';

/** Central profile (hybrid: structured + JSON). */
export interface AccountIntelligenceProfile {
  id: string;
  org_id: string;
  lead_id: string | null;
  account_id: string | null;
  opportunity_id: string | null;

  building_type: string | null;
  square_footage_estimate: number | null;
  restroom_count: number | null;
  floor_count: number | null;
  cleaning_scope_summary: string | null;
  service_frequency: string | null;
  service_days: string[];
  service_window: ServiceWindow | null;
  estimated_labor_hours_per_visit: number | null;
  recommended_headcount: number | null;
  recommended_cluster_id: string | null;
  proposal_readiness: string | null;
  activation_readiness: string | null;
  risk_flags: string[];
  missing_data_flags: string[];

  /** Extended (migration 128): account/building */
  industry: string | null;
  occupancy_pattern: string | null;
  complexity_tier: string | null;
  /** Extended: cleaning/scope */
  kitchen_breakroom_count: number | null;
  flooring_mix: Record<string, unknown> | null;
  trash_volume: string | null;
  touchpoint_density: string | null;
  special_cleaning_requirements: string | null;
  frequency_recommendation: string | null;
  /** Extended: operational */
  estimated_labor_hours_per_week: number | null;
  likely_crew_type: string | null;
  equipment_supply_implications: string | null;
  inspection_zone_suggestions: unknown[] | Record<string, unknown> | null;
  /** Extended: fit */
  travel_burden_minutes: number | null;
  staffing_fit_score: number | null;
  start_date_risk: string | null;

  verification_state: VerificationState;

  raw_ai_output: Record<string, unknown>;
  evidence_summary: Record<string, unknown>;
  confidence_metadata: Record<string, unknown>;
  extracted_data: Record<string, unknown>;

  last_event_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Evidence / provenance row. */
export interface ProfileSource {
  id: string;
  org_id: string;
  profile_id: string;
  source_type: string;
  source_entity_type: ProfileSourceEntityType;
  source_entity_id: string;
  captured_at: string;
  meta: Record<string, unknown>;
  created_at: string;
}

/** Extracted space (zone, room, floor, area). */
export interface ExtractedSpace {
  id: string;
  org_id: string;
  profile_id: string;
  name: string;
  space_type: ExtractedSpaceType;
  sort_order: number;
  geo_json: Record<string, unknown>;
  meta: Record<string, unknown>;
  created_at: string;
}

/** AI recommendation row. */
export interface AIRecommendation {
  id: string;
  org_id: string;
  profile_id: string;
  recommendation_type: string;
  content: string | null;
  content_jsonb: Record<string, unknown>;
  status: AIRecommendationStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

/** AI readiness task row. */
export interface AIReadinessTask {
  id: string;
  org_id: string;
  profile_id: string;
  task_type: AIReadinessTaskType;
  title: string;
  description: string | null;
  status: AIReadinessTaskStatus;
  due_at: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

/** Event types that drive profile updates. */
export type ProfileEventType =
  | 'lead_created'
  | 'lead_enriched'
  | 'walkthrough_scheduled'
  | 'lidar_uploaded'
  | 'photos_uploaded'
  | 'voice_note_uploaded'
  | 'walkthrough_completed'
  | 'proposal_generated'
  | 'proposal_sent'
  | 'contract_uploaded'
  | 'deal_closed_won'
  | 'launch_to_ops_requested'
  | 'ops_activation_started'
  | 'account_activated'
  | 'inspection_failed'
  | 'complaint_received'
  | 'crew_changed';

/** Source type for profile_sources (evidence). */
export type ProfileSourceType =
  | 'lead_form'
  | 'enrichment'
  | 'lidar'
  | 'photo_upload'
  | 'voice_note'
  | 'walkthrough_form'
  | 'proposal'
  | 'contract'
  | 'manual_edit'
  | 'ai_inference'
  | ProfileEventType;
