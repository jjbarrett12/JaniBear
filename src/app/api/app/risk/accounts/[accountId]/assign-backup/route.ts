import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/**
 * POST /api/app/risk/accounts/[accountId]/assign-backup
 * Body: { operator_type: 'crew'|'franchisee', operator_id: string }
 * Logs 'backup_assigned' event. MVP: does not remove current operator (backup/assist).
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
    const body = await request.json();
    const operator_type = body?.operator_type as 'crew' | 'franchisee' | undefined;
    const operator_id = body?.operator_id as string | undefined;
    if (!operator_type || !operator_id || !['crew', 'franchisee'].includes(operator_type)) {
      return NextResponse.json({ error: 'Invalid operator_type or operator_id' }, { status: 400 });
    }

    const supabase = await createClient();
    await supabase.from('account_risk_events').insert({
      org_id: orgId,
      account_id: accountId,
      actor_user_id: userId,
      action: 'backup_assigned',
      meta: { operator_type, operator_id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
