/**
 * Account Intelligence Profile — repository (CRUD, ensure for lead, attach source).
 * Production-safe; org-scoped; no rename of existing tables.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  AccountIntelligenceProfile,
  ProfileSource,
  ExtractedSpace,
  AIRecommendation,
  AIReadinessTask,
  VerificationState,
  ProfileSourceEntityType,
  ExtractedSpaceType,
  AIReadinessTaskType,
} from '@/types/account-intelligence-profile';

/** Get profile by lead id (unique per org when lead_id set). */
export async function getByLeadId(
  orgId: string,
  leadId: string
): Promise<AccountIntelligenceProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('account_intelligence_profiles')
    .select('*')
    .eq('org_id', orgId)
    .eq('lead_id', leadId)
    .maybeSingle();
  return mapProfileRow(data);
}

/** Get profile by account id (unique per org when account_id set). */
export async function getByAccountId(
  orgId: string,
  accountId: string
): Promise<AccountIntelligenceProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('account_intelligence_profiles')
    .select('*')
    .eq('org_id', orgId)
    .eq('account_id', accountId)
    .maybeSingle();
  return mapProfileRow(data);
}

/** Get profile by id. */
export async function getById(
  orgId: string,
  profileId: string
): Promise<AccountIntelligenceProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('account_intelligence_profiles')
    .select('*')
    .eq('org_id', orgId)
    .eq('id', profileId)
    .maybeSingle();
  return mapProfileRow(data);
}

