/**
 * Server-side guards for App Router: get context or redirect.
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getActiveOrgId } from './getActiveOrgId';
import { requireMembership } from './requireMembership';
import { getOnboardingState } from '@/lib/onboarding/getOnboardingState';

export type ServerContext = {
  userId: string;
  orgId: string;
  membership: Awaited<ReturnType<typeof requireMembership>>;
};

/** Get userId from auth, orgId from cookie or first membership. Throws/redirects if missing. */
export async function getServerContextOrThrow(): Promise<ServerContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const orgId = (await getActiveOrgId()) ?? null;
  let resolvedOrgId = orgId;

  if (!resolvedOrgId) {
    const { data: first } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .or('status.eq.active,status.is.null')
      .limit(1)
      .maybeSingle();
    resolvedOrgId = first?.org_id ?? null;
  }

  if (!resolvedOrgId) redirect('/onboarding');
  const membership = await requireMembership({ orgId: resolvedOrgId, userId: user.id });
  return { userId: user.id, orgId: resolvedOrgId, membership };
}

/** Require app access: logged in, has org, has plan (or skip plan gate). Redirects to login, /onboarding/org, or /onboarding/plan. */
export async function requireAppAccess(): Promise<ServerContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const state = await getOnboardingState(user.id);
  if (state === 'NEED_ORG') redirect('/onboarding');
  if (state === 'NEED_PLAN') redirect('/app/onboarding');

  const ctx = await getServerContextOrThrow();
  return ctx;
}
