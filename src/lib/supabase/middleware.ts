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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicPath(request.nextUrl.pathname)) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT: Do NOT use getSession() here - use getUser() instead
    // getSession() reads from cookies which can be spoofed
    // getUser() actually validates the session with Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Prefetch requests (next/link) may not have cookies; don't redirect or we get reload loops
    const isPrefetch =
      request.headers.get('Next-Router-Prefetch') === '1' ||
      request.headers.get('purpose') === 'prefetch';
    if (isPrefetch) {
      return supabaseResponse;
    }

    const appRedirect = redirectToApp(pathname);
    if (appRedirect) {
      const url = request.nextUrl.clone();
      url.pathname = appRedirect;
      return NextResponse.redirect(url);
    }

    if (!user && !isPublicPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }

    // Set active_org_id if missing when entering /app (stops redirect loops; one less hop)
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
          supabaseResponse.cookies.set('active_org_id', membership.org_id, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
          });
        }
      }
    }

    return supabaseResponse;
  } catch {
    return supabaseResponse;
  }
}
