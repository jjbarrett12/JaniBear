import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/** GET /api/app/ops/crews — list crews for current org (id, name) for dropdowns. */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.read' });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('crews')
      .select('id, name')
      .eq('org_id', orgId)
      .order('name');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to list crews' }, { status: 500 });
  }
}
