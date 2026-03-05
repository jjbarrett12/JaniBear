/**
 * Password login — see project root AUTH_FLOW.md.
 * Form POST only; session cookies set on same response as redirect.
 * Handles remember_me so login form checkbox works.
 */
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const REMEMBER_EMAIL_COOKIE = 'janibear_remember_email';

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/auth/login', request.nextUrl.origin));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = (formData.get('email') as string)?.trim();
  const password = formData.get('password') as string;
  const rememberMe = formData.get('remember_me') === '1' || formData.get('remember_me') === 'on';
  const redirectParam = (formData.get('redirect') as string)?.trim() || null;

  const baseUrl = request.nextUrl.origin;
  const loginErrorUrl = new URL('/auth/login', baseUrl);
  if (redirectParam) loginErrorUrl.searchParams.set('redirect', redirectParam);

  if (!email || !password) {
    loginErrorUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(loginErrorUrl);
  }

  const landingPath =
    redirectParam?.startsWith('/') && !redirectParam.includes('//') &&
    (redirectParam.startsWith('/app/') || redirectParam === '/onboarding' || redirectParam.startsWith('/auth/'))
      ? `/api/auth/landing?redirect=${encodeURIComponent(redirectParam)}`
      : '/api/auth/landing';
  const successRedirect = NextResponse.redirect(new URL(landingPath, baseUrl));

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
            successRedirect.cookies.set(name, value, { ...options, path: '/' });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginErrorUrl.searchParams.set('error', 'invalid');
    if (error.message.includes('Email not confirmed')) {
      loginErrorUrl.searchParams.set('error', 'unconfirmed');
    }
    return NextResponse.redirect(loginErrorUrl);
  }

  if (!data.user) {
    loginErrorUrl.searchParams.set('error', 'invalid');
    return NextResponse.redirect(loginErrorUrl);
  }

  // Single-session: revoke all other sessions for this user to prevent account sharing
  await supabase.auth.signOut({ scope: 'others' });

  if (rememberMe) {
    successRedirect.cookies.set(REMEMBER_EMAIL_COOKIE, email, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    successRedirect.cookies.set(REMEMBER_EMAIL_COOKIE, '', { path: '/', maxAge: 0 });
  }

  return successRedirect;
}
