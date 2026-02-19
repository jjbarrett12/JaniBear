import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';

/**
 * POST /api/admin/tenants/set-plan
 * Set tenant (org) plan. Platform admin only.
 * Body: { tenantId: string, planCode: string }
 */
export async function POST(request: NextRequest) {
  const access = await getEffectiveAccessForCurrentUser();
  if (!access?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden: platform admin only' }, { status: 403 });
  }

  let body: { tenantId?: string; planCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
  const planCode = typeof body.planCode === 'string' ? body.planCode.trim() : '';
  if (!tenantId || !planCode) {
    return NextResponse.json({ error: 'Body must include tenantId and planCode' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('org_subscriptions')
    .upsert(
      { org_id: tenantId, plan_code: planCode, status: 'active' },
      { onConflict: 'org_id' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
