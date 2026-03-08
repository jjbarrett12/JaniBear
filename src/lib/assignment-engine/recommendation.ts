/**
 * Assignment engine — orchestration: rules → scoring → build result, persist.
 * Used for new_account (launch packet), crew_change, recovery, expansion, restart.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getEligibleCrews } from './rules';
import { scoreCrews } from './scoring';
import type {
  ActivationType,
  ActivationEntityType,
  ActivationRecommendationResult,
  RecommendationRiskLevel,
  AccountRequirementsInput,
  NightlyStaffingSplit,
  ScoreGroups,
} from '@/types/activation-recommendation';

export interface ComputeRecommendationInput {
  org_id: string;
  activation_type: ActivationType;
  entity_type: ActivationEntityType;
  entity_id: string;
  /** For territory filter (optional). */
  territory_id?: string | null;
  /** Account/facility lat/lng for proximity (optional). */
  account_lat?: number | null;
  account_lng?: number | null;
  /** Requirements from launch packet or account (optional). */
  requirements?: AccountRequirementsInput | null;
  /** Persist to activation_recommendations (default true). */
  persist?: boolean;
}

/**
 * Estimate headcount and weekly labor from requirements (simple heuristic).
 */
function estimateLabor(requirements: AccountRequirementsInput | null | undefined): {
  recommended_headcount: number | null;
  weekly_labor_hours: number | null;
  evening_day_split: string | null;
} {
  if (!requirements) return { recommended_headcount: null, weekly_labor_hours: null, evening_day_split: null };
  const sqft = requirements.square_footage ?? 0;
  const perVisit = requirements.estimated_labor_hours_per_visit ?? (sqft > 0 ? Math.ceil(sqft / 5000) * 2 : null);
  const days = Array.isArray(requirements.service_days) ? requirements.service_days.length : 5;
  const weekly = perVisit != null ? perVisit * days : null;
  const headcount = weekly != null && weekly > 20 ? 2 : 1;
  const split = requirements.service_window ?? 'Evening';
  return {
    recommended_headcount: weekly != null ? headcount : null,
    weekly_labor_hours: weekly,
    evening_day_split: split,
  };
}

/**
 * Build nightly staffing split from requirements (service_days + service_window).
 */
function buildNightlyStaffingSplit(requirements: AccountRequirementsInput | null | undefined): NightlyStaffingSplit | null {
  if (!requirements) return null;
  const days = Array.isArray(requirements.service_days) && requirements.service_days.length > 0
    ? requirements.service_days
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const window = (requirements.service_window ?? 'evening').toLowerCase();
  const evening = window === 'day' ? 0 : 2;
  const day = window === 'evening' ? 0 : 2;
  const out: NightlyStaffingSplit = {};
  for (const d of days) {
    out[d] = { evening, day };
  }
  return out;
}

/**
 * Build reasoning summary from top candidate and risk flags (template; AI can replace later).
 * Route-aware: include added travel and cluster when present.
 */
function buildReasoningSummary(
  topScore: number,
  candidateCount: number,
  riskFlags: string[],
  opts?: { added_travel_minutes?: number | null; cluster_name?: string | null }
): string {
  const parts: string[] = [];
  if (candidateCount === 0) {
    return 'No eligible crews (capacity or territory filter). Add crews or adjust filters.';
  }
  parts.push(`Top crew scored ${Math.round(topScore)}/100 (capability, capacity, route, and risk fit).`);
  if (opts?.added_travel_minutes != null && opts.added_travel_minutes > 0) {
    parts.push(`Adds ~${Math.round(opts.added_travel_minutes)} min drive per visit.`);
  }
  if (opts?.cluster_name) {
    parts.push(`Fits ${opts.cluster_name} cluster.`);
  }
  if (riskFlags.length > 0) {
    parts.push(`Consider: ${riskFlags.join(', ')}.`);
  }
  return parts.join(' ');
}

/**
 * Compute risk level and flags from scores and context.
 */
function computeRisk(
  candidates: { final_score: number; active_accounts: number; max_accounts: number }[],
  top: (typeof candidates)[0] | undefined
): { risk_level: RecommendationRiskLevel; risk_flags: string[] } {
  const flags: string[] = [];
  if (!top) return { risk_level: 'high', risk_flags: ['no_eligible_crews'] };
  if (top.final_score < 60) flags.push('low_match_score');
  if (top.max_accounts > 0 && top.active_accounts >= top.max_accounts - 1) flags.push('crew_near_capacity');
  if (candidates.length < 2) flags.push('no_backup_options');
  const risk_level: RecommendationRiskLevel = flags.some((f) => f === 'no_eligible_crews') ? 'high' : flags.length >= 2 ? 'medium' : 'low';
  return { risk_level, risk_flags: flags };
}

