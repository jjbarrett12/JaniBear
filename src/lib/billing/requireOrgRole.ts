/**
 * Require current user to have a seat-admin role (kodiak, super_kodiak) or legacy owner/admin.
 * Used for billing and seat token management.
 */
import { createClient } from '@/lib/supabase/server';
import { AuthzError } from '@/lib/auth/errors';

const SEAT_ADMIN_ROLES = ['kodiak', 'super_kodiak', 'owner', 'admin', 'org.owner', 'org.admin'] as const;

export type SeatAdminRole = (typeof SEAT_ADMIN_ROLES)[number];

export async function requireOrgRole(params: {
  orgId: string;
  allowedRoles: readonly string[];
}): Promise<{ orgId: string; userId: string; role: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new AuthzError('UNAUTHORIZED', 'Not signed in');

  const { data: member, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', params.orgId)
    .eq('user_id', user.id)
    .or('status.eq.active,status.is.null')
    .maybeSingle();

  if (error || !member) {
    throw new AuthzError('FORBIDDEN', 'Not a member of this organization');
  }

  const role = (member.role ?? '').toLowerCase();
  const allowed = params.allowedRoles.map((r) => r.toLowerCase());
  if (!allowed.includes(role)) {
    throw new AuthzError('FORBIDDEN', 'Insufficient role for this action');
  }

  return { orgId: params.orgId, userId: user.id, role };
}

export async function requireOrgSeatAdmin(orgId: string): Promise<{ orgId: string; userId: string; role: string }> {
  return requireOrgRole({ orgId, allowedRoles: SEAT_ADMIN_ROLES });
}
