/**
 * Request-scoped permission cache. Deduplicates has_permission RPC calls
 * for the same (orgId, userId, permission) within a single request/render.
 * Server-only; do not import in client components.
 */
import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { withRetry } from './retry';
import { logAuthzError } from './authz-log';

export type HasPermissionCachedInput = {
  orgId: string;
  userId: string;
  permission: string;
  pathname?: string | null;
};

/**
 * Performs a single RPC call and returns the boolean result.
 * Used internally by the cached function.
 */
async function fetchPermissionUncached(
  orgId: string,
  permission: string,
  pathname: string | null | undefined
): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[authz-cache] RPC has_permission', { orgId, permission });
  }

  const result = await withRetry(
    async (): Promise<boolean> => {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('has_permission', {
        p_org_id: orgId,
        p_permission_key: permission,
      });

      if (error) {
        logAuthzError({
          message: 'Permission check failed',
          orgId,
          userId: undefined,
          permission,
          pathname,
          error,
        });
        throw new Error(`Permission check failed: ${error.message}`);
      }

      if (data === true) return true;
      if (data === false) return false;

      throw new Error('Permission check failed: unexpected result');
    },
    { maxAttempts: 2, baseMs: 100 }
  );

  return result;
}

/**
 * Cached permission check. Within a single request, repeated calls with the
 * same (orgId, userId, permission) return the same promise and do not
 * trigger additional RPC calls.
 */
const getCachedPermission = cache(
  async (
    orgId: string,
    userId: string,
    permission: string,
    pathname: string | null | undefined
  ): Promise<boolean> => {
    return fetchPermissionUncached(orgId, permission, pathname);
  }
);

/**
 * Returns whether the user has the given permission in the org.
 * Uses request-scoped cache; repeated (orgId, userId, permission) in the
 * same request only hit the RPC once.
 */
export async function hasPermissionCached(
  input: HasPermissionCachedInput
): Promise<boolean> {
  const { orgId, userId, permission, pathname } = input;
  return getCachedPermission(orgId, userId, permission, pathname ?? null);
}

/**
 * Dev-only: no-op in production. In development, call after a request
 * if you need to inspect cache behavior (e.g. in tests).
 * React cache() does not expose hit/miss counts; this is a placeholder
 * for future ALS-based counters if needed.
 */
export function getAuthzCacheStats(): { hits: number; misses: number } {
  if (process.env.NODE_ENV === 'production') {
    return { hits: 0, misses: 0 };
  }
  return { hits: 0, misses: 0 };
}
