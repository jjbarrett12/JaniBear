/**
 * Require permission in org for user. Site admin always allowed; else membership + role permissions.
 * Only throws AuthzError (→ redirect to /app/forbidden) when result is false (definitive denial).
 * RPC/DB errors throw generic Error (→ /app/authz-error); invalid orgId/userId throw AuthContextError.
 * Central implementation in permission-helpers; this adds E2E hook and re-exports.
 */
import { headers } from 'next/headers';
import type { PermissionKey } from './permissions';
import { logAuthzError } from './authz-log';
import { requirePermission as requirePermissionImpl } from './permission-helpers';

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

  await requirePermissionImpl(params);
}
