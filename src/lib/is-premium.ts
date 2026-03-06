import { createClient } from '@/lib/supabase/server';
import { getIsPlatformAdmin } from '@/lib/platform-guard';

/** Plans that include Jani-Bear University (training courses) and Operations */
const PREMIUM_PLANS = ['grizzly', 'kodiak'];

export type PlanType = 'cub' | 'grizzly' | 'kodiak';

/**
 * Resolve plan type for org. When userId is provided and that user is a platform admin,
 * returns 'kodiak' (zero restrictions). Otherwise reads organizations.plan.
 */
export async function getPlanType(orgId: string, userId?: string | null): Promise<PlanType> {
  if (userId && (await getIsPlatformAdmin(userId))) return 'kodiak';
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const plan = (org?.plan ?? 'free').toLowerCase().replace(/\s+/g, '-');
  if (plan === 'kodiak') return 'kodiak';
  if (plan === 'grizzly') return 'grizzly';
  return 'cub';
}

/**
 * True if org has Grizzly or Kodiak (or current user is platform admin when userId passed).
 */
export async function isPremiumPlan(orgId: string, userId?: string | null): Promise<boolean> {
  if (userId && (await getIsPlatformAdmin(userId))) return true;
  const plan = await getPlanType(orgId);
  return plan === 'grizzly' || plan === 'kodiak';
}

/** Operations (launch intake, crews, schedules, inspections, etc.) require Grizzly or higher. Platform admin always enabled. */
export async function isOperationsEnabled(orgId: string, userId?: string | null): Promise<boolean> {
  return isPremiumPlan(orgId, userId);
}

export function getPremiumPlanIds(): string[] {
  return [...PREMIUM_PLANS];
}
