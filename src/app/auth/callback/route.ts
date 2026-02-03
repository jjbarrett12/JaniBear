import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  let next = requestUrl.searchParams.get('next') ?? '/app/dashboard';

  const allowedPaths = ['/app/', '/auth/', '/onboarding', '/pricing', '/survey', '/checkout', '/demo', '/contact', '/'];
  if (!allowedPaths.some((path) => next.startsWith(path))) {
    next = '/app/dashboard';
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? requestUrl.origin;
  const redirectUrl = new URL(next, baseUrl);

  if (code) {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = request.nextUrl.protocol === 'https:' || forwardedProto === 'https';
    const cookieOptions = { path: '/', sameSite: 'lax' as const, secure: isSecure };

    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions,
        cookies: {
          get(key: string) {
            return request.cookies.get(key)?.value ?? null;
          },
          set(key: string, value: string, options: Record<string, unknown>) {
            response.cookies.set(key, value, { ...cookieOptions, ...options });
          },
          remove(key: string, options: Record<string, unknown>) {
            response.cookies.set(key, '', { ...cookieOptions, ...options, maxAge: 0 });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = new URL('/auth/login', baseUrl);
      loginUrl.searchParams.set('error', 'session');
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.redirect(redirectUrl);
}
