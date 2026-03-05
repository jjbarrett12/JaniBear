import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health/authz - Verifies membership + a benign has_permission RPC.
 * Returns 200 on success, 503 when not authenticated or when RPC/query fails.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, reason: 'no_session' }, { status: 503 });
    }

    const orgId = await getActiveOrgIdFromCookie();
    if (!orgId) {
      return NextResponse.json({ ok: false, reason: 'no_org' }, { status: 503 });
    }

    const { data: member, error: memberError } = await supabase
      .from('org_members')
      .select('org_id, user_id')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .or('status.eq.active,status.is.null')
      .maybeSingle();

    if (memberError || !member) {
      return NextResponse.json({ ok: false, reason: 'membership_check_failed' }, { status: 503 });
    }

    const { data: perm, error: permError } = await supabase.rpc('has_permission', {
      p_org_id: orgId,
      p_permission_key: 'org.read',
    });

    if (permError) {
      return NextResponse.json({ ok: false, reason: 'permission_check_failed' }, { status: 503 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 503 });
  }
}
