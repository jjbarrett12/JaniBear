/**
 * Server-first access resolution: effective entitlements + role permissions.
 * Use from Server Components, Route Handlers, and middleware.
 * Single source: getEffectiveAccess(tenantId, userId).
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export type EffectiveAccess = {
  plan: { code: string; name: string } | null;
  enabledAddons: { code: string; name: string }[];
  effectiveFeatures: Record<string, boolean>;
  role: string | null;
  rolePermissions: Record<string, { canRead: boolean; canWrite: boolean }>;
  membershipStatus: string | null;
  isPlatformAdmin: boolean;
};

/**
 * Resolves plan baseline + add-ons + tenant overrides and user's role permissions.
 * Rules:
 * - Effective feature is ON if (plan enables OR addon enables) AND tenant override does not explicitly disable.
 * - Tenant overrides can force-enable.
 * - User must have active membership; role_permissions define can_read/can_write per feature.
 */
export async function getEffectiveAccess(
  tenantId: string,
  userId: string
): Promise<EffectiveAccess | null> {
  const supabase = await createClient();

  const [entitlementsRes, membershipRes, subRes, addonsRes, rolePermsRes, profileRes] =
    await Promise.all([
      supabase.rpc('get_effective_entitlements', { p_org_id: tenantId }),
      supabase
        .from('org_members')
        .select('role, status')
        .eq('org_id', tenantId)
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('org_subscriptions')
        .select('plan_code, plans(code, name)')
        .eq('org_id', tenantId)
        .eq('status', 'active')
        .maybeSingle(),
      supabase
        .from('org_addons')
        .select('addon_code')
        .eq('org_id', tenantId)
        .or('status.eq.active,status.is.null'),
      supabase.from('role_permissions').select('role, feature_id, can_read, can_write'),
      supabase.from('profiles').select('is_platform_admin').eq('id', userId).maybeSingle(),
    ]);

  const membership = membershipRes.data;
  if (!membership || (membership.status !== 'active' && membership.status !== null)) {
    return null;
  }

  const effectiveFeatures: Record<string, boolean> = {};
  if (entitlementsRes.data && Array.isArray(entitlementsRes.data)) {
    for (const row of entitlementsRes.data as { feature_code: string; enabled: boolean }[]) {
      effectiveFeatures[row.feature_code] = row.enabled;
    }
  }

  const plan = subRes.data?.plans as { code: string; name: string } | null;
  const planInfo = subRes.data?.plan_code
    ? { code: subRes.data.plan_code as string, name: plan?.name ?? subRes.data.plan_code }
    : null;

  const enabledAddons: { code: string; name: string }[] = [];
  if (addonsRes.data && Array.isArray(addonsRes.data) && addonsRes.data.length > 0) {
    const codes = (addonsRes.data as { addon_code: string }[]).map((r) => r.addon_code).filter(Boolean);
    if (codes.length > 0) {
      const { data: addonRows } = await supabase.from('addons').select('code, name').in('code', codes);
      for (const a of addonRows ?? []) {
        enabledAddons.push({ code: (a as { code: string }).code, name: (a as { name: string }).name });
      }
    }
  }

  const role = membership.role ?? null;
  const rolePermissions: Record<string, { canRead: boolean; canWrite: boolean }> = {};
  if (role && rolePermsRes.data && Array.isArray(rolePermsRes.data)) {
    const perRole = (rolePermsRes.data as { role: string; feature_id: string; can_read: boolean; can_write: boolean }[]).filter(
      (r) => r.role === role
    );
    if (perRole.length > 0) {
      const featureIds = [...new Set(perRole.map((r) => r.feature_id))];
      const { data: features } = await supabase.from('features').select('id, code').in('id', featureIds);
      const codeById = new Map((features ?? []).map((f: { id: string; code: string }) => [f.id, f.code]));
      for (const r of perRole) {
        const code = codeById.get(r.feature_id) ?? r.feature_id;
        rolePermissions[code] = { canRead: r.can_read, canWrite: r.can_write };
      }
    }
  }
  if (role && (role === 'owner' || role === 'admin' || role === 'manager')) {
    Object.keys(effectiveFeatures).forEach((code) => {
      if (rolePermissions[code] == null) rolePermissions[code] = { canRead: true, canWrite: true };
    });
  }

  const isPlatformAdmin = (profileRes.data as { is_platform_admin?: boolean } | null)?.is_platform_admin === true;

  return {
    plan: planInfo,
    enabledAddons,
    effectiveFeatures,
    role,
    rolePermissions,
    membershipStatus: membership.status,
    isPlatformAdmin,
  };
}

