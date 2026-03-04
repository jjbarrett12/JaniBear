import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from './onboarding-wizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('org_settings')
    .select('onboarding_status')
    .eq('org_id', org.org_id)
    .maybeSingle();

  if (settings?.onboarding_status === 'completed') {
    redirect('/app/dashboard');
  }

  const onboardingStatus = settings?.onboarding_status ?? 'pending';
  const { data: enabledModules } = await supabase
    .from('org_settings')
    .select('enabled_modules')
    .eq('org_id', org.org_id)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <OnboardingWizard
        orgId={org.org_id}
        orgName={(org.organizations as { name?: string } | null)?.name ?? ''}
        initialStatus={onboardingStatus}
        initialModules={
          (enabledModules?.enabled_modules as { sales?: boolean; ops?: boolean; management?: boolean }) ??
          { sales: true, ops: true, management: true }
        }
      />
    </div>
  );
}
