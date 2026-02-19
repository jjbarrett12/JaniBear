import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';

/**
 * POST /api/admin/users/disable
 * Set membership status to 'disabled' (customer access off).
 * Allowed: platform admin (any org) OR tenant admin (owner/admin/manager) for the membership's org.
 * Body: { membershipId: string } or { userId: string, tenantId: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const access = await getEffectiveAccessForCurrentUser();
  if (!access) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { membershipId?: string; userId?: string; tenantId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const membershipId = body.membershipId;
  const userId = body.userId;
  const tenantId = body.tenantId;

  if (membershipId) {
    const { data: row, error: fetchErr } = await supabase
      .from('org_members')
      .select('id, org_id')
      .eq('id', membershipId)
      .single();
    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }
    const targetOrgId = row.org_id;
    const activeOrgId = await getActiveOrgId();
    const canAct = access.isPlatformAdmin
      || (access.role && ['owner', 'admin', 'manager'].includes(access.role) && activeOrgId === targetOrgId);
    if (!canAct) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { error: updateErr } = await supabase
      .from('org_members')
      .update({ status: 'disabled' })
      .eq('id', membershipId);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (userId && tenantId) {
    const canAct = access.isPlatformAdmin
      || (access.role && ['owner', 'admin', 'manager'].includes(access.role)
          && (await getActiveOrgId()) === tenantId);
    if (!canAct) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { error: updateErr } = await supabase
      .from('org_members')
      .update({ status: 'disabled' })
      .eq('user_id', userId)
      .eq('org_id', tenantId);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: 'Provide membershipId or (userId + tenantId)' },
    { status: 400 }
  );
}

async function getActiveOrgId(): Promise<string | null> {
  const { getActiveOrgIdFromCookie } = await import('@/lib/user-context');
  return getActiveOrgIdFromCookie();
}
