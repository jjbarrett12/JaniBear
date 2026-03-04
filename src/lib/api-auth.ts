/**
 * Shared helpers for API routes: session, org membership, permission checks.
 * Every /api/orgs/* route must validate session and org_id + permission.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { PermissionKey } from '@/lib/permissions';

export type ApiAuthResult =
  | { ok: true; userId: string; orgId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse };

/**
 * Require authenticated user. Returns userId and supabase client or 401 response.
 */
export async function requireApiAuth(): Promise<
  | { ok: true; userId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { ok: true, userId: user.id, supabase };
}

/**
 * Require auth + org membership for orgId (from route param). Returns 403 if not member.
 */
export async function requireOrgMember(
  orgId: string
): Promise<
  | { ok: true; userId: string; orgId: string; supabase: Awaited<ReturnType<typeof createClient>> }
  | { ok: false; response: NextResponse }
> {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth;

  const { data: membership } = await auth.supabase
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', auth.userId)
    .or('status.eq.active,status.is.null')
    .maybeSingle();

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { ok: true, userId: auth.userId, orgId, supabase: auth.supabase };
}

/**
 * Require auth + org membership + specific permission. Returns 403 if no permission.
 */
export async function requireOrgPermission(
  orgId: string,
  permissionKey: PermissionKey
): Promise<ApiAuthResult> {
  const member = await requireOrgMember(orgId);
  if (!member.ok) return member;

  const { data: hasPerm } = await member.supabase.rpc('has_permission', {
    p_org_id: orgId,
    p_permission_key: permissionKey,
  });
  if (hasPerm !== true) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return member;
}