/**
 * Get supervisor (crew lead) for a crew from crew_members.
 */
async function getCrewLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  crewId: string
): Promise<{ id: string; name: string } | null> {
  const { data: member } = await supabase
    .from('crew_members')
    .select('user_id')
    .eq('org_id', orgId)
    .eq('crew_id', crewId)
    .eq('role', 'leader')
    .limit(1)
    .maybeSingle();
  if (!member) return null;
  const userId = (member as { user_id: string }).user_id;
  const { data: profile } = await supabase.from('profiles').select('id, full_name').eq('id', userId).single();
  if (!profile) return null;
  const p = profile as { id: string; full_name?: string | null };
  return { id: p.id, name: p.full_name ?? 'Lead' };
}

/**
 * Compute full recommendation: eligibility → scoring → result. Optionally persist.
 */
export async function computeActivationRecommendation(
  input: ComputeRecommendationInput
): Promise<ActivationRecommendationResult> {
  const supabase = await createClient();
  const {
    org_id: orgId,
    activation_type: activationType,
    entity_type: entityType,
    entity_id: entityId,
    territory_id: territoryId,
    account_lat: accLat,
    account_lng: accLng,
    requirements,
    persist = true,
  } = input;

  const eligible = await getEligibleCrews({
    org_id: orgId,
    territory_id: territoryId,
  });
  const crewIds = eligible.filter((e) => e.passed).map((e) => e.crew_id);
  const candidates = await scoreCrews({
    org_id: orgId,
    crew_ids: crewIds,
    account_lat: accLat,
    account_lng: accLng,
    requirements: requirements ?? null,
  });

  const top = candidates[0];
  const { risk_level, risk_flags } = computeRisk(candidates, top);
  const labor = estimateLabor(requirements);
  const routeDetail = top?.route_fit_detail;
  const reasoning_summary = buildReasoningSummary(
    top?.final_score ?? 0,
    candidates.length,
    risk_flags,
    { added_travel_minutes: routeDetail?.added_travel_minutes ?? null, cluster_name: routeDetail?.cluster_name ?? null }
  );
  const confidence_score = top ? Math.min(100, Math.round(top.final_score)) : 0;
  const nightly_staffing_split = buildNightlyStaffingSplit(requirements);
  const score_groups: ScoreGroups | null = top
    ? {
        capability_fit: top.capability_fit ?? top.performance_score,
        capacity_fit: top.capacity_fit ?? top.capacity_score,
        route_fit: top.route_fit ?? top.proximity_score,
        risk_fit: top.risk_fit ?? 80,
      }
    : null;

  let primary_supervisor_id: string | null = null;
  let primary_supervisor_name: string | null = null;
  if (top) {
    const lead = await getCrewLead(supabase, orgId, top.crew_id);
    primary_supervisor_id = lead?.id ?? null;
    primary_supervisor_name = lead?.name ?? null;
  }

  const result: ActivationRecommendationResult = {
    primary_crew_id: top?.crew_id ?? null,
    primary_crew_name: top?.crew_name ?? null,
    primary_supervisor_id,
    primary_supervisor_name,
    secondary_crew_ids: candidates.slice(1, 3).map((c) => c.crew_id),
    secondary_crews: candidates.slice(1, 3).map((c) => ({ id: c.crew_id, name: c.crew_name })),
    backup_crew_ids: candidates.slice(3, 6).map((c) => c.crew_id),
    backup_crews: candidates.slice(3, 6).map((c) => ({ id: c.crew_id, name: c.crew_name })),
    recommended_headcount: labor.recommended_headcount,
    weekly_labor_hours: labor.weekly_labor_hours,
    evening_day_split: labor.evening_day_split,
    reasoning_summary,
    confidence_score,
    risk_level,
    risk_flags,
    scores_jsonb: { weights_used: true, candidate_count: candidates.length, score_groups: score_groups ?? undefined },
    candidate_scores: candidates,
    route_fit_score: routeDetail?.route_fit_score ?? null,
    added_travel_minutes: routeDetail?.added_travel_minutes ?? null,
    recommended_cluster_id: routeDetail?.cluster_id ?? null,
    recommended_cluster_name: routeDetail?.cluster_name ?? null,
    nightly_staffing_split,
    score_groups,
  };

  if (persist && (top || candidates.length === 0)) {
    await supabase.from('activation_recommendations').upsert(
      {
        org_id: orgId,
        activation_type: activationType,
        entity_type: entityType,
        entity_id: entityId,
        primary_crew_id: result.primary_crew_id,
        primary_supervisor_id: result.primary_supervisor_id,
        secondary_crew_ids: result.secondary_crew_ids,
        backup_crew_ids: result.backup_crew_ids,
        recommended_headcount: result.recommended_headcount,
        weekly_labor_hours: result.weekly_labor_hours,
        evening_day_split: result.evening_day_split,
        reasoning_summary: result.reasoning_summary,
        confidence_score: result.confidence_score,
        risk_level: result.risk_level,
        risk_flags: result.risk_flags,
        scores_jsonb: result.scores_jsonb,
        route_fit_score: result.route_fit_score ?? null,
        added_travel_minutes: result.added_travel_minutes ?? null,
        recommended_cluster_id: result.recommended_cluster_id ?? null,
        nightly_staffing_split: result.nightly_staffing_split ?? {},
        score_groups_jsonb: result.score_groups ?? {},
        computed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'org_id,activation_type,entity_type,entity_id',
      }
    );
  }

  return result;
}

