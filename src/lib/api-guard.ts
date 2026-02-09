/**
 * API route guards: auth, org, org-type, and module gating.
 * Use in API route handlers; return NextResponse 401/403 (no redirect).
 * See PERMISSIONS_MODEL.md and JANIBEAR_OS_SYSTEM.md.
 */
import { NextResponse } from 'next/server';
import { getUserContext, type UserContext } from '@/lib/user-context';
import { hasModule, hasCap, isOperator } from '@/lib/user-context';

export type ApiGuardResult =
  | { ok: true; context: UserContext }
  | { ok: false; response: NextResponse };

/**
 * Require authenticated user. Returns context or 401 response.
 */
export async function requireApiAuth(): Promise<ApiGuardResult> {
  const { user, context } = await getUserContext();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true, context };
}

/**
 * Require authenticated user with an active org (from cookie or first membership).
 * Returns context or 401/403 response.
 */
export async function requireApiOrg(): Promise<ApiGuardResult> {
  const result = await requireApiAuth();
  if (!result.ok) return result;
  if (!result.context.activeOrgId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No organization in context; complete onboarding or switch org' },
        { status: 403 }
      ),
    };
  }
  return result;
}

/**
 * Require operator org (franchisee or independent). Use for labor, crews, schedules, execution.
 * Franchisors must not call these; returns 403 with message.
 */
export async function requireOperatorOrg(): Promise<ApiGuardResult> {
  const result = await requireApiOrg();
  if (!result.ok) return result;
  if (!isOperator(result.context)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'This action is only available for operator organizations' },
        { status: 403 }
      ),
    };
  }
  return result;
}

/**
 * Require a specific module (from plan/addons). Use for feature-gated APIs.
 */
export async function requireApiModule(moduleKey: string): Promise<ApiGuardResult> {
  const result = await requireApiOrg();
  if (!result.ok) return result;
  if (!hasModule(result.context, moduleKey)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Module not enabled: ${moduleKey}` },
        { status: 403 }
      ),
    };
  }
  return result;
}

/**
 * Require a capability (from membership.capabilities). Use for fine-grained overrides.
 */
export async function requireApiCap(capKey: string): Promise<ApiGuardResult> {
  const result = await requireApiOrg();
  if (!result.ok) return result;
  if (!hasCap(result.context, capKey)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Capability required: ${capKey}` },
        { status: 403 }
      ),
    };
  }
  return result;
}

/**
 * Require operator org + optional module. Use for labor-related APIs that are also module-gated (e.g. ops).
 */
export async function requireOperatorOrgAndModule(moduleKey: string): Promise<ApiGuardResult> {
  const result = await requireOperatorOrg();
  if (!result.ok) return result;
  if (!hasModule(result.context, moduleKey)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Module not enabled: ${moduleKey}` },
        { status: 403 }
      ),
    };
  }
  return result;
}
