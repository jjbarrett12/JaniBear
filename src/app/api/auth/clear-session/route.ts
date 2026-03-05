/**
 * Clears Supabase auth cookies and active_org_id so the next request to /auth/login
 * shows the login form instead of "already signed in" (stale cookies).
 * Used when landing redirects to login with ?session=invalid.
 */
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_OPTS = {
  path: '/',
  maxAge: 0,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
};
export const dynamic = 'force-dynamic';

function listCookieNames(request: NextRequest): string[] {
  const fromStore = request.cookies.getAll().map((c) => c.name);
  if (fromStore.length > 0) return fromStore;
  const raw = request.headers.get('cookie');
  if (!raw?.trim()) return [];
  return raw
    .split(';')
    .map((part) => part.trim().split('=')[0]?.trim() ?? '')
    .filter((name) => name.length > 0);
}

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') || '/auth/login';
  const safeNext = next.startsWith('/') && !next.includes('//') ? next : '/auth/login';

  const res = NextResponse.redirect(new URL(safeNext, request.url));

  // Clear Supabase auth cookies (sb-*)
  const cookieNames = listCookieNames(request);
  for (const name of cookieNames) {
    if (name.startsWith('sb-')) {
      res.cookies.set(name, '', COOKIE_OPTS);
    }
  }
  res.cookies.set('active_org_id', '', COOKIE_OPTS);

  return res;
}
