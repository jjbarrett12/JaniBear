/**
 * Auth middleware: refresh Supabase session and protect routes.
 * See project root AUTH_FLOW.md for the full sign-in flow — change this only with that doc in mind.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/auth',
  '/r/',
  '/onboarding',
  '/pricing',
  '/survey',
  '/checkout',
  '/demo',
  '/contact',
  '/api',
];

const AUTH_DEBUG = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_AUTH_DEBUG === '1';
const GUARD_DEBUG = process.env.NODE_ENV === 'development' && (process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.NEXT_PUBLIC_GUARD_DEBUG === '1');

function debugLog(msg: string, data?: Record<string, unknown>) {
  if (AUTH_DEBUG) console.log('[auth middleware]', msg, data ?? '');
}

function guardLog(pathname: string, data: Record<string, unknown>) {
  if (GUARD_DEBUG) console.log('[GUARD]', { path: pathname, ...data });
}

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function redirectToApp(pathname: string): string | null {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return '/app/dashboard';
  if (pathname.startsWith('/crm/')) return '/app' + pathname;
  if (pathname.startsWith('/walkthroughs')) return '/app' + pathname;
  return null;
}

type CookieEntry = { name: string; value: string; options?: Record<string, unknown> };

/** In Edge (e.g. Vercel), request.cookies can be empty even when Cookie header is sent. Parse header as fallback. */
function getCookiesForRequest(request: NextRequest): { name: string; value: string }[] {
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

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  /** True when Supabase auth called setAll (session refresh). We no longer redirect; we return response with cookies set. */
  let didSetAuthCookies = false;
  const authCookiesSet: CookieEntry[] = [];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicPath(request.nextUrl.pathname)) return response;
    debugLog('missing env, redirect to login');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return getCookiesForRequest(request);
        },
        setAll(cookiesToSet: CookieEntry[]) {
          didSetAuthCookies = true;
          authCookiesSet.push(...cookiesToSet);
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    const pathname = request.nextUrl.pathname;
    const allCookies = getCookiesForRequest(request);
    const cookieNames = allCookies.map((c) => c.name).filter((n) => n.startsWith('sb-'));

    if (GUARD_DEBUG && pathname.startsWith('/app/')) {
      guardLog(pathname, { session: !!user, authCookieCount: cookieNames.length });
    }
    if (AUTH_DEBUG && pathname.startsWith('/app/')) {
      debugLog('app route', {
        pathname,
        userId: user?.id ?? null,
        didSetAuthCookies,
        authCookieCount: cookieNames.length,
        authCookies: cookieNames,
      });
    }

    const isPrefetch =
      request.headers.get('Next-Router-Prefetch') === '1' ||
      request.headers.get('purpose') === 'prefetch';
    if (isPrefetch) {
      guardLog(pathname, { session: !!user, isPrefetch: true, reason: 'prefetch passthrough' });
      return response;
    }

    const appRedirect = redirectToApp(pathname);
    if (appRedirect) {
      return NextResponse.redirect(new URL(appRedirect, request.url));
    }

    // Protected path but no user: redirect to login for non-/app/ routes. For /app/*, let the
    // layout handle auth so Node (which may receive cookies when Edge doesn't) can run and redirect if needed.
    if (!user && !isPublicPath(pathname)) {
      if (!pathname.startsWith('/app/')) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[REDIRECT] origin=middleware path=', pathname, 'authCookieCount=', cookieNames.length);
        }
        debugLog('no user, redirect to login', { pathname, authCookieCount: cookieNames.length });
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      // /app/* with no user: pass through; layout will redirect if it also sees no session
      return response;
    }

    // Set active_org_id when entering /app without it (so layout has org in one hop)
    const hasOrgCookie = user && pathname.startsWith('/app/') ? allCookies.find((c) => c.name === 'active_org_id')?.value : undefined;
    if (user && pathname.startsWith('/app/')) {
      if (!hasOrgCookie) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        guardLog(pathname, {
          session: true,
          org_id: membership?.org_id ?? null,
          onboarded: !!membership?.org_id,
          reason: membership?.org_id ? 'set cookie on response' : 'no membership in middleware',
        });
        if (membership?.org_id) {
          response.cookies.set('active_org_id', membership.org_id, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
          });
        }
      }
    }

    // When Supabase refreshes the session (setAll), we used to redirect to the same URL so the
    // layout would see new cookies on the next request. That redirect causes client-side
    // navigation to sometimes lose the session (cookie sync / follow-up request not sending
    // cookies). So we no longer redirect: return the response with updated cookies; the layout
    // runs in the same request with the incoming cookies. Supabase refreshes proactively before
    // expiry, so getUser() in the layout typically still succeeds with the existing cookies.
    if (didSetAuthCookies && pathname.startsWith('/app/')) {
      debugLog('auth refresh (no redirect)', { pathname, cookiesSet: authCookiesSet.length });
    }

    // Pass user id to layout via header so layout can trust middleware auth when cookies() is empty on client nav.
    // When creating a new response we must re-set cookies with path: '/' so they are not path-scoped to the
    // current URL (e.g. /app/dashboard). Otherwise the browser only sends them for that path and session
    // is lost on client-side navigation to e.g. /app/settings.
    if (user && pathname.startsWith('/app/')) {
      guardLog(pathname, {
        session: true,
        org_cookie_set: !!hasOrgCookie,
        reason: 'set x-middleware-user-id',
      });
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-middleware-user-id', user.id);
      requestHeaders.set('x-pathname', pathname);
      const resWithHeader = NextResponse.next({
        request: { headers: requestHeaders },
      });
      response.cookies.getAll().forEach(({ name, value, ...options }) =>
        resWithHeader.cookies.set(name, value, { ...options, path: '/' })
      );
      return resWithHeader;
    }

    return response;
  } catch (e) {
    debugLog('catch', { error: String(e) });
    return response;
  }
}
