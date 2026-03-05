/**
 * Canonical auth URLs so sign-in works from any origin (PWA, workspace subdomain, etc.).
 * Use for nav, footer, and any "Sign in" / "Log in" links.
 */
const base =
  typeof process.env.NEXT_PUBLIC_APP_URL === 'string' && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    : '';

export const LOGIN_URL = base ? `${base}/auth/login` : '/auth/login';
