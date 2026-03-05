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

/** Thrown when orgId/userId are missing or invalid (context/session issue). */
export class AuthContextError extends Error {
  constructor(
    public readonly code: 'NO_SESSION' | 'NO_ORG',
    message: string
  ) {
    super(message);
    this.name = 'AuthContextError';
  }
}

export function isAuthzError(e: unknown): e is AuthzError {
  return e instanceof AuthzError;
}

export function isAuthContextError(e: unknown): e is AuthContextError {
  return e instanceof AuthContextError;
}

/** Redirect path for AuthContextError: no session => login, session but no org => join-org. */
export function getAuthContextRedirectPath(code: AuthContextError['code']): string {
  return code === 'NO_SESSION' ? '/auth/login' : '/app/join-org';
}
