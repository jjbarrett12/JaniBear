import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { OnboardingForm } from '@/components/onboarding/onboarding-form';

export default async function OnboardingPage() {
  const supabase = await createClient();
  // Prefer getSession (cookie-only) so we see the session right after login
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) {
    redirect('/auth/login');
  }
  
  // Check if user already has an org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  
  if (membership) {
    redirect('/app/dashboard');
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4 [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/janibear-logo.png"
              alt="Janibear Logo"
              width={600}
              height={200}
              className="h-36 md:h-44 lg:h-56 w-auto object-contain bg-transparent"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Welcome to Janibear
          </h1>
          <p className="text-gray-600 text-base">
            Create your organization to get started
          </p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
