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
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublicPath(request.nextUrl.pathname)) {
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
