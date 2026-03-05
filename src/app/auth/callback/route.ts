import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

  const nextPath = requestUrl.searchParams.get('next');
  const safeNext =
    nextPath &&
    nextPath.startsWith('/') &&
    !nextPath.includes('//') &&
    (nextPath === '/auth/reset-password' ||
      nextPath.startsWith('/auth/') ||
      nextPath.startsWith('/app/') ||
      nextPath === '/api/auth/landing');
  const destination = safeNext ? nextPath : '/api/auth/landing';
  const response = NextResponse.redirect(new URL(destination, baseUrl));

  const supabase = await supabaseServer({ request, response });

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Code exchange error:', exchangeError);
    const loginUrl = new URL('/auth/login', baseUrl);
    loginUrl.searchParams.set('error', 'session');
    return NextResponse.redirect(loginUrl);
  }

  // Single-session: revoke all other sessions for this user to prevent account sharing
  await supabase.auth.signOut({ scope: 'others' });

  return response;
}
