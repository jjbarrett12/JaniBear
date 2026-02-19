/**
 * Post-login landing — see project root AUTH_FLOW.md.
 * Sets active_org_id and redirects to dashboard or onboarding.
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

async function handleLanding(request: NextRequest) {
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

  if (!membership?.org_id) {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  const res = NextResponse.redirect(new URL('/app/dashboard', request.url));
  res.cookies.set(ACTIVE_ORG_COOKIE, membership.org_id, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

/**
 * GET /api/auth/landing
 * Post-login (or when app layout has no org): set active_org_id if user has membership, then redirect.
 * Only place that sends to /onboarding is when user has zero memberships (new user).
 */
export async function GET(request: NextRequest) {
  return handleLanding(request);
}

/**
 * POST /api/auth/landing — same as GET (avoids 405 if redirect is followed with POST).
 */
export async function POST(request: NextRequest) {
  return handleLanding(request);
}
