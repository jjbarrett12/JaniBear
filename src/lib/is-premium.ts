import { createClient } from '@/lib/supabase/server';

/** Plans that include Jani-Bear University (training courses) */
const PREMIUM_PLANS = ['grizzly', 'kodiak'];

export async function isPremiumPlan(orgId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const plan = (org?.plan ?? 'free').toLowerCase().replace(/\s+/g, '-');
  return PREMIUM_PLANS.includes(plan);
}

export function getPremiumPlanIds(): string[] {
  return [...PREMIUM_PLANS];
}
