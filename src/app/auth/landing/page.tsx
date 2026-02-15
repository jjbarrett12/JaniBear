import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Single post-login destination. Runs after password or OAuth login.
 * Sets active_org_id cookie and redirects to dashboard or onboarding once.
 * Stops the app from "not deciding" between /onboarding and /app/dashboard.
 */
export default async function AuthLandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  const cookieStore = await cookies();
  if (membership?.org_id) {
    cookieStore.set(ACTIVE_ORG_COOKIE, membership.org_id, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });
  }

  if (membership?.org_id) {
    redirect('/app/dashboard');
  }
  redirect('/onboarding');
}
