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

function debugLog(msg: string, data?: Record<string, unknown>) {
  if (AUTH_DEBUG) console.log('[auth middleware]', msg, data ?? '');
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
          return request.cookies.getAll();
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

    const cookieNames = request.cookies.getAll().map((c) => c.name).filter((n) => n.startsWith('sb-'));
    if (process.env.NODE_ENV === 'development' && pathname.startsWith('/app/')) {
      console.log('[REDIRECT] [A] middleware path=', pathname, 'user=', user?.id ?? null, 'authCookieCount=', cookieNames.length);
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
    if (isPrefetch) return response;

    const appRedirect = redirectToApp(pathname);
    if (appRedirect) {
      return NextResponse.redirect(new URL(appRedirect, request.url));
    }

    if (!user && !isPublicPath(pathname)) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[REDIRECT] origin=middleware path=', pathname, 'authCookieCount=', cookieNames.length);
      }
      debugLog('no user, redirect to login', { pathname, authCookieCount: cookieNames.length });
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Set active_org_id when entering /app without it (so layout has org in one hop)
    if (user && pathname.startsWith('/app/')) {
      const hasOrgCookie = request.cookies.get('active_org_id')?.value;
      if (!hasOrgCookie) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
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

    return response;
  } catch (e) {
    debugLog('catch', { error: String(e) });
    return response;
  }
}