/**
 * Get effective access for the current user and active org (from cookie or first membership).
 * Returns null if not authenticated or no org.
 */
export async function getEffectiveAccessForCurrentUser(): Promise<EffectiveAccess | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { getActiveOrgIdFromCookie } = await import('@/lib/user-context');
  let activeOrgId = await getActiveOrgIdFromCookie();
  if (!activeOrgId) {
    const { data: first } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();
    activeOrgId = first?.org_id ?? null;
  }
  if (!activeOrgId) return null;

  return getEffectiveAccess(activeOrgId, user.id);
}

/** Check if tenant has a feature enabled (plan + addons + overrides). */
export function hasFeature(access: EffectiveAccess | null, featureCode: string): boolean {
  return Boolean(access?.effectiveFeatures[featureCode]);
}

/** Check if user can read within a feature (role permission or admin). */
export function canReadFeature(access: EffectiveAccess | null, featureCode: string): boolean {
  if (!access) return false;
  if (access.role === 'owner' || access.role === 'admin' || access.role === 'manager') return true;
  return access.rolePermissions[featureCode]?.canRead === true;
}

/** Check if user can write within a feature. */
export function canWriteFeature(access: EffectiveAccess | null, featureCode: string): boolean {
  if (!access) return false;
  if (access.role === 'owner' || access.role === 'admin' || access.role === 'manager') return true;
  return access.rolePermissions[featureCode]?.canWrite === true;
}

// ---------------------------------------------------------------------------
// Server guards (use in Server Components, Route Handlers, layout)
// Return type compatible with API route 401/403 responses.
// ---------------------------------------------------------------------------

export type GuardResult =
  | { ok: true; access: EffectiveAccess }
  | { ok: false; status: 401 | 403; message: string };

/**
 * Require current user to be an active member of a tenant.
 * Use before requireFeature / requirePermission.
 */
export async function requireTenantMember(): Promise<GuardResult> {
  const access = await getEffectiveAccessForCurrentUser();
  if (!access) {
    return { ok: false, status: 401, message: 'Not authenticated or no organization in context' };
  }
  return { ok: true, access };
}

/**
 * Require tenant to have the feature enabled and user to have read access.
 * APIs must call this (or requirePermission) — UI hiding alone is not security.
 */
export async function requireFeature(featureCode: string): Promise<GuardResult> {
  const result = await requireTenantMember();
  if (!result.ok) return result;
  if (!hasFeature(result.access, featureCode)) {
    return { ok: false, status: 403, message: `Feature not enabled: ${featureCode}` };
  }
  if (!canReadFeature(result.access, featureCode)) {
    return { ok: false, status: 403, message: `No read permission for: ${featureCode}` };
  }
  return { ok: true, access: result.access };
}

/**
 * Require specific permission (read or write) within a feature.
 */
export async function requirePermission(
  featureCode: string,
  action: 'read' | 'write'
): Promise<GuardResult> {
  const result = await requireFeature(featureCode);
  if (!result.ok) return result;
  const allowed = action === 'read'
    ? canReadFeature(result.access, featureCode)
    : canWriteFeature(result.access, featureCode);
  if (!allowed) {
    return { ok: false, status: 403, message: `Permission denied: ${featureCode}.${action}` };
  }
  return { ok: true, access: result.access };
}

/**
 * Convert GuardResult to NextResponse for API route handlers.
 */
export function guardToResponse(result: GuardResult): NextResponse {
  return NextResponse.json(
    { error: result.message },
    { status: result.status }
  );
}
