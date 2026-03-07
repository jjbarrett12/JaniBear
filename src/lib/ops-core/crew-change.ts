/**
 * Crew change workflow — request → approval/rejection → new assignment.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { endAssignmentAndReplace } from './assignments';
import type { CrewChangeRequestRow } from './types';
import type { CrewChangeRequestStatus } from './types';

export interface CreateCrewChangeRequestInput {
  orgId: string;
  facilityId: string;
  serviceLineId?: string | null;
  reason: string;
  requestedBy: string;
  currentAssignmentId: string;
  replacementCrewId: string;
  notes?: string | null;
}

export async function createCrewChangeRequest(input: CreateCrewChangeRequestInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('crew_change_requests')
    .insert({
      org_id: input.orgId,
      facility_id: input.facilityId,
      service_line_id: input.serviceLineId ?? null,
      reason: input.reason,
      requested_by: input.requestedBy,
      current_assignment_id: input.currentAssignmentId,
      replacement_crew_id: input.replacementCrewId,
      status: 'requested',
      notes: input.notes ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create crew change request');
  return data.id;
}

export interface ApproveCrewChangeInput {
  orgId: string;
  requestId: string;
  approvedBy: string;
  effectiveTo: string;
  replacementSupervisorId?: string | null;
}

/**
 * Approve request: end current assignment, create new one, set request status to 'replaced', set new_assignment_id.
 */
export async function approveCrewChangeRequest(input: ApproveCrewChangeInput): Promise<void> {
  const supabase = await createClient();
  const { data: req } = await supabase
    .from('crew_change_requests')
    .select('*')
    .eq('id', input.requestId)
    .eq('org_id', input.orgId)
    .single();
  if (!req || req.status !== 'requested' || !req.current_assignment_id || !req.replacement_crew_id) {
    throw new Error('Invalid crew change request or already processed');
  }

  const { newId } = await endAssignmentAndReplace({
    orgId: input.orgId,
    assignmentId: req.current_assignment_id,
    effectiveTo: input.effectiveTo,
    replacementCrewId: req.replacement_crew_id,
    replacementSupervisorId: input.replacementSupervisorId,
    createdBy: input.approvedBy,
  });

  await supabase
    .from('crew_change_requests')
    .update({
      status: 'replaced',
      approved_by: input.approvedBy,
      approved_at: new Date().toISOString(),
      new_assignment_id: newId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.requestId)
    .eq('org_id', input.orgId);
}

export async function rejectCrewChangeRequest(params: {
  orgId: string;
  requestId: string;
  rejectedReason: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from('crew_change_requests')
    .update({
      status: 'rejected',
      rejected_reason: params.rejectedReason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.requestId)
    .eq('org_id', params.orgId);
}

export async function getCrewChangeRequests(params: {
  orgId: string;
  facilityId?: string | null;
  status?: CrewChangeRequestStatus | null;
  limit?: number;
}): Promise<CrewChangeRequestRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from('crew_change_requests')
    .select('*')
    .eq('org_id', params.orgId);
  if (params.facilityId) q = q.eq('facility_id', params.facilityId);
  if (params.status) q = q.eq('status', params.status);
  q = q.order('requested_at', { ascending: false });
  if (params.limit) q = q.limit(params.limit);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as CrewChangeRequestRow[];
}
