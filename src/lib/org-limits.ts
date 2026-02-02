import { createClient } from '@/lib/supabase/server';

export async function checkSeatLimit(orgId: string) {
  const supabase = await createClient();

  // Get org limit
  const { data: org } = await supabase
    .from('organizations')
    .select('seat_limit, plan')
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
