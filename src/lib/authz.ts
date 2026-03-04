/**
 * Server-side authorization: require permission in current org, or can(permission) check.
 * All enforcement is at DB (RLS) + API; this layer gates UI and server actions.
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import type { PermissionKey } from '@/lib/permissions';

/**
 * Get current org id from cookie (for app layout context). Use after requireOrg().
 */
export async function getActiveOrgId(): Promise<string | null> {
  return getActiveOrgIdFromCookie();
}

/**
 * Returns true if the current user has the given permission in the given org.
 * Uses Supabase RPC has_permission(org_id, permission_key).
 */
export async function hasPermission(
  orgId: string,
  permissionKey: PermissionKey
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('has_permission', {
    p_org_id: orgId,
    p_permission_key: permissionKey,
  });
  if (error) return false;
  return data === true;
}

/**
 * Check permission for current user in the given org (or active org from cookie).
 * Use in Server Components: pass orgId from requireOrg() for reliability.
 */
export async function can(
  permissionKey: PermissionKey,
  orgId?: string | null
): Promise<boolean> {
  const resolvedOrgId = orgId ?? (await getActiveOrgId());
  if (!resolvedOrgId) return false;
  return hasPermission(resolvedOrgId, permissionKey);
}

/**
 * Require the given permission in the given org; redirect to dashboard if missing.
 * Call after requireOrg() and pass org.org_id.
 */
export async function requirePermission(
  permissionKey: PermissionKey,
  orgId: string
): Promise<void> {
  const allowed = await hasPermission(orgId, permissionKey);
  if (!allowed) {
    redirect('/app/dashboard');
  }
}
