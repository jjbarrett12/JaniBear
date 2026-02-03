import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();
    redirect(membership ? '/app/dashboard' : '/onboarding');
  }
  
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 px-4"
      style={{ paddingTop: '1.5rem', paddingBottom: '2rem' }}
    >
      <div
        className="w-full max-w-md"
        style={{ marginTop: '-5rem' }}
      >
        {/* Logo + Welcome — compact, tight to form */}
        <div className="text-center">
          <div className="flex justify-center [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/janibear-logo.png"
              alt="Janibear Logo"
              width={600}
              height={200}
              className="w-auto object-contain bg-transparent"
              style={{ imageRendering: 'auto', height: '5rem', maxHeight: '7rem' }}
              priority
              unoptimized
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">
            Welcome back
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Sign in to your Janibear account
          </p>
        </div>

        {/* Login Form — tight under welcome */}
        <div style={{ marginTop: '-1rem' }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
