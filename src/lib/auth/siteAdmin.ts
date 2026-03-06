/**
 * Site owner / super-admin check. Bypasses entitlements and RBAC when true.
 * Server-only. Checks: SITE_ADMIN_USER_IDS env, profiles.is_site_admin (DB), platform admin.
 */
import 'server-only';
import { getIsPlatformAdmin } from '@/lib/platform-guard';
import { createClient } from '@/lib/supabase/server';

const SITE_ADMIN_IDS_KEY = 'SITE_ADMIN_USER_IDS';

let cachedIds: string[] | null = null;

function getSiteAdminUserIds(): string[] {
  if (cachedIds !== null) return cachedIds;
  const raw = process.env[SITE_ADMIN_IDS_KEY];
  if (!raw || typeof raw !== 'string') {
    cachedIds = [];
    return cachedIds;
  }
  cachedIds = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return cachedIds;
}

/**
 * Returns true if the user is a site owner/super-admin (env list, DB profiles.is_site_admin, or platform admin).
 * Use to bypass entitlement and permission checks in production.
 */
export async function isSiteAdmin(userId: string): Promise<boolean> {
  const ids = getSiteAdminUserIds();
  if (ids.includes(userId)) return true;
  if (await getIsPlatformAdmin(userId)) return true;
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('is_site_admin')
    .eq('id', userId)
    .maybeSingle();
  return (data as { is_site_admin?: boolean } | null)?.is_site_admin === true;
}