function mapProfileRow(row: unknown): AccountIntelligenceProfile | null {
  if (!row || typeof row !== 'object') return null;
  const r = row as Record<string, unknown>;
  const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
  return {
    id: String(r.id),
    org_id: String(r.org_id),
    lead_id: r.lead_id != null ? String(r.lead_id) : null,
    account_id: r.account_id != null ? String(r.account_id) : null,
    opportunity_id: r.opportunity_id != null ? String(r.opportunity_id) : null,
    building_type: r.building_type != null ? String(r.building_type) : null,
    square_footage_estimate: typeof r.square_footage_estimate === 'number' ? r.square_footage_estimate : null,
    restroom_count: typeof r.restroom_count === 'number' ? r.restroom_count : null,
    floor_count: typeof r.floor_count === 'number' ? r.floor_count : null,
    cleaning_scope_summary: r.cleaning_scope_summary != null ? String(r.cleaning_scope_summary) : null,
    service_frequency: r.service_frequency != null ? String(r.service_frequency) : null,
    service_days: Array.isArray(r.service_days) ? r.service_days.map(String) : [],
    service_window: (r.service_window as 'evening' | 'day' | 'mixed') ?? null,
    estimated_labor_hours_per_visit: typeof r.estimated_labor_hours_per_visit === 'number' ? r.estimated_labor_hours_per_visit : null,
    recommended_headcount: typeof r.recommended_headcount === 'number' ? r.recommended_headcount : null,
    recommended_cluster_id: r.recommended_cluster_id != null ? String(r.recommended_cluster_id) : null,
    proposal_readiness: r.proposal_readiness != null ? String(r.proposal_readiness) : null,
    activation_readiness: r.activation_readiness != null ? String(r.activation_readiness) : null,
    risk_flags: arr(r.risk_flags),
    missing_data_flags: arr(r.missing_data_flags),
    verification_state: (r.verification_state as VerificationState) ?? 'ai_estimated',
    industry: r.industry != null ? String(r.industry) : null,
    occupancy_pattern: r.occupancy_pattern != null ? String(r.occupancy_pattern) : null,
    complexity_tier: r.complexity_tier != null ? String(r.complexity_tier) : null,
    kitchen_breakroom_count: typeof r.kitchen_breakroom_count === 'number' ? r.kitchen_breakroom_count : null,
    flooring_mix: typeof r.flooring_mix === 'object' && r.flooring_mix != null ? (r.flooring_mix as Record<string, unknown>) : null,
    trash_volume: r.trash_volume != null ? String(r.trash_volume) : null,
    touchpoint_density: r.touchpoint_density != null ? String(r.touchpoint_density) : null,
    special_cleaning_requirements: r.special_cleaning_requirements != null ? String(r.special_cleaning_requirements) : null,
    frequency_recommendation: r.frequency_recommendation != null ? String(r.frequency_recommendation) : null,
    estimated_labor_hours_per_week: typeof r.estimated_labor_hours_per_week === 'number' ? r.estimated_labor_hours_per_week : null,
    likely_crew_type: r.likely_crew_type != null ? String(r.likely_crew_type) : null,
    equipment_supply_implications: r.equipment_supply_implications != null ? String(r.equipment_supply_implications) : null,
    inspection_zone_suggestions: Array.isArray(r.inspection_zone_suggestions) ? r.inspection_zone_suggestions : (typeof r.inspection_zone_suggestions === 'object' && r.inspection_zone_suggestions != null ? r.inspection_zone_suggestions : null),
    travel_burden_minutes: typeof r.travel_burden_minutes === 'number' ? r.travel_burden_minutes : null,
    staffing_fit_score: typeof r.staffing_fit_score === 'number' ? r.staffing_fit_score : null,
    start_date_risk: r.start_date_risk != null ? String(r.start_date_risk) : null,
    raw_ai_output: typeof r.raw_ai_output === 'object' && r.raw_ai_output != null ? (r.raw_ai_output as Record<string, unknown>) : {},
    evidence_summary: typeof r.evidence_summary === 'object' && r.evidence_summary != null ? (r.evidence_summary as Record<string, unknown>) : {},
    confidence_metadata: typeof r.confidence_metadata === 'object' && r.confidence_metadata != null ? (r.confidence_metadata as Record<string, unknown>) : {},
    extracted_data: typeof r.extracted_data === 'object' && r.extracted_data != null ? (r.extracted_data as Record<string, unknown>) : {},
    last_event_at: r.last_event_at != null ? String(r.last_event_at) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

/** Create a new profile. At least one of leadId or accountId required. */
export async function create(params: {
  orgId: string;
  leadId?: string | null;
  accountId?: string | null;
  opportunityId?: string | null;
  verificationState?: VerificationState;
}): Promise<AccountIntelligenceProfile> {
  const supabase = await createClient();
  if (!params.leadId && !params.accountId) {
    throw new Error('At least one of leadId or accountId is required');
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('account_intelligence_profiles')
    .insert({
      org_id: params.orgId,
      lead_id: params.leadId ?? null,
      account_id: params.accountId ?? null,
      opportunity_id: params.opportunityId ?? null,
      verification_state: params.verificationState ?? 'ai_estimated',
      updated_at: now,
    })
    .select('*')
    .single();
  if (error) throw error;
  const out = mapProfileRow(data);
  if (!out) throw new Error('Insert did not return profile');
  return out;
}

function stripUndefined<T extends Record<string, unknown>>(o: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/** Update profile (partial). */
export async function update(
  orgId: string,
  profileId: string,
  updates: Partial<{
    account_id: string | null;
    opportunity_id: string | null;
    building_type: string | null;
    square_footage_estimate: number | null;
    restroom_count: number | null;
    floor_count: number | null;
    cleaning_scope_summary: string | null;
    service_frequency: string | null;
    service_days: string[];
    service_window: string | null;
    estimated_labor_hours_per_visit: number | null;
    recommended_headcount: number | null;
    recommended_cluster_id: string | null;
    proposal_readiness: string | null;
    activation_readiness: string | null;
    risk_flags: string[];
    missing_data_flags: string[];
    verification_state: VerificationState;
    industry: string | null;
    occupancy_pattern: string | null;
    complexity_tier: string | null;
    kitchen_breakroom_count: number | null;
    flooring_mix: Record<string, unknown> | null;
    trash_volume: string | null;
    touchpoint_density: string | null;
    special_cleaning_requirements: string | null;
    frequency_recommendation: string | null;
    estimated_labor_hours_per_week: number | null;
    likely_crew_type: string | null;
    equipment_supply_implications: string | null;
    inspection_zone_suggestions: unknown[] | Record<string, unknown> | null;
    travel_burden_minutes: number | null;
    staffing_fit_score: number | null;
    start_date_risk: string | null;
    raw_ai_output: Record<string, unknown>;
    evidence_summary: Record<string, unknown>;
    confidence_metadata: Record<string, unknown>;
    extracted_data: Record<string, unknown>;
    last_event_at: string | null;
  }>
): Promise<AccountIntelligenceProfile | null> {
  const supabase = await createClient();
  const payload = stripUndefined({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>);
  const { data, error } = await supabase
    .from('account_intelligence_profiles')
    .update(payload)
    .eq('id', profileId)
    .eq('org_id', orgId)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return mapProfileRow(data);
}

/** Ensure a profile exists for this lead; return it. Create if missing. */
export async function ensureForLead(orgId: string, leadId: string): Promise<AccountIntelligenceProfile> {
  const existing = await getByLeadId(orgId, leadId);
  if (existing) return existing;
  return create({ orgId, leadId });
}

/** Attach a source to the profile and bump last_event_at. */
export async function attachSource(params: {
  orgId: string;
  profileId: string;
  sourceType: string;
  sourceEntityType: ProfileSourceEntityType;
  sourceEntityId: string;
  meta?: Record<string, unknown>;
}): Promise<ProfileSource> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: src, error: errSrc } = await supabase
    .from('profile_sources')
    .insert({
      org_id: params.orgId,
      profile_id: params.profileId,
      source_type: params.sourceType,
      source_entity_type: params.sourceEntityType,
      source_entity_id: params.sourceEntityId,
      captured_at: now,
      meta: params.meta ?? {},
    })
    .select('*')
    .single();
  if (errSrc) throw errSrc;
  await supabase
    .from('account_intelligence_profiles')
    .update({ last_event_at: now, updated_at: now })
    .eq('id', params.profileId)
    .eq('org_id', params.orgId);
  const r = src as Record<string, unknown>;
  return {
    id: String(r.id),
    org_id: String(r.org_id),
    profile_id: String(r.profile_id),
    source_type: String(r.source_type),
    source_entity_type: r.source_entity_type as ProfileSourceEntityType,
    source_entity_id: String(r.source_entity_id),
    captured_at: String(r.captured_at),
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
  };
}

/** List sources for a profile. */
export async function listSources(orgId: string, profileId: string): Promise<ProfileSource[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profile_sources')
    .select('*')
    .eq('org_id', orgId)
    .eq('profile_id', profileId)
    .order('captured_at', { ascending: false });
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    org_id: String(r.org_id),
    profile_id: String(r.profile_id),
    source_type: String(r.source_type),
    source_entity_type: r.source_entity_type as ProfileSourceEntityType,
    source_entity_id: String(r.source_entity_id),
    captured_at: String(r.captured_at),
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
  }));
}

