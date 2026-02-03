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
  '/proposals/', // public proposal view by token
];

function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

// Redirect old /dashboard, /crm, /walkthroughs to /app/* so one design is used
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

  // If Supabase env vars are missing (e.g. on Vercel before env is set), allow
  // public paths and let protected routes handle auth in the page/layout.
  // This prevents middleware from throwing and causing 404/500 on every request.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isPublicPath(request.nextUrl.pathname)) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(key: string) {
            return request.cookies.get(key)?.value ?? null;
          },
          set(key: string, value: string, options: Record<string, unknown>) {
            supabaseResponse.cookies.set(key, value, options);
          },
          remove(key: string, options: Record<string, unknown>) {
            supabaseResponse.cookies.set(key, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;
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

    return supabaseResponse;
  } catch (_) {
    // If Supabase or auth fails (e.g. network, config), allow request through
    // so the app can render; pages will handle auth.
    return supabaseResponse;
  }
}
