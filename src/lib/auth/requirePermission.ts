/**
 * Require permission in org for user. Uses request-scoped cached has_permission.
 * Only throws AuthzError (→ redirect to /app/forbidden) when result is false (definitive denial).
 * RPC/DB errors throw generic Error (→ /app/authz-error); invalid orgId/userId throw AuthContextError.
 */
import { headers } from 'next/headers';
import { AuthzError, AuthContextError } from './errors';
import type { PermissionKey } from './permissions';
import { requireMembership } from './requireMembership';
import { hasPermissionCached } from './authz-cache';
import { logAuthzError } from './authz-log';

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function requirePermission(params: {
  orgId: string;
  userId: string;
  permission: PermissionKey;
  pathname?: string | null;
}): Promise<void> {
  const { orgId, userId, permission, pathname } = params;

  // E2E only: simulate transient RPC failure so tests can assert redirect to /app/authz-error
  if (process.env.E2E_AUTHZ_SIMULATE_FAIL === '1') {
    const h = await headers();
    if (h.get('x-test-simulate-authz-fail') === '1') {
      logAuthzError({ message: 'Simulated authz failure (E2E)', orgId, userId, permission, pathname });
      throw new Error('Simulated authz failure for E2E');
    }
  }

  if (!isValidId(orgId)) {
    throw new AuthContextError('NO_ORG', 'Missing or invalid orgId');
  }
  if (!isValidId(userId)) {
    throw new AuthContextError('NO_SESSION', 'Missing or invalid userId');
  }

  await requireMembership({ orgId, userId, pathname });

  const allowed = await hasPermissionCached({
    orgId,
    userId,
    permission,
    pathname,
  });

  if (allowed === true) {
    return;
  }

  throw new AuthzError('FORBIDDEN', `Missing permission: ${permission}`);
}
