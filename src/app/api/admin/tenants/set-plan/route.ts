import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';
import { syncPlanState } from '@/lib/billing/plan-source';

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
  const { error } = await syncPlanState(supabase, tenantId, planCode, 'active');
  if (error) return NextResponse.json({ error: (error as { message?: string }).message ?? 'Failed to set plan' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
