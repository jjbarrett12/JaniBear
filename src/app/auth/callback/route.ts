import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Always redirect within the same origin so cookies stay valid (avoids www vs non-www strobe/loop).
  // Only use NEXT_PUBLIC_APP_URL when we have no request origin (e.g. server-only).
  const baseUrl = requestUrl.origin || process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || requestUrl.origin;

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/auth/login', baseUrl);
    loginUrl.searchParams.set('error', 'oauth');
    loginUrl.searchParams.set('message', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    // No code provided, redirect to login
    return NextResponse.redirect(new URL('/auth/login', baseUrl));
  }

  // Redirect to landing so one place sets org cookie and sends to dashboard or onboarding
  const response = NextResponse.redirect(new URL('/api/auth/landing', baseUrl));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  
  if (exchangeError) {
    console.error('Code exchange error:', exchangeError);
    const loginUrl = new URL('/auth/login', baseUrl);
    loginUrl.searchParams.set('error', 'session');
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
