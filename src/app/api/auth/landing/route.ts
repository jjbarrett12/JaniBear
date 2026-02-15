import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * GET /api/auth/landing
 * Post-login: set active_org_id cookie when user has an org, always redirect to /app/dashboard.
 * New users with no org hit the dashboard and are then sent to /onboarding by the app layout.
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

  const res = NextResponse.redirect(new URL('/app/dashboard', request.url));

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
