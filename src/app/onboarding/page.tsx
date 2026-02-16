import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';
import { BrandName } from '@/components/ui/brand-name';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-semibold text-gray-900">Sign in to continue</h1>
          <p className="text-gray-600 text-sm">Your session may have expired. Sign in to create your organization.</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex justify-end px-4 py-3 border-b border-gray-200 bg-white/80">
        <Link href="/auth/logout" className="text-sm font-medium text-amber-600 hover:text-amber-700">
          Sign out
        </Link>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-5">
          <div className="text-center">
            <div className="flex justify-center mb-2 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              <Image
                src="/logo.png"
                alt="JANIBEAR Logo"
                width={600}
                height={200}
                className="h-20 md:h-24 w-auto object-contain bg-transparent"
                priority
                unoptimized
              />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
              Welcome to <BrandName variant="light" />
            </h1>
            <p className="text-gray-600 text-sm">
              Create your organization to get started
            </p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