/**
 * Fetch stored recommendation for an entity (or return null).
 */
export async function getActivationRecommendation(
  orgId: string,
  entityType: ActivationEntityType,
  entityId: string
): Promise<ActivationRecommendationResult | null> {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from('activation_recommendations')
    .select('*')
    .eq('org_id', orgId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .maybeSingle();
  if (!row) return null;
  const r = row as {
    primary_crew_id: string | null;
    primary_supervisor_id: string | null;
    secondary_crew_ids: string[];
    backup_crew_ids: string[];
    recommended_headcount: number | null;
    weekly_labor_hours: number | null;
    evening_day_split: string | null;
    reasoning_summary: string | null;
    confidence_score: number | null;
    risk_level: string | null;
    risk_flags: string[];
    scores_jsonb: Record<string, unknown>;
    route_fit_score?: number | null;
    added_travel_minutes?: number | null;
    recommended_cluster_id?: string | null;
    nightly_staffing_split?: NightlyStaffingSplit | null;
    score_groups_jsonb?: ScoreGroups | null;
  };
  const { data: crews } = await supabase.from('crews').select('id, name').eq('org_id', orgId).in('id', [r.primary_crew_id, ...r.secondary_crew_ids, ...r.backup_crew_ids].filter(Boolean));
  const nameById = new Map((crews ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const primaryName = r.primary_crew_id ? nameById.get(r.primary_crew_id) ?? null : null;
  let primary_supervisor_name: string | null = null;
  if (r.primary_supervisor_id) {
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', r.primary_supervisor_id).single();
    primary_supervisor_name = (profile as { full_name?: string | null })?.full_name ?? null;
  }
  let recommended_cluster_name: string | null = null;
  if (r.recommended_cluster_id) {
    const { data: cluster } = await supabase.from('route_clusters').select('name').eq('id', r.recommended_cluster_id).single();
    recommended_cluster_name = (cluster as { name?: string } | null)?.name ?? null;
  }
  return {
    primary_crew_id: r.primary_crew_id,
    primary_crew_name: primaryName,
    primary_supervisor_id: r.primary_supervisor_id,
    primary_supervisor_name,
    secondary_crew_ids: r.secondary_crew_ids ?? [],
    secondary_crews: (r.secondary_crew_ids ?? []).map((id) => ({ id, name: nameById.get(id) ?? id })),
    backup_crew_ids: r.backup_crew_ids ?? [],
    backup_crews: (r.backup_crew_ids ?? []).map((id) => ({ id, name: nameById.get(id) ?? id })),
    recommended_headcount: r.recommended_headcount,
    weekly_labor_hours: r.weekly_labor_hours,
    evening_day_split: r.evening_day_split,
    reasoning_summary: r.reasoning_summary ?? '',
    confidence_score: r.confidence_score ?? 0,
    risk_level: (r.risk_level as RecommendationRiskLevel) ?? 'low',
    risk_flags: Array.isArray(r.risk_flags) ? r.risk_flags : [],
    scores_jsonb: r.scores_jsonb ?? {},
    candidate_scores: [],
    route_fit_score: r.route_fit_score ?? null,
    added_travel_minutes: r.added_travel_minutes ?? null,
    recommended_cluster_id: r.recommended_cluster_id ?? null,
    recommended_cluster_name: recommended_cluster_name ?? r.recommended_cluster_id ?? null,
    nightly_staffing_split: r.nightly_staffing_split ?? null,
    score_groups: r.score_groups_jsonb ?? null,
  };
}
