/**
 * Billing/entitlement errors for upgrade paywall and routing.
 */
import type { ModuleKey } from './catalog';

export class EntitlementError extends Error {
  constructor(
    public readonly moduleKey: ModuleKey,
    public readonly orgId: string,
    message: string,
    public readonly pathname?: string | null
  ) {
    super(message);
    this.name = 'EntitlementError';
  }
}

export function isEntitlementError(e: unknown): e is EntitlementError {
  return e instanceof EntitlementError;
}