/** Add extracted space. */
export async function addExtractedSpace(params: {
  orgId: string;
  profileId: string;
  name: string;
  spaceType: ExtractedSpaceType;
  sortOrder?: number;
  geoJson?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}): Promise<ExtractedSpace> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('extracted_spaces')
    .insert({
      org_id: params.orgId,
      profile_id: params.profileId,
      name: params.name,
      space_type: params.spaceType,
      sort_order: params.sortOrder ?? 0,
      geo_json: params.geoJson ?? {},
      meta: params.meta ?? {},
    })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    org_id: String(r.org_id),
    profile_id: String(r.profile_id),
    name: String(r.name),
    space_type: r.space_type as ExtractedSpaceType,
    sort_order: Number(r.sort_order),
    geo_json: (r.geo_json as Record<string, unknown>) ?? {},
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
  };
}

/** List extracted spaces for a profile. */
export async function listExtractedSpaces(orgId: string, profileId: string): Promise<ExtractedSpace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('extracted_spaces')
    .select('*')
    .eq('org_id', orgId)
    .eq('profile_id', profileId)
    .order('sort_order');
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    org_id: String(r.org_id),
    profile_id: String(r.profile_id),
    name: String(r.name),
    space_type: r.space_type as ExtractedSpaceType,
    sort_order: Number(r.sort_order),
    geo_json: (r.geo_json as Record<string, unknown>) ?? {},
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
  }));
}

