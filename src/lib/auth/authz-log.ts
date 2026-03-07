/**
 * Structured authz logging: [authz] prefix. Server-only; avoid leaking details to client.
 * Uses observability logger for production (Sentry when configured).
 */
import { logError, captureException } from '@/lib/observability';

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
  const meta: Record<string, unknown> = {};
  if (orgId != null) meta.orgId = orgId;
  if (userId != null) meta.userId = userId;
  if (permission != null) meta.permission = permission;
  if (pathname != null) meta.pathname = pathname;
  logError({ message, domain: 'auth', meta, error });
  console.error(PREFIX, JSON.stringify({ message, ...meta, error: error instanceof Error ? error.message : String(error) }));
}

/**
 * Log when auth fails (denial). Include is_site_admin and membershipRole for debugging.
 * Reports to Sentry with domain 'auth' for production visibility (no PII beyond ids).
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
  const err = new Error('Permission denied');
  captureException(err, { domain: 'auth', meta: { permissionKey: params.permissionKey, pathname: params.pathname ?? undefined } });
}
