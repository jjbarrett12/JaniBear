/**
 * Require org-level feature flag. Fails closed (403) if feature not enabled.
 */
import { createClient } from '@/lib/supabase/server';
import { AuthzError } from './errors';
import type { FeatureKey } from './features';

export async function requireFeature(params: {
  orgId: string;
  feature: FeatureKey;
}): Promise<void> {
  const supabase = await createClient();

  // Prefer org_features table (simple add-on flags)
  const { data: row } = await supabase
    .from('org_features')
    .select('enabled')
    .eq('org_id', params.orgId)
    .eq('feature_key', params.feature)
    .maybeSingle();

  if (row?.enabled === true) return;

  // Fallback: org_has_feature RPC if exists (plan/addon entitlements)
  const { data: hasFeature } = await supabase.rpc('org_has_feature', {
    p_org_id: params.orgId,
    p_feature_code: params.feature,
  });
  if (hasFeature === true) return;

  throw new AuthzError('FORBIDDEN', `Feature not enabled: ${params.feature}`);
}
