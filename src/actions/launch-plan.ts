'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const LAUNCH_PLAN_WRITE_ROLES = ['owner', 'manager', 'admin', 'sales', 'ops'] as const;
const LAUNCH_PLAN_READ_ROLES = ['owner', 'manager', 'admin', 'inspector', 'sales', 'ops'] as const;

function canWriteLaunchPlan(role: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return LAUNCH_PLAN_WRITE_ROLES.some((x) => x === r) || (r === 'manager' && true);
}

function canReadLaunchPlan(role: string | null): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  return LAUNCH_PLAN_READ_ROLES.some((x) => x === r);
}

/** For UI: whether current user can read and/or write launch plans */
export async function getLaunchPlanAccess(): Promise<{ canRead: boolean; canWrite: boolean }> {
  const org = await requireOrg();
  const role = (org.role as string) ?? null;
  return { canRead: canReadLaunchPlan(role), canWrite: canWriteLaunchPlan(role) };
}

export type LaunchPlanListRow = {
  id: string;
  opportunity_id: string;
  client_name: string | null;
  location_name: string | null;
  status: string;
  start_date: string | null;
  crew_assigned: boolean;
  schedule_exists: boolean;
  inspection_planned: boolean;
  risk_count: number;
};

/** Ops launches list: start_date in next 30 days OR status in (sales_ready, ops_ready, blocked). Optional filters. */
export async function getLaunchPlansForOpsList(
  org_id: string,
  filters?: { blockedOnly?: boolean; notOpsReady?: boolean; opsOwnerId?: string }
): Promise<LaunchPlanListRow[]> {
  await requireOrg();
  const supabase = await createClient();
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + 30);
  const fromStr = from.toISOString().slice(0, 10);
  const toStr = to.toISOString().slice(0, 10);

  const { data: rawPlans } = await supabase
    .from('launch_plans')
    .select('id, opportunity_id, client_id, location_id, status, start_date, ops_setup, risks, ops_owner_user_id')
    .eq('org_id', org_id)
    .order('start_date', { ascending: true, nullsFirst: false });

  const statusInScope = (p: { status: string; start_date: string | null }) =>
    ['sales_ready', 'ops_ready', 'blocked'].includes(p.status) ||
    (p.start_date != null && p.start_date >= fromStr && p.start_date <= toStr);

  let plans = (rawPlans ?? []).filter(statusInScope);
  if (filters?.blockedOnly) plans = plans.filter((p) => p.status === 'blocked');
  if (filters?.notOpsReady) plans = plans.filter((p) => p.status !== 'ops_ready');
  if (filters?.opsOwnerId) plans = plans.filter((p) => (p as { ops_owner_user_id?: string | null }).ops_owner_user_id === filters.opsOwnerId);

  if (!plans?.length) return [];

  const clientIds = [...new Set(plans.map((p) => p.client_id).filter(Boolean))] as string[];
  const locationIds = [...new Set(plans.map((p) => p.location_id).filter(Boolean))] as string[];
  const { data: clients } = await supabase.from('clients').select('id, name').in('id', clientIds);
  const { data: locations } = await supabase.from('locations').select('id, name').in('id', locationIds);
  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const locationMap = new Map((locations ?? []).map((l) => [l.id, l.name]));

  const out: LaunchPlanListRow[] = [];
  for (const p of plans) {
    const opsSetup = (p.ops_setup as Record<string, unknown>) ?? {};
    const risks = Array.isArray(p.risks) ? p.risks : [];
    const locationId = p.location_id as string | null;
    let crewAssigned = !!(opsSetup.crew_id as string)?.trim();
    let scheduleExists = opsSetup.schedule_planned === true;
    let inspectionPlanned = opsSetup.inspection_planned === true;
    if (locationId) {
      const { data: ca } = await supabase
        .from('crew_assignments')
        .select('id')
        .eq('org_id', org_id)
        .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
        .eq('is_active', true)
        .limit(1);
      if ((ca?.length ?? 0) > 0) crewAssigned = true;
      const { data: sched } = await supabase
        .from('schedules')
        .select('id')
        .eq('org_id', org_id)
        .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
        .eq('is_active', true)
        .limit(1);
      if ((sched?.length ?? 0) > 0) scheduleExists = true;
      const { data: schedT } = await supabase
        .from('schedules')
        .select('template_id')
        .eq('org_id', org_id)
        .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
        .not('template_id', 'is', null)
        .limit(1);
      if ((schedT?.length ?? 0) > 0) inspectionPlanned = true;
    }
    out.push({
      id: p.id,
      opportunity_id: p.opportunity_id,
      client_name: p.client_id ? (clientMap.get(p.client_id) ?? null) : null,
      location_name: p.location_id ? (locationMap.get(p.location_id) ?? null) : null,
      status: p.status,
      start_date: p.start_date,
      crew_assigned: crewAssigned,
      schedule_exists: scheduleExists,
      inspection_planned: inspectionPlanned,
      risk_count: risks.length,
    });
  }
  return out;
}

