import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * GET /auth/set-org-and-continue?next=/app/dashboard
 * Sets active_org_id to the user's first org (if any) and redirects to next.
 * Use after onboarding so the first /app request has the cookie and avoids jitter.
 */
export async function GET(request: NextRequest) {
  const nextUrl = request.nextUrl.searchParams.get('next') || '/app/dashboard';
  const allowedNext = nextUrl.startsWith('/app/') || nextUrl === '/onboarding' || nextUrl.startsWith('/auth/');
  const target = allowedNext ? nextUrl : '/app/dashboard';

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

  const res = NextResponse.redirect(new URL(target, request.url));
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
