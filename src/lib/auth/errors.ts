/**
 * Normalized authz errors for redirect/API responses.
 */
export class AuthzError extends Error {
  constructor(
    public readonly code: 'FORBIDDEN' | 'UNAUTHORIZED' | 'NO_ORG' | 'NO_PLAN',
    message: string
  ) {
    super(message);
    this.name = 'AuthzError';
  }
}

export function isAuthzError(e: unknown): e is AuthzError {
  return e instanceof AuthzError;
}
