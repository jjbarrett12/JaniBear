/**
 * Structured authz logging: [authz] prefix. Server-only; avoid leaking details to client.
 */
const PREFIX = '[authz]';

export function logAuthzError(params: {
  message: string;
  orgId?: string | null;
  userId?: string | null;
  permission?: string;
  pathname?: string | null;
  error?: unknown;
}): void {
  const { message, orgId, userId, permission, pathname, error } = params;
  const payload: Record<string, unknown> = { message };
  if (orgId != null) payload.orgId = orgId;
  if (userId != null) payload.userId = userId;
  if (permission != null) payload.permission = permission;
  if (pathname != null) payload.pathname = pathname;
  if (error != null) payload.error = error instanceof Error ? error.message : String(error);
  console.error(PREFIX, JSON.stringify(payload));
}

/**
 * Log when auth fails (denial). Include is_site_admin and membershipRole for debugging.
 * Call only on server; do not expose to client.
 */
export function logAuthzDenial(params: {
  userId: string;
  orgId: string;
  permissionKey: string;
  is_site_admin: boolean;
  membershipRole: string | null;
  pathname?: string | null;
}): void {
  const payload = {
    message: 'Permission denied',
    userId: params.userId,
    orgId: params.orgId,
    permissionKey: params.permissionKey,
    is_site_admin: params.is_site_admin,
    membershipRole: params.membershipRole,
    pathname: params.pathname ?? undefined,
  };
  console.error(PREFIX, JSON.stringify(payload));
}
