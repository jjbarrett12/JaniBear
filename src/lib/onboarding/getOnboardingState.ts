/**
 * Onboarding state machine: NEED_AUTH | NEED_ORG | NEED_PLAN | READY.
 */
import { createClient } from '@/lib/supabase/server';

export type OnboardingState = 'NEED_AUTH' | 'NEED_ORG' | 'NEED_PLAN' | 'READY';

export async function getOnboardingState(userId: string | null): Promise<OnboardingState> {
  if (!userId) return 'NEED_AUTH';

  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .or('status.eq.active,status.is.null');

  if (!memberships?.length) return 'NEED_ORG';

  const orgId = memberships[0].org_id;

  // NEED_PLAN: org exists but no active subscription (optional gating)
  const { data: sub } = await supabase
    .from('org_subscriptions')
    .select('id')
    .eq('org_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (sub) return 'READY';
  // No active subscription: still READY (plan gate optional; can redirect to /app/onboarding later)
  return 'READY';
}
