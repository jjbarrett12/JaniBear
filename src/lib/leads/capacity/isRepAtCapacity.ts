/**
 * Check if a rep is at or over capacity (new or working limits).
 * Uses rep_lead_counters for fast checks without full scans.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getRepCapacity, type RepCapacityLimits } from './getRepCapacity';

export interface RepCounterRow {
  user_id: string;
  new_count: number;
  working_count: number;
}

/** True if rep cannot take another "new" lead (new_count >= max_new). */
export async function isRepAtCapacityForNew(
  orgId: string,
  userId: string,
  limits?: RepCapacityLimits
): Promise<boolean> {
  const cap = limits ?? (await getRepCapacity(orgId, userId));
  const supabase = await createClient();
  const { data } = await supabase
    .from('rep_lead_counters')
    .select('new_count, working_count')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  const newCount = (data as { new_count?: number } | null)?.new_count ?? 0;
  const workingCount = (data as { working_count?: number } | null)?.working_count ?? 0;
  if (newCount >= cap.maxNewLeads) return true;
  if (workingCount >= cap.maxWorkingLeads) return true;
  return false;
}

/** Filter user IDs to those under capacity for one more new lead. */
export async function filterCandidatesByCapacity(
  orgId: string,
  userIds: string[]
): Promise<{ eligible: string[]; limitsByUser: Map<string, RepCapacityLimits> }> {
  if (userIds.length === 0) return { eligible: [], limitsByUser: new Map() };
  const supabase = await createClient();
  const { getRepCapacityForUsers } = await import('./getRepCapacity');
  const limitsByUser = await getRepCapacityForUsers(orgId, userIds);
  const { data: rows } = await supabase
    .from('rep_lead_counters')
    .select('user_id, new_count, working_count')
    .eq('org_id', orgId)
    .in('user_id', userIds);

  const counterByUser = new Map(
    (rows ?? []).map((r: { user_id: string; new_count: number; working_count: number }) => [
      r.user_id,
      { new_count: r.new_count, working_count: r.working_count },
    ])
  );

  const eligible: string[] = [];
  for (const uid of userIds) {
    const cap = limitsByUser.get(uid)!;
    const c = counterByUser.get(uid) ?? { new_count: 0, working_count: 0 };
    if (c.new_count < cap.maxNewLeads && c.working_count < cap.maxWorkingLeads) {
      eligible.push(uid);
    }
  }
  return { eligible, limitsByUser };
}
