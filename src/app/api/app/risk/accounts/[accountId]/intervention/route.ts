import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

const DEFAULT_CHECKLIST = [
  { id: '1', title: 'Review QC and complaints with operator', owner_user_id: null, due_date: null, done: false },
  { id: '2', title: 'Schedule site walkthrough', owner_user_id: null, due_date: null, done: false },
  { id: '3', title: 'Document action plan and follow-up', owner_user_id: null, due_date: null, done: false },
];

/**
 * POST /api/app/risk/accounts/[accountId]/intervention
 * Creates an intervention plan with default checklist, logs event.
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
    const supabase = await createClient();

    const { data: snapshot } = await supabase
      .from('account_risk_snapshots')
      .select('id')
      .eq('org_id', orgId)
      .eq('account_id', accountId)
      .maybeSingle();

    const { data: intervention, error: insErr } = await supabase
      .from('account_interventions')
      .insert({
        org_id: orgId,
        account_id: accountId,
        risk_snapshot_id: (snapshot as { id: string } | null)?.id ?? null,
        status: 'open',
        checklist: DEFAULT_CHECKLIST,
        created_by: userId,
      })
      .select('id')
      .single();

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

    await supabase.from('account_risk_events').insert({
      org_id: orgId,
      account_id: accountId,
      actor_user_id: userId,
      action: 'intervention_created',
      meta: { intervention_id: (intervention as { id: string })?.id },
    });

    return NextResponse.json({ ok: true, intervention_id: (intervention as { id: string })?.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
