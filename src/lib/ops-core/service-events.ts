/**
 * Service events — record completed / missed / partial service per line, location, date, crew.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { ServiceEventRow } from './types';
import type { ServiceEventStatus } from './types';

export interface CreateServiceEventInput {
  orgId: string;
  facilityId: string;
  serviceLineId?: string | null;
  serviceDate: string;
  crewId?: string | null;
  serviceAssignmentId?: string | null;
  status: ServiceEventStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
}

export async function createServiceEvent(input: CreateServiceEventInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('service_events')
    .insert({
      org_id: input.orgId,
      facility_id: input.facilityId,
      service_line_id: input.serviceLineId ?? null,
      service_date: input.serviceDate,
      crew_id: input.crewId ?? null,
      service_assignment_id: input.serviceAssignmentId ?? null,
      status: input.status,
      started_at: input.startedAt ?? null,
      completed_at: input.completedAt ?? null,
      notes: input.notes ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Failed to create service event');
  return data.id;
}

export interface ListServiceEventsParams {
  orgId: string;
  facilityId?: string | null;
  serviceLineId?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
  status?: ServiceEventStatus | null;
  limit?: number;
}

export async function listServiceEvents(params: ListServiceEventsParams): Promise<ServiceEventRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from('service_events')
    .select('*')
    .eq('org_id', params.orgId);
  if (params.facilityId) q = q.eq('facility_id', params.facilityId);
  if (params.serviceLineId) q = q.eq('service_line_id', params.serviceLineId);
  if (params.fromDate) q = q.gte('service_date', params.fromDate);
  if (params.toDate) q = q.lte('service_date', params.toDate);
  if (params.status) q = q.eq('status', params.status);
  q = q.order('service_date', { ascending: false });
  if (params.limit) q = q.limit(params.limit);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ServiceEventRow[];
}
