import { requireOrg } from '@/lib/auth';
import { AccountOnboardingForm } from '@/components/accounts/account-onboarding-form';

export default async function NewAccountPage() {
  await requireOrg();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">New account</h1>
        <p className="text-muted-foreground mt-1">
          Add an account and its facilities.
        </p>
      </div>
      <AccountOnboardingForm />
    </div>
  );
}
