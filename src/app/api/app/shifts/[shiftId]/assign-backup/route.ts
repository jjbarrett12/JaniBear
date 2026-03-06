import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/**
 * POST /api/app/shifts/[shiftId]/assign-backup
 * Body: { operator_type: 'crew'|'franchisee', operator_id: string }
 * Sets shift_coverage.backup_operator_id, backup_operator_type, coverage_status = backup_assigned.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shiftId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.write' });

    const { shiftId } = await params;
    const body = await request.json();
    const operator_type = body?.operator_type as 'crew' | 'franchisee' | undefined;
    const operator_id = body?.operator_id as string | undefined;
    if (!operator_type || !operator_id || !['crew', 'franchisee'].includes(operator_type)) {
      return NextResponse.json({ error: 'Invalid operator_type or operator_id' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: row, error: fetchErr } = await supabase
      .from('shift_coverage')
      .select('id, org_id, coverage_status')
      .eq('id', shiftId)
      .eq('org_id', orgId)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Shift coverage not found' }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from('shift_coverage')
      .update({
        backup_operator_type: operator_type,
        backup_operator_id: operator_id,
        coverage_status: 'backup_assigned',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .eq('org_id', orgId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    await supabase.from('shift_coverage_events').insert({
      org_id: orgId,
      shift_coverage_id: shiftId,
      action: 'backup_assigned',
      actor_user_id: userId,
      meta: { operator_type, operator_id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
