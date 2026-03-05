import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { MODULE_KEYS, getFeatureCodeForModule } from '@/lib/billing/catalog';
import type { ModuleKey } from '@/lib/billing/catalog';

export const dynamic = 'force-dynamic';

export type EntitlementsResponse = {
  orgId: string;
  modules: Record<ModuleKey, boolean>;
};

/**
 * GET /api/billing/entitlements?org_id=...
 * Returns org's module entitlements (computed from get_effective_entitlements / org_has_feature).
 * If org_id omitted, uses current user's active org from cookie or first membership.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let orgId = request.nextUrl.searchParams.get('org_id');
  if (!orgId) {
    orgId = await getActiveOrgIdFromCookie();
    if (!orgId) {
      const { data: first } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .or('status.eq.active,status.is.null')
        .limit(1)
        .maybeSingle();
      orgId = first?.org_id ?? null;
    }
  }

  if (!orgId) {
    return NextResponse.json({ error: 'No organization in context' }, { status: 400 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .or('status.eq.active,status.is.null')
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const modules: Record<string, boolean> = {};
  for (const key of MODULE_KEYS) {
    const featureCode = getFeatureCodeForModule(key);
    const { data, error } = await supabase.rpc('org_has_feature', {
      p_org_id: orgId,
      p_feature_code: featureCode,
    });
    if (!error && data === true) {
      modules[key] = true;
    } else {
      modules[key] = false;
    }
  }

  const response: EntitlementsResponse = {
    orgId,
    modules: modules as Record<ModuleKey, boolean>,
  };
  return NextResponse.json(response);
}
