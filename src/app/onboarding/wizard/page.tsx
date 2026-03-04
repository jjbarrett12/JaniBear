import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingWizardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/onboarding/wizard');
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect('/auth/set-org-and-continue?next=/app/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0B0F] via-[#0F1117] to-[#090A0E] text-white">
      <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
        <OnboardingWizard />
      </div>
    </div>
  );
}
