import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * POST /api/auth/after-login
 * Call this right after client-side sign-in. Server has the session cookie,
 * sets active_org_id, returns where to redirect. No redirect hop—client does window.location.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ redirect: '/auth/login' }, { status: 200 });
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  // Always send to dashboard; app layout will redirect to /onboarding if no org (one place, no loop)
  const res = NextResponse.json({ redirect: '/app/dashboard' }, { status: 200 });

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
