/**
 * Server auth utilities for governance and authorization.
 * Use in server actions, route handlers, and API endpoints.
 * Authorization decisions always use permissions, not role names.
 */
import 'server-only';
import { getCurrentUser as getCurrentUserFromAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from './siteAdmin';
import { hasPermissionCached } from './authz-cache';
import { requireMembership } from './requireMembership';
import { requirePermission as requirePermissionImpl } from './permission-helpers';
import { AuthzError, AuthContextError } from './errors';
import { logAuthzDenial } from './authz-log';
import type { MembershipRow } from './requireMembership';
import type { PermissionKey } from './governance-permissions';

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Current session user. Re-export for use in server actions and route handlers. */
export async function getCurrentUser() {
  return getCurrentUserFromAuth();
}

/**
 * Get org membership for a user in an org. Returns null if not a member.
 * Use for membership checks before permission checks.
 */
export async function getOrgMembership(
  userId: string,
  orgId: string
): Promise<MembershipRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('org_members')
    .select('org_id, user_id, role, status')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .or('status.eq.active,status.is.null')
    .maybeSingle();
  if (error || !data) return null;
  return data as MembershipRow;
}

/**
 * Get effective permission keys for a user in an org (gov + legacy via RPC).
 * Used for UI gating and bulk checks. Site admin returns all governance keys.
 */
export async function getUserPermissionsForOrg(
  userId: string,
  orgId: string
): Promise<Set<string>> {
  if (await isSiteAdmin(userId)) {
    const { GOVERNANCE_PERMISSIONS } = await import('./governance-permissions');
    return new Set(GOVERNANCE_PERMISSIONS as unknown as string[]);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_my_permissions_for_org', {
    p_org_id: orgId,
  });
  if (error || !Array.isArray(data)) return new Set();
  return new Set(data as string[]);
}

/**
 * Require that the user is a member of the org. Throws AuthzError if not.
 */
export async function requireOrgMember(
  userId: string,
  orgId: string
): Promise<MembershipRow> {
  if (!isValidId(orgId)) throw new AuthContextError('NO_ORG', 'Missing or invalid orgId');
  if (!isValidId(userId)) throw new AuthContextError('NO_SESSION', 'Missing or invalid userId');
  const membership = await requireMembership({ orgId, userId });
  return membership;
}

/**
 * Require the permission in the org. Throws AuthzError (forbidden) or AuthContextError (no session/org).
 * Site admin always passes. Use in server actions and route handlers.
 */
export async function requirePermission(
  userId: string,
  orgId: string,
  permissionKey: PermissionKey
): Promise<void> {
  if (await isSiteAdmin(userId)) return;
  if (!isValidId(orgId)) throw new AuthContextError('NO_ORG', 'Missing or invalid orgId');
  if (!isValidId(userId)) throw new AuthContextError('NO_SESSION', 'Missing or invalid userId');
  await requirePermissionImpl({
    orgId,
    userId,
    permission: permissionKey,
    pathname: null,
  });
}

/**
 * Require at least one of the given permissions. Throws AuthzError if the user has none.
 */
export async function requireAnyPermission(
  userId: string,
  orgId: string,
  permissionKeys: PermissionKey[]
): Promise<void> {
  if (await isSiteAdmin(userId)) return;
  if (!isValidId(orgId)) throw new AuthContextError('NO_ORG', 'Missing or invalid orgId');
  if (!isValidId(userId)) throw new AuthContextError('NO_SESSION', 'Missing or invalid userId');
  await requireOrgMember(userId, orgId);
  for (const key of permissionKeys) {
    const allowed = await hasPermissionCached({
      orgId,
      userId,
      permission: key,
      pathname: null,
    });
    if (allowed) return;
  }
  logAuthzDenial({
    userId,
    orgId,
    permissionKey: permissionKeys.join('|'),
    is_site_admin: false,
    membershipRole: null,
    pathname: null,
  });
  throw new AuthzError('FORBIDDEN', `Missing any of: ${permissionKeys.join(', ')}`);
}
