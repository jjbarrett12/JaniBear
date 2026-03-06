/**
 * Update rep_lead_counters when lead.assigned_user_id or lead.status changes.
 * Call after any update that affects assignment or status. Keeps counters in sync without full scans.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getLeadStatusBucket } from './leadStatusBucket';

export interface LeadAssignmentChange {
  /** Previous assigned_user_id (null if new lead). */
  prevAssigneeId: string | null;
  /** New assigned_user_id (null if unassigned). */
  newAssigneeId: string | null;
  /** Previous lead status (for bucket to decrement on old assignee). */
  prevStatus: string | null;
  /** New lead status (for bucket to increment on new assignee). */
  newStatus: string | null;
}

function bucketToColumn(bucket: 'new' | 'working' | 'qualified'): 'new_count' | 'working_count' | 'qualified_count' {
  return bucket === 'new' ? 'new_count' : bucket === 'working' ? 'working_count' : 'qualified_count';
}

/** Apply a delta to one rep's counter. Uses raw RPC or upsert to avoid race. */
async function addToCounter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  column: 'new_count' | 'working_count' | 'qualified_count',
  delta: number
): Promise<void> {
  if (delta === 0) return;
  const { data: row } = await supabase
    .from('rep_lead_counters')
    .select('new_count, working_count, qualified_count')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  const current = (row as { new_count: number; working_count: number; qualified_count: number } | null) ?? {
    new_count: 0,
    working_count: 0,
    qualified_count: 0,
  };

  const next = { ...current, [column]: Math.max(0, current[column] + delta), updated_at: new Date().toISOString() };
  await supabase.from('rep_lead_counters').upsert(
    { org_id: orgId, user_id: userId, ...next },
    { onConflict: 'org_id,user_id' }
  );
}

/**
 * Update rep_lead_counters for an assignment/status change.
 * Call after updating lead.assigned_user_id and/or lead.status.
 */
export async function updateRepLeadCounters(
  orgId: string,
  change: LeadAssignmentChange
): Promise<void> {
  const supabase = await createClient();
  const { prevAssigneeId, newAssigneeId, prevStatus, newStatus } = change;

  const prevBucket = getLeadStatusBucket(prevStatus);
  const newBucket = getLeadStatusBucket(newStatus);

  if (prevAssigneeId && prevBucket) {
    const col = bucketToColumn(prevBucket);
    await addToCounter(supabase, orgId, prevAssigneeId, col, -1);
  }
  if (newAssigneeId && newBucket) {
    const col = bucketToColumn(newBucket);
    await addToCounter(supabase, orgId, newAssigneeId, col, 1);
  }
}
