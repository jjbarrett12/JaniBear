/**
 * Password login — see project root AUTH_FLOW.md.
 * Form POST only; session cookies set on same response as redirect.
 * Handles remember_me so login form checkbox works.
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const REMEMBER_EMAIL_COOKIE = 'janibear_remember_email';
export const dynamic = 'force-dynamic';
const DEBUG_AUTH =
  process.env.NODE_ENV === 'development' &&
  (process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.DEBUG_AUTH === '1');

function getFormString(formData: unknown, key: string, trim = true): string | undefined {
  if (!formData || typeof formData !== 'object' || !('get' in formData)) return undefined;
  const maybeGet = (formData as { get?: unknown }).get;
  if (typeof maybeGet !== 'function') return undefined;
  const value = maybeGet.call(formData, key) as unknown;
  if (typeof value !== 'string') return undefined;
  return trim ? value.trim() : value;
}

function isSafeRedirectPath(path: string): boolean {
  return (
    path.startsWith('/') &&
    !path.includes('//') &&
    (path.startsWith('/app/') || path === '/onboarding' || path === '/launcher' || path.startsWith('/auth/'))
  );
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/auth/login', request.nextUrl.origin));
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = getFormString(formData, 'email') ?? '';
  const password = getFormString(formData, 'password', false) ?? '';
  const rememberValue = getFormString(formData, 'remember_me') ?? '';
  const rememberMe = rememberValue === '1' || rememberValue.toLowerCase() === 'on';
  const redirectParam = getFormString(formData, 'redirect') ?? null;

  const baseUrl = request.nextUrl.origin;
  const loginErrorUrl = new URL('/auth/login', baseUrl);
  if (redirectParam) loginErrorUrl.searchParams.set('redirect', redirectParam);

  if (!email || !password) {
    loginErrorUrl.searchParams.set('error', 'missing');
    return NextResponse.redirect(loginErrorUrl);
  }

  // Redirect to /auth/continue first so the browser commits session cookies before hitting landing (avoids redirect loop / throttling).
  const landingPath =
    redirectParam && isSafeRedirectPath(redirectParam)
      ? `/api/auth/landing?redirect=${encodeURIComponent(redirectParam)}`
      : '/api/auth/landing';
  const continueUrl = new URL('/auth/continue', baseUrl);
  continueUrl.searchParams.set('next', landingPath);
  const successRedirect = NextResponse.redirect(continueUrl);
  const supabase = await supabaseServer({ request, response: successRedirect });

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

  if (DEBUG_AUTH) {
    const cookieCount = successRedirect.cookies.getAll().length;
    console.log('[AUTH_DEBUG] POST /api/auth/login signIn succeeded', {
      redirectTo: continueUrl.toString(),
      setCookieCount: cookieCount,
    });
  }

  return successRedirect;
}
