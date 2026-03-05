/**
 * Reads active org from cookie (or header). Use for app layout and permission context.
 */
import { getActiveOrgIdFromCookie } from '@/lib/user-context';

export async function getActiveOrgId(): Promise<string | null> {
  return getActiveOrgIdFromCookie();
}
