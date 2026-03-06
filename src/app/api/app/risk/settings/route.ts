import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export const dynamic = 'force-dynamic';

/**
 * POST /api/app/risk/settings
 * Body: { enabled, alert_threshold, min_backup_score, require_same_territory, risk_jump_alert }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const orgId = await getActiveOrgIdFromCookie();
    if (!userId || !orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await requirePermission({ orgId, userId, permission: 'ops.write' });

    const body = await request.json();
    const enabled = body.enabled ?? true;
    const alert_threshold = body.alert_threshold ?? 'high';
    const min_backup_score = Math.max(0, Math.min(100, body.min_backup_score ?? 70));
    const require_same_territory = body.require_same_territory ?? true;
    const risk_jump_alert = Math.max(0, body.risk_jump_alert ?? 15);

    const supabase = await createClient();
    const { error } = await supabase.from('risk_settings').upsert(
      {
        org_id: orgId,
        enabled,
        alert_threshold,
        min_backup_score,
        require_same_territory,
        risk_jump_alert,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'org_id' }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Forbidden' }, { status: 403 });
  }
}
