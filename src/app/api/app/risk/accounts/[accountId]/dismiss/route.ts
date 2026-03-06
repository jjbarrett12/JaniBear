import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/**
 * POST /api/app/risk/accounts/[accountId]/dismiss
 * Body: { reason?: string }
 * Sets snapshot status='dismissed', logs event.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.write' });

    const { accountId } = await params;
    let body: { reason?: string } = {};
    try {
      body = await request.json();
    } catch {}
    const supabase = await createClient();

    const { error: upErr } = await supabase
      .from('account_risk_snapshots')
      .update({ status: 'dismissed', updated_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .eq('account_id', accountId);

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    await supabase.from('account_risk_events').insert({
      org_id: orgId,
      account_id: accountId,
      actor_user_id: userId,
      action: 'dismissed',
      meta: { reason: body.reason ?? null },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