export type LaunchPlanRow = {
  id: string;
  org_id: string;
  opportunity_id: string;
  client_id: string | null;
  location_id: string | null;
  status: string;
  start_date: string | null;
  sales_owner_user_id: string | null;
  ops_owner_user_id: string | null;
  sales_inputs: Record<string, unknown>;
  ops_setup: Record<string, unknown>;
  risks: unknown[];
  created_at: string;
  updated_at: string;
};

export type ReadinessResult = {
  salesReady: boolean;
  opsReady: boolean;
  missing: string[];
  riskFlags: { severity: string; code: string; message: string }[];
};

/** Get the most recent launch plan for a location (for site profile card). */
export async function getLaunchPlanByLocation(
  org_id: string,
  location_id: string
): Promise<(LaunchPlanRow & { opportunity_id: string }) | null> {
  const org = await requireOrg();
  if (!canReadLaunchPlan(org.role as string)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('launch_plans')
    .select('*')
    .eq('org_id', org_id)
    .eq('location_id', location_id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as (LaunchPlanRow & { opportunity_id: string }) | null;
}

export async function getLaunchPlanByOpportunity(
  org_id: string,
  opportunity_id: string
): Promise<LaunchPlanRow | null> {
  const org = await requireOrg();
  if (!canReadLaunchPlan(org.role as string)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('launch_plans')
    .select('*')
    .eq('org_id', org_id)
    .eq('opportunity_id', opportunity_id)
    .maybeSingle();
  return data as LaunchPlanRow | null;
}

export async function createLaunchPlan(opportunity_id: string): Promise<{ id?: string; error?: string }> {
  const org = await requireOrg();
  if (!canWriteLaunchPlan(org.role as string)) return { error: 'Unauthorized: cannot create launch plan' };
  const supabase = await createClient();

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, org_id, client_id, location_id')
    .eq('id', opportunity_id)
    .eq('org_id', org.org_id)
    .single();
  if (!opportunity) return { error: 'Opportunity not found' };

  const { data: existing } = await supabase
    .from('launch_plans')
    .select('id')
    .eq('opportunity_id', opportunity_id)
    .maybeSingle();
  if (existing) return { error: 'Launch plan already exists for this opportunity' };

  const { data: plan, error } = await supabase
    .from('launch_plans')
    .insert({
      org_id: org.org_id,
      opportunity_id,
      client_id: opportunity.client_id ?? null,
      location_id: opportunity.location_id ?? null,
      status: 'draft',
      sales_inputs: {},
      ops_setup: {},
      risks: [],
    })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/app/crm');
  revalidatePath('/app/ops/launches');
  return { id: plan.id };
}

export async function updateSalesInputs(
  plan_id: string,
  sales_inputs: Record<string, unknown>
): Promise<{ error?: string }> {
  const org = await requireOrg();
  if (!canWriteLaunchPlan(org.role as string)) return { error: 'Unauthorized' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('launch_plans')
    .update({ sales_inputs, updated_at: new Date().toISOString() })
    .eq('id', plan_id)
    .eq('org_id', org.org_id);
  if (error) return { error: error.message };
  revalidatePath('/app/crm');
  revalidatePath('/app/ops/launches');
  return {};
}

export async function updateOpsSetup(
  plan_id: string,
  ops_setup: Record<string, unknown>
): Promise<{ error?: string }> {
  const org = await requireOrg();
  if (!canWriteLaunchPlan(org.role as string)) return { error: 'Unauthorized' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('launch_plans')
    .update({ ops_setup, updated_at: new Date().toISOString() })
    .eq('id', plan_id)
    .eq('org_id', org.org_id);
  if (error) return { error: error.message };
  revalidatePath('/app/crm');
  revalidatePath('/app/ops/launches');
  return {};
}

export async function updateLaunchPlanFields(
  plan_id: string,
  fields: { start_date?: string | null; sales_owner_user_id?: string | null; ops_owner_user_id?: string | null }
): Promise<{ error?: string }> {
  const org = await requireOrg();
  if (!canWriteLaunchPlan(org.role as string)) return { error: 'Unauthorized' };
  const supabase = await createClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.start_date !== undefined) payload.start_date = fields.start_date || null;
  if (fields.sales_owner_user_id !== undefined) payload.sales_owner_user_id = fields.sales_owner_user_id || null;
  if (fields.ops_owner_user_id !== undefined) payload.ops_owner_user_id = fields.ops_owner_user_id || null;
  const { error } = await supabase
    .from('launch_plans')
    .update(payload)
    .eq('id', plan_id)
    .eq('org_id', org.org_id);
  if (error) return { error: error.message };
  revalidatePath('/app/crm');
  revalidatePath('/app/ops/launches');
  return {};
}

export async function transitionStatus(
  plan_id: string,
  new_status: 'draft' | 'sales_ready' | 'ops_ready' | 'launched' | 'blocked',
  risk_reason?: string
): Promise<{ error?: string }> {
  const org = await requireOrg();
  if (!canWriteLaunchPlan(org.role as string)) return { error: 'Unauthorized' };
  const supabase = await createClient();

  if (new_status === 'blocked' && !risk_reason?.trim()) {
    return { error: 'Blocked status requires a reason' };
  }

  const updates: { status: string; risks?: unknown[]; updated_at: string } = {
    status: new_status,
    updated_at: new Date().toISOString(),
  };
  if (new_status === 'blocked' && risk_reason) {
    const { data: plan } = await supabase
      .from('launch_plans')
      .select('risks')
      .eq('id', plan_id)
      .eq('org_id', org.org_id)
      .single();
    const risks = Array.isArray(plan?.risks) ? [...plan.risks] : [];
    risks.push({
      severity: 'high',
      code: 'blocked',
      message: risk_reason.trim(),
      at: new Date().toISOString(),
    });
    updates.risks = risks;
  }

  const { error } = await supabase
    .from('launch_plans')
    .update(updates)
    .eq('id', plan_id)
    .eq('org_id', org.org_id);
  if (error) return { error: error.message };

  if (new_status === 'launched') {
    const { data: plan } = await supabase
      .from('launch_plans')
      .select('opportunity_id, start_date, org_id')
      .eq('id', plan_id)
      .single();
    if (plan?.opportunity_id && plan?.org_id) {
      const startDate = plan.start_date ? new Date(plan.start_date) : new Date();
      const dueAt = new Date(startDate);
      dueAt.setDate(dueAt.getDate() + 7);
      const { data: existing } = await supabase
        .from('crm_activities')
        .select('id')
        .eq('opportunity_id', plan.opportunity_id)
        .eq('org_id', plan.org_id)
        .ilike('subject', '%first inspection%')
        .limit(1)
        .maybeSingle();
      if (!existing) {
        const { data: user } = await supabase.auth.getUser();
        await supabase.from('crm_activities').insert({
          org_id: plan.org_id,
          opportunity_id: plan.opportunity_id,
          type: 'task',
          subject: 'First inspection scheduled',
          due_at: dueAt.toISOString(),
          created_by: user?.data?.user?.id ?? null,
        });
      }
    }
  }

  revalidatePath('/app/crm');
  revalidatePath('/app/ops/launches');
  return {};
}

export async function computeReadiness(opportunity_id: string): Promise<ReadinessResult> {
  await requireOrg();
  const supabase = await createClient();
  const missing: string[] = [];
  const riskFlags: { severity: string; code: string; message: string }[] = [];

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, org_id, client_id, location_id')
    .eq('id', opportunity_id)
    .single();
  if (!opportunity) {
    return { salesReady: false, opsReady: false, missing: ['Opportunity not found'], riskFlags: [] };
  }

  const { data: plan } = await supabase
    .from('launch_plans')
    .select('sales_inputs, ops_setup, risks, start_date')
    .eq('opportunity_id', opportunity_id)
    .maybeSingle();

  const salesInputs = (plan?.sales_inputs as Record<string, unknown>) ?? {};
  const opsSetup = (plan?.ops_setup as Record<string, unknown>) ?? {};
  const planRisks = Array.isArray(plan?.risks) ? plan.risks : [];

  for (const r of planRisks) {
    const x = r as { severity?: string; code?: string; message?: string };
    riskFlags.push({
      severity: x.severity ?? 'medium',
      code: x.code ?? 'risk',
      message: x.message ?? 'Risk recorded',
    });
  }

  // —— Sales ready gates ——
  if (!opportunity.client_id) missing.push('Opportunity must have a client');
  if (!opportunity.location_id) missing.push('Opportunity must have a location');

  let decisionMaker = false;
  let facilityContact = false;
  const { data: contacts } = await supabase
    .from('crm_contacts')
    .select('contact_type')
    .eq('client_id', opportunity.client_id)
    .eq('org_id', opportunity.org_id);
  for (const c of contacts ?? []) {
    if (c.contact_type === 'decision_maker') decisionMaker = true;
    if (c.contact_type === 'facility') facilityContact = true;
  }
  const contactsMarkedUnknown = salesInputs.contacts_unknown === true || salesInputs.contacts_unknown === 'true';
  if (!contactsMarkedUnknown && (!decisionMaker || !facilityContact)) {
    missing.push('At least one decision_maker and one facility contact required (or mark contacts unknown in Sales Inputs)');
  }

  const serviceWindow =
    (salesInputs.service_window as string)?.trim() ||
    (salesInputs.service_window_days as string)?.trim();
  let locationNotes = '';
  if (opportunity.location_id) {
    const { data: loc } = await supabase
      .from('locations')
      .select('notes, days_of_service')
      .eq('id', opportunity.location_id)
      .single();
    locationNotes = [loc?.notes, loc?.days_of_service].filter(Boolean).join(' ') ?? '';
  }
  if (!serviceWindow && !locationNotes?.trim()) {
    missing.push('Service window required (Sales Inputs or location notes)');
  }

  const accessCode =
    (salesInputs.access_security as string)?.trim() || (salesInputs.door_code as string)?.trim();
  let locationDoorCode = '';
  if (opportunity.location_id) {
    const { data: loc } = await supabase
      .from('locations')
      .select('door_alarm_code')
      .eq('id', opportunity.location_id)
      .single();
    locationDoorCode = (loc?.door_alarm_code as string) ?? '';
  }
  if (!accessCode?.trim() && !locationDoorCode?.trim()) {
    missing.push('Access/alarm code required (location or Sales Inputs)');
  }

  let squareFootageOk = false;
  let restroomCountOk = false;
  if (opportunity.location_id) {
    const { data: loc } = await supabase
      .from('locations')
      .select('square_footage, restroom_count')
      .eq('id', opportunity.location_id)
      .single();
    squareFootageOk = loc?.square_footage != null;
    restroomCountOk = loc?.restroom_count != null;
  }
  if (!squareFootageOk) missing.push('Location square footage required');
  if (!restroomCountOk) missing.push('Location restroom count required');

  const scopeSummary = (salesInputs.scope_summary as string)?.trim();
  if (!scopeSummary) missing.push('Scope summary required in Sales Inputs');

  const includedExcluded =
    (salesInputs.included_services as string)?.trim() || (salesInputs.excluded_services as string)?.trim();
  if (!includedExcluded) missing.push('Included/excluded services required in Sales Inputs');

  const salesMissing = [...missing];
  const salesReady = salesMissing.length === 0;

  // —— Ops ready gates ——
  const locationId = opportunity.location_id as string | null;
  let crewAssigned = false;
  let scheduleExists = false;
  let inspectionPlanned = false;

  if (locationId) {
    const { data: crewRows } = await supabase
      .from('crew_assignments')
      .select('id')
      .eq('org_id', opportunity.org_id)
      .eq('location_id', locationId)
      .eq('is_active', true)
      .limit(1);
    crewAssigned = (crewRows?.length ?? 0) > 0 || !!(opsSetup.crew_id as string)?.trim();
    if (!crewAssigned) {
      const { data: facRows } = await supabase
        .from('crew_assignments')
        .select('id')
        .eq('org_id', opportunity.org_id)
        .eq('facility_id', locationId)
        .eq('is_active', true)
        .limit(1);
      crewAssigned = (facRows?.length ?? 0) > 0 || !!(opsSetup.crew_id as string)?.trim();
    }

    const { data: schedRows } = await supabase
      .from('schedules')
      .select('id')
      .eq('org_id', opportunity.org_id)
      .eq('location_id', locationId)
      .eq('is_active', true)
      .limit(1);
    scheduleExists = (schedRows?.length ?? 0) > 0 || opsSetup.schedule_planned === true;
    if (!scheduleExists) {
      const { data: schedFac } = await supabase
        .from('schedules')
        .select('id')
        .eq('org_id', opportunity.org_id)
        .eq('facility_id', locationId)
        .eq('is_active', true)
        .limit(1);
      scheduleExists = (schedFac?.length ?? 0) > 0 || opsSetup.schedule_planned === true;
    }

    const { data: schedWithTemplate } = await supabase
      .from('schedules')
      .select('template_id')
      .eq('org_id', opportunity.org_id)
      .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`)
      .not('template_id', 'is', null)
      .limit(1);
    inspectionPlanned =
      (schedWithTemplate?.length ?? 0) > 0 || opsSetup.inspection_planned === true;
  }

  const opsMissing: string[] = [];
  if (!crewAssigned) opsMissing.push('Crew assignment for location or ops_setup.crew_id');
  if (!scheduleExists) opsMissing.push('Schedule for location or ops_setup.schedule_planned');
  if (!inspectionPlanned) opsMissing.push('Inspection template selected or ops_setup.inspection_planned');
  if (!plan?.start_date) opsMissing.push('Start date required');

  const opsReady = opsMissing.length === 0;
  const allMissing = [...salesMissing, ...opsMissing];

  return {
    salesReady,
    opsReady,
    missing: opsReady ? [] : allMissing,
    riskFlags,
  };
}

/** Alias for API: computeLaunchReadiness(opportunity_id) */
export async function computeLaunchReadiness(opportunity_id: string): Promise<ReadinessResult> {
  return computeReadiness(opportunity_id);
}
