/**
 * Require active membership in org. Returns membership row or throws.
 * Only throws AuthzError when no row (definitive non-member). Query errors throw generic Error after one retry.
 */
import { createClient } from '@/lib/supabase/server';
import { AuthzError, AuthContextError } from './errors';
import { withRetry } from './retry';
import { logAuthzError } from './authz-log';

export type MembershipRow = {
  org_id: string;
  user_id: string;
  role: string;
  status: string | null;
};

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function requireMembership(params: {
  orgId: string;
  userId: string;
  pathname?: string | null;
}): Promise<MembershipRow> {
  const { orgId, userId, pathname } = params;
  if (!isValidId(orgId)) {
    throw new AuthContextError('NO_ORG', 'Missing or invalid orgId');
  }
  if (!isValidId(userId)) {
    throw new AuthContextError('NO_SESSION', 'Missing or invalid userId');
  }

  return withRetry(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('org_members')
      .select('org_id, user_id, role, status')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .or('status.eq.active,status.is.null')
      .maybeSingle();

    if (error) {
      logAuthzError({ message: 'Membership check failed', orgId, userId, pathname, error });
      throw new Error(`Membership check failed: ${error.message}`);
    }
    if (!data) {
      throw new AuthzError('FORBIDDEN', 'Not a member of this organization');
    }
    return data as MembershipRow;
  });
}
