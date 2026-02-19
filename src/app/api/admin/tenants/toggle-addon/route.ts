import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';

/**
 * POST /api/admin/tenants/toggle-addon
 * Enable or disable an add-on for a tenant. Platform admin only.
 * Body: { tenantId: string, addonCode: string, enabled: boolean }
 */
export async function POST(request: NextRequest) {
  const access = await getEffectiveAccessForCurrentUser();
  if (!access?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden: platform admin only' }, { status: 403 });
  }

  let body: { tenantId?: string; addonCode?: string; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
  const addonCode = typeof body.addonCode === 'string' ? body.addonCode.trim() : '';
  const enabled = body.enabled === true;

  if (!tenantId || !addonCode) {
    return NextResponse.json({ error: 'Body must include tenantId and addonCode' }, { status: 400 });
  }

  const supabase = await createClient();
  if (enabled) {
    const { error } = await supabase.from('org_addons').upsert(
      { org_id: tenantId, addon_code: addonCode, status: 'active' },
      { onConflict: 'org_id,addon_code' }
    );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('org_addons')
      .delete()
      .eq('org_id', tenantId)
      .eq('addon_code', addonCode);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
