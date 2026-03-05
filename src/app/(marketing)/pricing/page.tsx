import { getCurrentUser } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { createClient } from '@/lib/supabase/server';
import { PricingPageClient, type AddonCtaMap } from './pricing-page-client';

/** Addon id on pricing page -> module key for /app/upgrade?module= */
const ADDON_TO_MODULE: Record<string, string> = {
  helphub: 'helphubqr',
  lidar: 'lidar_unlimited',
  'ai-proposal': 'ai_command_center',
};

export default async function PricingPage() {
  const user = await getCurrentUser();
  let activeOrgId = await getActiveOrgIdFromCookie();
  if (!activeOrgId && user) {
    const supabase = await createClient();
    const { data: first } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .or('status.eq.active,status.is.null')
      .limit(1)
      .maybeSingle();
    activeOrgId = first?.org_id ?? null;
  }

  const hasAppContext = Boolean(user && activeOrgId);
  const addonCtaMap: AddonCtaMap = {};
  if (hasAppContext) {
    for (const [addonId, moduleKey] of Object.entries(ADDON_TO_MODULE)) {
      addonCtaMap[addonId] = `/app/upgrade?module=${moduleKey}`;
    }
  }

  return <PricingPageClient addonCtaMap={addonCtaMap} />;
}
