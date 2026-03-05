/**
 * Post-login landing — see project root AUTH_FLOW.md.
 * Sets active_org_id and redirects to dashboard or onboarding.
 * Uses request.cookies (and Cookie header fallback) so we see the same session as the browser sent.
 * On Vercel Edge / some runtimes, request.cookies can be empty; parsing Cookie header fixes "already signed in" → bounce back to login.
 */
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const GUARD_DEBUG = process.env.NODE_ENV === 'development' && (process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.NEXT_PUBLIC_GUARD_DEBUG === '1' || process.env.DEBUG_AUTH === '1');

function getCookiesFromRequest(request: NextRequest): { name: string; value: string }[] {
  const fromStore = request.cookies.getAll();
  if (fromStore.length > 0) return fromStore;
  const raw = request.headers.get('cookie');
  if (!raw?.trim()) return [];
  return raw.split(';').map((part) => {
    const eq = part.trim().indexOf('=');
    if (eq <= 0) return { name: '', value: '' };
    return {
      name: part.slice(0, eq).trim(),
      value: part.slice(eq + 1).trim(),
    };
  }).filter((c) => c.name.length > 0);
}

async function handleLanding(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return getCookiesFromRequest(request);
        },
        setAll() {
          // Session refresh cookies: not applied here; landing only reads session and redirects.
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const allCookies = getCookiesFromRequest(request);
  const sbCookieCount = allCookies.filter((c) => c.name.startsWith('sb-')).length;
  if (GUARD_DEBUG) {
    console.log('[AUTH_DEBUG] GET /api/auth/landing', { hasUser: !!user, sbCookieCount });
  }

  if (!user) {
    // Transient missing cookie (e.g. redirect race): do not clear session. Only clear when we have sb-* cookies but invalid session.
    if (sbCookieCount === 0) {
      if (GUARD_DEBUG) console.log('[GUARD] landing path=/api/auth/landing session=false sbCookieCount=0 reason=missing_cookie redirect=login');
      return NextResponse.redirect(new URL('/auth/login?reason=missing_cookie', request.url));
    }
    if (GUARD_DEBUG) console.log('[GUARD] landing path=/api/auth/landing session=false sbCookieCount=' + sbCookieCount + ' reason=invalid_session redirect=clear-session');
    return NextResponse.redirect(new URL('/api/auth/clear-session?next=/auth/login', request.url));
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.org_id) {
    if (GUARD_DEBUG) console.log('[GUARD] landing path=/api/auth/landing session=true org_id=null onboarded=false reason=zero memberships redirect=onboarding');
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  const redirectTo = request.nextUrl.searchParams.get('redirect');
  const safeRedirect =
    redirectTo?.startsWith('/') &&
    !redirectTo.includes('//') &&
    (redirectTo.startsWith('/app/') || redirectTo === '/onboarding' || redirectTo === '/launcher' || redirectTo.startsWith('/auth/'));
  const destination = safeRedirect ? redirectTo : '/app/dashboard';
  if (GUARD_DEBUG) console.log('[GUARD] landing path=/api/auth/landing session=true org_id=' + membership.org_id + ' onboarded=true reason=set cookie redirect=' + destination);
  const redirectRes = NextResponse.redirect(new URL(destination, request.url));
  redirectRes.cookies.set(ACTIVE_ORG_COOKIE, membership.org_id, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
  return redirectRes;
}

/**
 * GET /api/auth/landing
 * Post-login (or when app layout has no org): set active_org_id if user has membership, then redirect.
 * Only place that sends to /onboarding is when user has zero memberships (new user).
 */
export async function GET(request: NextRequest) {
  return handleLanding(request);
}

/**
 * POST /api/auth/landing — same as GET (avoids 405 if redirect is followed with POST).
 */
export async function POST(request: NextRequest) {
  return handleLanding(request);
}
