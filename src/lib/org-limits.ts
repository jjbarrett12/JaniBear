import { createClient } from '@/lib/supabase/server';

/**
 * Seat limit check. Uses organizations.seat_limit (set by checkout/commit-seats).
 * Plan tier is canonical in org_subscriptions.plan_code; organizations.plan is legacy sync only.
 */
export async function checkSeatLimit(orgId: string) {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('seat_limit')
    .eq('id', orgId)
    .single();

  if (!org) throw new Error('Organization not found');

  // Count active members
  const { count } = await supabase
    .from('org_members')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('status', 'active');

  if ((count || 0) >= (org.seat_limit || 5)) {
    return { 
      allowed: false, 
      limit: org.seat_limit, 
      current: count,
      message: `Seat limit reached (${count}/${org.seat_limit}). Please upgrade your plan.`
    };
  }

  return { allowed: true, limit: org.seat_limit, current: count };
}