/** Add AI recommendation. */
export async function addAIRecommendation(params: {
  orgId: string;
  profileId: string;
  recommendationType: string;
  content?: string | null;
  contentJsonb?: Record<string, unknown>;
}): Promise<AIRecommendation> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_recommendations')
    .insert({
      org_id: params.orgId,
      profile_id: params.profileId,
      recommendation_type: params.recommendationType,
      content: params.content ?? null,
      content_jsonb: params.contentJsonb ?? {},
      status: 'pending',
    })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    org_id: String(r.org_id),
    profile_id: String(r.profile_id),
    recommendation_type: String(r.recommendation_type),
    content: r.content != null ? String(r.content) : null,
    content_jsonb: (r.content_jsonb as Record<string, unknown>) ?? {},
    status: r.status as AIRecommendation['status'],
    created_at: String(r.created_at),
    resolved_at: r.resolved_at != null ? String(r.resolved_at) : null,
    resolved_by: r.resolved_by != null ? String(r.resolved_by) : null,
  };
}

/** Add AI readiness task. */
export async function addAIReadinessTask(params: {
  orgId: string;
  profileId: string;
  taskType: AIReadinessTaskType;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  meta?: Record<string, unknown>;
}): Promise<AIReadinessTask> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ai_readiness_tasks')
    .insert({
      org_id: params.orgId,
      profile_id: params.profileId,
      task_type: params.taskType,
      title: params.title,
      description: params.description ?? null,
      due_at: params.dueAt ?? null,
      meta: params.meta ?? {},
      status: 'open',
    })
    .select('*')
    .single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    org_id: String(r.org_id),
    profile_id: String(r.profile_id),
    task_type: r.task_type as AIReadinessTaskType,
    title: String(r.title),
    description: r.description != null ? String(r.description) : null,
    status: r.status as AIReadinessTask['status'],
    due_at: r.due_at != null ? String(r.due_at) : null,
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
    resolved_at: r.resolved_at != null ? String(r.resolved_at) : null,
    resolved_by: r.resolved_by != null ? String(r.resolved_by) : null,
  };
}

/** List open readiness tasks for a profile. */
export async function listReadinessTasks(
  orgId: string,
  profileId: string,
  options?: { status?: 'open' | 'done' | 'dismissed'; taskType?: AIReadinessTaskType }
): Promise<AIReadinessTask[]> {
  const supabase = await createClient();
  let q = supabase
    .from('ai_readiness_tasks')
    .select('*')
    .eq('org_id', orgId)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (options?.status) q = q.eq('status', options.status);
  if (options?.taskType) q = q.eq('task_type', options.taskType);
  const { data } = await q;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    org_id: String(r.org_id),
    profile_id: String(r.profile_id),
    task_type: r.task_type as AIReadinessTaskType,
    title: String(r.title),
    description: r.description != null ? String(r.description) : null,
    status: r.status as AIReadinessTask['status'],
    due_at: r.due_at != null ? String(r.due_at) : null,
    meta: (r.meta as Record<string, unknown>) ?? {},
    created_at: String(r.created_at),
    resolved_at: r.resolved_at != null ? String(r.resolved_at) : null,
    resolved_by: r.resolved_by != null ? String(r.resolved_by) : null,
  }));
}
