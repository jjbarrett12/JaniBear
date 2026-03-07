/**
 * Service assignments — effective-dated crew/supervisor by facility and optional service line.
 * No hard deletes; set effective_to on reassignment and write history.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ServiceAssignmentRow } from './types';

export interface GetAssignmentsAtDateParams {
  orgId: string;
  facilityId?: string | null;
  serviceLineId?: string | null;
  asOfDate: string;
}

/**
 * Returns assignments effective at asOfDate (effective_from <= date and effective_to is null or >= date).
 */
export async function getAssignmentsAtDate(
  params: GetAssignmentsAtDateParams
): Promise<ServiceAssignmentRow[]> {
  const { orgId, facilityId, serviceLineId, asOfDate } = params;
  const supabase = await createClient();
  let q = supabase
    .from('service_assignments')
    .select('*')
    .eq('org_id', orgId)
    .lte('effective_from', asOfDate)
    .or(`effective_to.is.null,effective_to.gte.${asOfDate}`);
  if (facilityId) q = q.eq('facility_id', facilityId);
  if (serviceLineId) q = q.eq('service_line_id', serviceLineId);
  const { data, error } = await q.order('effective_from', { ascending: false });
  if (error) throw new Error(`getAssignmentsAtDate: ${error.message}`);
  return (data ?? []) as ServiceAssignmentRow[];
}

/**
 * End an assignment (set effective_to) and optionally create a replacement. Writes to service_assignment_history.
 */
export async function endAssignmentAndReplace(params: {
  orgId: string;
  assignmentId: string;
  effectiveTo: string;
  replacementCrewId: string;
  replacementSupervisorId?: string | null;
  createdBy: string;
  notes?: string | null;
}): Promise<{ endedId: string; newId: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('service_assignments')
    .select('id, facility_id, service_line_id, org_id')
    .eq('id', params.assignmentId)
    .single();
  if (!existing) throw new Error('Assignment not found');

  await supabase
    .from('service_assignments')
    .update({ effective_to: params.effectiveTo, updated_at: new Date().toISOString() })
    .eq('id', params.assignmentId);

  const { data: newRow, error: insertErr } = await supabase
    .from('service_assignments')
    .insert({
      org_id: existing.org_id,
      facility_id: existing.facility_id,
      service_line_id: existing.service_line_id,
      crew_id: params.replacementCrewId,
      supervisor_id: params.replacementSupervisorId ?? null,
      effective_from: params.effectiveTo,
      effective_to: null,
      notes: params.notes ?? null,
      created_by: params.createdBy,
    })
    .select('id')
    .single();
  if (insertErr || !newRow) throw new Error(insertErr?.message ?? 'Failed to create replacement assignment');

  await supabase.from('service_assignment_history').insert({
    org_id: existing.org_id,
    service_assignment_id: params.assignmentId,
    action: 'replaced',
    effective_to_set: params.effectiveTo,
    replaced_by_assignment_id: newRow.id,
    created_by: params.createdBy,
    meta: { replacement_crew_id: params.replacementCrewId },
  });

  return { endedId: params.assignmentId, newId: newRow.id };
}

/**
 * End an assignment without replacement (e.g. contract ended).
 */
export async function endAssignment(params: {
  orgId: string;
  assignmentId: string;
  effectiveTo: string;
  createdBy: string;
  notes?: string | null;
}): Promise<void> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('service_assignments')
    .select('id, org_id')
    .eq('id', params.assignmentId)
    .single();
  if (!existing) throw new Error('Assignment not found');

  await supabase
    .from('service_assignments')
    .update({ effective_to: params.effectiveTo, updated_at: new Date().toISOString() })
    .eq('id', params.assignmentId);

  await supabase.from('service_assignment_history').insert({
    org_id: existing.org_id,
    service_assignment_id: params.assignmentId,
    action: 'ended',
    effective_to_set: params.effectiveTo,
    created_by: params.createdBy,
    meta: { notes: params.notes ?? null },
  });
}
