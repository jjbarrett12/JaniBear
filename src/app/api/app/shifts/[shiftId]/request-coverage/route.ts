import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/**
 * POST /api/app/shifts/[shiftId]/request-coverage
 * Sets shift_coverage.coverage_status = 'coverage_needed', creates alert for ops dashboard.
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
    const supabase = await createClient();
    const { data: row, error: fetchErr } = await supabase
      .from('shift_coverage')
      .select('id, org_id, account_id, facility_id, shift_date, start_time')
      .eq('id', shiftId)
      .eq('org_id', orgId)
      .single();

    if (fetchErr || !row) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from('shift_coverage')
      .update({
        coverage_status: 'coverage_needed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', shiftId)
      .eq('org_id', orgId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    const { data: account } = await supabase
      .from('accounts')
      .select('name')
      .eq('id', (row as { account_id: string }).account_id)
      .single();
    const accountName = (account as { name?: string } | null)?.name ?? 'Account';

    await supabase.from('alerts').insert({
      org_id: orgId,
      type: 'account_at_risk',
      severity: 'high',
      entity_type: 'shift_coverage',
      entity_id: shiftId,
      title: 'Coverage gap',
      body: `Shift coverage needed: ${accountName} on ${(row as { shift_date: string }).shift_date} at ${(row as { start_time: string }).start_time}`,
      status: 'open',
      signals: [{ label: 'Shift', value: (row as { start_time: string }).start_time }],
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
