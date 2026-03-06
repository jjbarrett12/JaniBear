import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getOnboardingState } from '@/lib/onboarding/getOnboardingState';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';
import { BrandName } from '@/components/ui/brand-name';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const state = await getOnboardingState(user?.id ?? null);

  if (state === 'NEED_AUTH' || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-slate-50">
        <div className="text-center space-y-5 max-w-sm">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Sign in to continue</h1>
          <p className="text-slate-600 text-sm leading-relaxed">Your session may have expired. Sign in to create your organization.</p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg h-11 px-5 bg-slate-900 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }
  if (state === 'NEED_PLAN') redirect('/app/onboarding');
  if (state === 'READY') redirect('/auth/set-org-and-continue?next=/app/dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex justify-end px-4 py-3 border-b border-slate-200/80 bg-white">
        <a href="/auth/logout" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          Sign out
        </a>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              <Image
                src="/logo.png"
                alt="JANIBEAR Logo"
                width={600}
                height={200}
                className="h-16 md:h-20 w-auto object-contain bg-transparent"
                priority
                unoptimized
              />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              Welcome to <BrandName variant="light" />
            </h1>
            <p className="text-slate-600 text-sm">
              Create your organization to get started.
            </p>
          </div>
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
