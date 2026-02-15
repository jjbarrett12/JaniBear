import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in | JANIBEAR' };

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? (await supabase.auth.getUser()).data.user;
  if (user) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (membership) {
      redirect('/auth/set-org-and-continue?next=/app/dashboard');
    }
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-12 relative overflow-hidden">
      {/* Background: subtle grid + gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-amber-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-amber-950/20" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ lineHeight: 0 }}>
            <Image
              src="/logo.png"
              alt="JANIBEAR"
              width={600}
              height={200}
              className="w-auto object-contain bg-transparent"
              style={{ imageRendering: 'auto', height: '5.5rem' }}
              priority
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mt-4 mb-1">Welcome back</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Sign in to your account to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
