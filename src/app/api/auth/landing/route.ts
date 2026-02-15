import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * GET /api/auth/landing
 * Single hop after login: server has cookies, sets active_org_id, redirects to dashboard or onboarding.
 * Use this as the only post-login destination so the cookie is set on the same response as the redirect.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const destination = membership?.org_id ? '/app/dashboard' : '/onboarding';
  const res = NextResponse.redirect(new URL(destination, request.url));

  if (membership?.org_id) {
    res.cookies.set(ACTIVE_ORG_COOKIE, membership.org_id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });
  }
  return res;
}
