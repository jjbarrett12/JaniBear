/**
 * Server-only: require org to have the given module/add-on entitlement.
 * Site admins bypass. Throws EntitlementError when module is not enabled (→ redirect to upgrade page).
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isSiteAdmin } from '@/lib/auth/siteAdmin';
import {
  type ModuleKey,
  getFeatureCodeForModule,
  isValidModuleKey,
} from './catalog';
import { EntitlementError } from './errors';

export type RequireEntitlementParams = {
  orgId: string;
  userId: string;
  moduleKey: ModuleKey;
  pathname?: string | null;
};

/**
 * Returns whether the org has the given module enabled (plan or addon).
 * Site admins are treated as having the entitlement. Does not throw.
 */
export async function hasEntitlement(
  orgId: string,
  userId: string,
  moduleKey: ModuleKey
): Promise<boolean> {
  if (!isValidModuleKey(moduleKey)) return false;
  const isAdmin = await isSiteAdmin(userId);
  if (isAdmin) return true;
  const featureCode = getFeatureCodeForModule(moduleKey);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('org_has_feature', {
    p_org_id: orgId,
    p_feature_code: featureCode,
  });
  return !error && data === true;
}

/**
 * Ensures the org has the given module enabled (plan or addon).
 * If the user is a site admin, skips the check. Otherwise uses org_has_feature RPC.
 * Throws EntitlementError when not enabled (so caller can redirect to /app/upgrade?module=...).
 */
export async function requireEntitlement(
  params: RequireEntitlementParams
): Promise<void> {
  const { orgId, userId, moduleKey, pathname } = params;

  if (!isValidModuleKey(moduleKey)) {
    throw new Error(`Invalid module key: ${moduleKey}`);
  }

  const isAdmin = await isSiteAdmin(userId);
  if (isAdmin) return;

  const featureCode = getFeatureCodeForModule(moduleKey);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('org_has_feature', {
    p_org_id: orgId,
    p_feature_code: featureCode,
  });

  if (error) {
    throw new Error(`Entitlement check failed: ${error.message}`);
  }

  if (data === true) return;

  throw new EntitlementError(
    moduleKey,
    orgId,
    `Module not enabled: ${moduleKey}`,
    pathname
  );
}
