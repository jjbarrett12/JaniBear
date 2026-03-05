/**
 * Structured authz logging: [authz] prefix, orgId, userId, permission, pathname.
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
