/**
 * Require active membership in org. Returns membership row or throws.
 */
import { createClient } from '@/lib/supabase/server';
import { AuthzError } from './errors';

export type MembershipRow = {
  org_id: string;
  user_id: string;
  role: string;
  status: string | null;
};

export async function requireMembership(params: {
  orgId: string;
  userId: string;
}): Promise<MembershipRow> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, user_id, role, status')
    .eq('org_id', params.orgId)
    .eq('user_id', params.userId)
    .or('status.eq.active,status.is.null')
    .maybeSingle();

  if (error || !data) {
    throw new AuthzError('FORBIDDEN', 'Not a member of this organization');
  }
  return data as MembershipRow;
}
