/**
 * Require permission in org for user. Uses DB has_permission RPC (fail closed).
 */
import { createClient } from '@/lib/supabase/server';
import { AuthzError } from './errors';
import type { PermissionKey } from './permissions';
import { requireMembership } from './requireMembership';

export async function requirePermission(params: {
  orgId: string;
  userId: string;
  permission: PermissionKey;
}): Promise<void> {
  await requireMembership({ orgId: params.orgId, userId: params.userId });

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('has_permission', {
    p_org_id: params.orgId,
    p_permission_key: params.permission,
  });

  if (error || data !== true) {
    throw new AuthzError('FORBIDDEN', `Missing permission: ${params.permission}`);
  }
}
