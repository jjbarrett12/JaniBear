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

export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') || '/auth/login';
  const safeNext = next.startsWith('/') && !next.includes('//') ? next : '/auth/login';

  const res = NextResponse.redirect(new URL(safeNext, request.url));

  // Clear Supabase auth cookies (sb-*)
  const cookies = request.cookies.getAll();
  for (const c of cookies) {
    if (c.name.startsWith('sb-')) {
      res.cookies.set(c.name, '', COOKIE_OPTS);
    }
  }
  res.cookies.set('active_org_id', '', COOKIE_OPTS);

  return res;
}
