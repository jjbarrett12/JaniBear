/**
 * Permission-based gate for UI. Hides children when the user lacks the required permission.
 * Security: Never rely on this alone — always enforce in server actions, route handlers, and API.
 */
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgId } from '@/lib/auth/getActiveOrgId';
import { hasPermission } from '@/lib/auth/permission-helpers';
import type { ReactNode } from 'react';
import type { PermissionKey } from '@/lib/auth/governance-permissions';

type Props = {
  /** Permission key (governance or legacy) required to see children. */
  permission: PermissionKey;
  /** Optional org id; defaults to active org from context. */
  orgId?: string | null;
  /** Content shown only when user has permission. */
  children: ReactNode;
  /** Optional fallback when permission is missing. */
  fallback?: ReactNode;
};

/**
 * Server component: fetches user and org, checks permission, renders children or fallback.
 * Use for conditional UI (e.g. hide "Invite" when user lacks org.users.invite).
 */
export async function PermissionGate({ permission, orgId: orgIdProp, children, fallback = null }: Props): Promise<ReactNode> {
  const userId = await getCurrentUserId();
  const orgId = orgIdProp ?? (await getActiveOrgId());
  if (!userId || !orgId) return fallback;
  const allowed = await hasPermission(orgId, userId, permission);
  return allowed ? children : fallback;
}
