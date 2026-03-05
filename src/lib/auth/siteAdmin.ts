/**
 * Site owner / super-admin check. Bypasses entitlements and RBAC when true.
 * Server-only. Use SITE_ADMIN_USER_IDS env (comma-separated UUIDs) or platform admin as fallback.
 */
import 'server-only';
import { getIsPlatformAdmin } from '@/lib/platform-guard';

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
 * Returns true if the user is a site owner/super-admin (env list or platform admin).
 * Use to bypass entitlement and permission checks in production.
 */
export async function isSiteAdmin(userId: string): Promise<boolean> {
  const ids = getSiteAdminUserIds();
  if (ids.includes(userId)) return true;
  return getIsPlatformAdmin(userId);
}
