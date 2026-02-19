import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveAccessForCurrentUser } from '@/lib/access';

/**
 * POST /api/admin/tenants/override-feature
 * Set per-tenant feature override. Platform admin only.
 * Body: { tenantId: string, featureCode: string, enabled: boolean, reason?: string }
 */
export async function POST(request: NextRequest) {
  const access = await getEffectiveAccessForCurrentUser();
  if (!access?.isPlatformAdmin) {
    return NextResponse.json({ error: 'Forbidden: platform admin only' }, { status: 403 });
  }

  let body: { tenantId?: string; featureCode?: string; enabled?: boolean; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const tenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : '';
  const featureCode = typeof body.featureCode === 'string' ? body.featureCode.trim() : '';
  const enabled = body.enabled === true;
  const reason = typeof body.reason === 'string' ? body.reason.trim() : null;

  if (!tenantId || !featureCode) {
    return NextResponse.json({ error: 'Body must include tenantId and featureCode' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: feature } = await supabase
    .from('features')
    .select('id')
    .eq('code', featureCode)
    .single();
  if (!feature) {
    return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
  }

  const { error } = await supabase.from('tenant_feature_overrides').upsert(
    { tenant_id: tenantId, feature_id: feature.id, enabled, reason },
    { onConflict: 'tenant_id,feature_id' }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
