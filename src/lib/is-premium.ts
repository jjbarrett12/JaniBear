import { createClient } from '@/lib/supabase/server';

/** Plans that include Jani-Bear University (training courses) and Operations */
const PREMIUM_PLANS = ['grizzly', 'kodiak'];

export type PlanType = 'cub' | 'grizzly' | 'kodiak';

export async function getPlanType(orgId: string): Promise<PlanType> {
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

export async function isPremiumPlan(orgId: string): Promise<boolean> {
  const plan = await getPlanType(orgId);
  return plan === 'grizzly' || plan === 'kodiak';
}

/** Operations (launch intake, crews, schedules, inspections, etc.) require Grizzly or higher. */
export async function isOperationsEnabled(orgId: string): Promise<boolean> {
  return isPremiumPlan(orgId);
}

export function getPremiumPlanIds(): string[] {
  return [...PREMIUM_PLANS];
}
