import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/**
 * GET /api/app/risk/accounts/[accountId]
 * Returns risk snapshot + recent events + recommended backups.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const { accountId } = await params;
    const supabase = await createClient();

    const { data: snapshot, error: snapErr } = await supabase
      .from('account_risk_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('account_id', accountId)
      .maybeSingle();

    if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 });

    const { data: events } = await supabase
      .from('account_risk_events')
      .select('id, action, actor_user_id, meta, created_at')
      .eq('org_id', orgId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(20);

    const { data: account } = await supabase
      .from('accounts')
      .select('id, name, status')
      .eq('id', accountId)
      .eq('org_id', orgId)
      .single();

    return NextResponse.json({
      snapshot: snapshot ?? null,
      events: events ?? [],
      account: account ?? null,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
