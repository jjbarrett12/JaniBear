import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  const baseUrl = requestUrl.origin || process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || requestUrl.origin;

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    const loginUrl = new URL('/auth/login', baseUrl);
    loginUrl.searchParams.set('error', 'oauth');
    loginUrl.searchParams.set('message', errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login', baseUrl));
  }

  const response = NextResponse.redirect(new URL('/app/dashboard', baseUrl));

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

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Code exchange error:', exchangeError);
    const loginUrl = new URL('/auth/login', baseUrl);
    loginUrl.searchParams.set('error', 'session');
    return NextResponse.redirect(loginUrl);
  }

  const user = data.user;
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', baseUrl));
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const destination = membership?.org_id ? '/app/dashboard' : '/onboarding';
  response.headers.set('Location', new URL(destination, baseUrl).toString());

  if (membership?.org_id) {
    response.cookies.set(ACTIVE_ORG_COOKIE, membership.org_id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });
  }

  return response;
}
