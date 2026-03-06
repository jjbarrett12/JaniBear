/**
 * Ensure only org owner/admin can run import and rollback.
 */

import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { requirePermission } from '@/lib/auth/requirePermission';

export async function requireImportPermission(): Promise<{ userId: string; orgId: string }> {
  const userId = await getCurrentUserId();
  const orgId = await getActiveOrgIdFromCookie();
  if (!userId || !orgId) throw new Error('Unauthorized');
  await requirePermission({ orgId, userId, permission: 'accounts.write' });
  return { userId, orgId };
}
