import { redirect } from 'next/navigation';
import { getServerContextOrThrow } from '@/lib/auth/serverGuards';
import {
  getModuleEntry,
  getFeatureCodeForModule,
  isValidModuleKey,
  type ModuleKey,
} from '@/lib/billing/catalog';
import { requireOrgSeatAdmin } from '@/lib/billing/requireOrgRole';
import { createClient } from '@/lib/supabase/server';
import { Paywall } from './paywall';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type SearchParams = { module?: string; from?: string };

function isModuleEnabled(
  enabledByFeature: Record<string, boolean> | null,
  moduleKey: ModuleKey
): boolean {
  if (!enabledByFeature) return false;
  const featureCode = getFeatureCodeForModule(moduleKey);
  return enabledByFeature[featureCode] === true;
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const moduleParam = params.module ?? '';
  const fromPath = params.from ?? null;

  const ctx = await getServerContextOrThrow();
  const { orgId, userId } = ctx;

  if (!moduleParam) redirect('/app/billing');
  if (!isValidModuleKey(moduleParam)) redirect('/app/billing');

  const moduleKey = moduleParam as ModuleKey;
  const entry = getModuleEntry(moduleKey);

  let canUpgrade = false;
  try {
    await requireOrgSeatAdmin(orgId);
    canUpgrade = true;
  } catch {
    canUpgrade = false;
  }

  const supabase = await createClient();
  const { data: entitlements } = await supabase.rpc('get_effective_entitlements', {
    p_org_id: orgId,
  });
  const enabledByFeature: Record<string, boolean> = {};
  if (Array.isArray(entitlements)) {
    for (const row of entitlements as { feature_code: string; enabled: boolean }[]) {
      enabledByFeature[row.feature_code] = row.enabled;
    }
  }
  const isEnabled = isModuleEnabled(enabledByFeature, moduleKey);

  const paywallModule = {
    key: entry.key,
    name: entry.name,
    description: entry.description,
    descriptionBullets: entry.descriptionBullets,
    priceDisplay: entry.priceDisplay,
    primaryCtaLabel: entry.primaryCtaLabel,
    icon: entry.icon,
  };

  return (
    <div
      className={cn(
        'min-h-[80vh] flex items-center justify-center p-4',
        'md:fixed md:inset-0 md:bg-black/50 md:backdrop-blur-sm md:z-50 md:p-6'
      )}
    >
      <div className={cn('w-full md:flex md:justify-center md:items-start md:pt-12')}>
        <Paywall
          module={paywallModule}
          orgId={orgId}
          canUpgrade={canUpgrade}
          isEnabled={isEnabled}
          fromPath={fromPath}
        />
      </div>
    </div>
  );
}
