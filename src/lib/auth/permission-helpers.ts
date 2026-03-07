/**
 * Central server authorization helpers. Single place for permission checks.
 * Site admin always allowed; otherwise membership + role permissions.
 * Do not implement ad-hoc permission logic in pages or actions — use these.
 */
import 'server-only';
import { getCurrentUser } from '@/lib/auth';
import { getActiveOrgId } from './getActiveOrgId';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from './siteAdmin';
import { hasPermissionCached } from './authz-cache';
import { AuthzError, AuthContextError } from './errors';
import { logAuthzDenial } from './authz-log';
import type { PermissionKey, SettingsPermissionKey } from './permissions';

/** Permission key for checks — legacy (PermissionKey) or governance key (string). */
export type AnyPermissionKey = PermissionKey | string;
import { SETTINGS_PERMISSION_KEYS } from './permissions';
import type { MembershipRow } from './requireMembership';
import { requireMembership } from './requireMembership';

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Current session user (alias for getCurrentUser). */
export async function getSessionUser() {
  return getCurrentUser();
}

/** Active org id from cookie/header. Safe fallback to null. */
export async function getActiveOrgIdSafe(): Promise<string | null> {
  return getActiveOrgId();
}

/**
 * Get org membership row for a user in an org. Returns null if not a member.
 */
export async function getOrgMembership(
  orgId: string,
  userId: string
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
 * Returns true if the user has the permission in the org.
 * Site admin always returns true. Otherwise uses cached has_permission RPC.
 */
export async function hasPermission(
  orgId: string,
  userId: string,
  permissionKey: AnyPermissionKey,
  pathname?: string | null
): Promise<boolean> {
  if (await isSiteAdmin(userId)) return true;
  return hasPermissionCached({
    orgId,
    userId,
    permission: permissionKey,
    pathname,
  });
}

/**
 * Require the permission in the org. Throws AuthzError (forbidden), AuthContextError (no session/org), or Error (system).
 * Site admin always passes. On denial, logs structured payload (user_id, org_id, permissionKey, is_site_admin, membershipRole).
 */
export async function requirePermission(params: {
  orgId: string;
  userId: string;
  permission: AnyPermissionKey;
  pathname?: string | null;
}): Promise<void> {
  const { orgId, userId, permission, pathname } = params;

  if (await isSiteAdmin(userId)) return;

  if (!isValidId(orgId)) {
    throw new AuthContextError('NO_ORG', 'Missing or invalid orgId');
  }
  if (!isValidId(userId)) {
    throw new AuthContextError('NO_SESSION', 'Missing or invalid userId');
  }

  const membership = await requireMembership({ orgId, userId, pathname });
  const allowed = await hasPermissionCached({
    orgId,
    userId,
    permission,
    pathname,
  });

  if (allowed === true) return;

  logAuthzDenial({
    userId,
    orgId,
    permissionKey: permission,
    is_site_admin: false,
    membershipRole: membership.role ?? null,
    pathname,
  });
  throw new AuthzError('FORBIDDEN', `Missing permission: ${permission}`);
}

/**
 * Returns which settings permissions the user has in the org. Used for Settings tab visibility.
 * Site admin gets all true.
 */
export async function getSettingsPermissions(
  orgId: string,
  userId: string,
  pathname?: string | null
): Promise<Record<SettingsPermissionKey, boolean>> {
  const result = {} as Record<SettingsPermissionKey, boolean>;
  const admin = await isSiteAdmin(userId);
  if (admin) {
    for (const key of SETTINGS_PERMISSION_KEYS) {
      result[key] = true;
    }
    return result;
  }
  for (const key of SETTINGS_PERMISSION_KEYS) {
    result[key] = await hasPermissionCached({
      orgId,
      userId,
      permission: key,
      pathname,
    });
  }
  return result;
}
