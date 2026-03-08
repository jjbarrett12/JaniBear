/**
 * Multi-org context: active org, org type, role, entitlements.
 * Use for route gating and UI (hasModule, hasCap).
 * Permission model: effective role = roleEnum ?? role (single source of truth). See PERMISSIONS_MODEL.md.
 */
import { createClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';

const ACTIVE_ORG_COOKIE = 'active_org_id';

export type OrgType = 'franchisor' | 'franchisee' | 'independent';

export type UserContext = {
  userId: string;
  activeOrgId: string | null;
  orgType: OrgType | null;
  /** Legacy text role (from org_members.role) */
  role: string | null;
  /** New enum role (fr_* or op_*); use effectiveRole for checks */
  roleEnum: string | null;
  /** Single role for permission checks: roleEnum ?? role */
  effectiveRole: string | null;
  capabilities: Record<string, boolean>;
  planCode: string | null;
  modules: Record<string, boolean>;
};

/** Header set by middleware when org is resolved from path (/org/[slug]) or subdomain. Only set after membership check. */
const RESOLVED_ORG_HEADER = 'x-resolved-org-id';

/**
 * Read active org id from httpOnly cookie (set by API or client after switch).
 * Falls back to Cookie header when cookies() is empty (e.g. on client-side nav).
 * When entering via /org/[slug] or subdomain, cookie is set on the response in the same request,
 * so layout does not see it yet; fall back to x-resolved-org-id from middleware (already validated).
 */
export async function getActiveOrgIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  let c = cookieStore.get(ACTIVE_ORG_COOKIE);
  if (c?.value) return c.value;
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(new RegExp(`${ACTIVE_ORG_COOKIE}=([^;]+)`));
    const raw = match?.[1]?.trim();
    if (raw) return raw?.replace(/^"|"$/g, '') ?? null;
  }
  const resolved = headersList.get(RESOLVED_ORG_HEADER)?.trim();
  return resolved ?? null;
}

/**
 * Get full user context: user, active org (from cookie or first membership), org type, role, entitlements.
 */
export async function getUserContext(): Promise<{
  user: { id: string } | null;
  context: UserContext;
}> {
  const supabase = await createClient();
  const headersList = await headers();

  let resolvedUser = (await supabase.auth.getUser()).data.user;
  if (!resolvedUser) {
    const { data: { session } } = await supabase.auth.getSession();
    resolvedUser = session?.user ?? null;
  }

  const middlewareUserId = headersList.get('x-middleware-user-id');
  const userId = resolvedUser?.id ?? middlewareUserId;

  if (!userId) {
    return {
      user: null,
      context: {
        userId: '',
        activeOrgId: null,
        orgType: null,
        role: null,
        roleEnum: null,
        effectiveRole: null,
        capabilities: {},
        planCode: null,
        modules: {},
      },
    };
  }

  const user = { id: userId };

  const activeOrgId = await getActiveOrgIdFromCookie();

  // role_enum/capabilities added in 019; if column missing or query fails, fallback so dashboard still loads
  type MemberRow = { org_id: string; role: string | null; role_enum?: string | null; capabilities?: Record<string, boolean> | null; organizations?: { org_type?: string } | null };
  let orgs: MemberRow[] = [];
  const { data: fullData, error: fullError } = await supabase
    .from('org_members')
    .select('org_id, role, role_enum, capabilities, organizations(org_type)')
    .eq('user_id', user.id);
  if (!fullError && fullData) {
    orgs = fullData;
  } else {
    const { data: fallbackData } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(org_type)')
      .eq('user_id', user.id);
    orgs = fallbackData ?? [];
  }
  const firstOrgId = orgs[0]?.org_id ?? null;
  const effectiveOrgId = (activeOrgId && orgs.some((m) => m.org_id === activeOrgId))
    ? activeOrgId
    : firstOrgId;

  let orgType: OrgType | null = null;
  let role: string | null = null;
  let roleEnum: string | null = null;
  let effectiveRole: string | null = null;
  let capabilities: Record<string, boolean> = {};
  let planCode: string | null = null;
  let modules: Record<string, boolean> = {};

  if (effectiveOrgId) {
    const mem = orgs.find((m) => m.org_id === effectiveOrgId);
    const org = mem?.organizations as { org_type?: string } | null;
    orgType = (org?.org_type as OrgType) ?? null;
    role = mem?.role ?? null;
    roleEnum = mem?.role_enum ?? null;
    const caps = mem?.capabilities as Record<string, boolean> | null;
    capabilities = caps ?? {};
    effectiveRole = roleEnum ?? role;

    const { data: sub } = await supabase
      .from('org_subscriptions')
      .select('plan_code, plans(modules)')
      .eq('org_id', effectiveOrgId)
      .eq('status', 'active')
      .maybeSingle();

    if (sub?.plan_code) {
      planCode = sub.plan_code;
      const p = sub.plans as { modules?: Record<string, boolean> } | null;
      modules = p?.modules ?? {};
    }
  }

  return {
    user: { id: user.id },
    context: {
      userId: user.id,
      activeOrgId: effectiveOrgId,
      orgType,
      role,
      roleEnum,
      effectiveRole,
      capabilities,
      planCode,
      modules,
    },
  };
}

/**
 * Check if the current org has a module enabled (from plan or addons).
 */
export function hasModule(context: UserContext, moduleKey: string): boolean {
  return Boolean(context.modules[moduleKey]);
}

/**
 * Check if the current user has a capability (from membership.capabilities).
 */
export function hasCap(context: UserContext, capKey: string): boolean {
  return Boolean(context.capabilities[capKey]);
}

/**
 * Check if context is franchisor org.
 */
export function isFranchisor(context: UserContext): boolean {
  return context.orgType === 'franchisor';
}

/**
 * Check if context is operator org (franchisee or independent).
 */
export function isOperator(context: UserContext): boolean {
  return context.orgType === 'franchisee' || context.orgType === 'independent';
}
