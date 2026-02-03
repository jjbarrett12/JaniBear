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
        {/* Logo + Welcome — logo 2x larger, tight gap to heading */}
        <div className="text-center" style={{ marginBottom: 0 }}>
          <div className="flex justify-center [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ lineHeight: 0 }}>
            <Image
              src="/janibear-logo.png"
              alt="Janibear Logo"
              width={600}
              height={200}
              className="w-auto object-contain bg-transparent"
              style={{ imageRendering: 'auto', height: '14rem', maxHeight: '18rem' }}
              priority
              unoptimized
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            Welcome back
          </h1>
          <p className="text-zinc-500 text-sm" style={{ marginTop: '0.25rem', marginBottom: 0 }}>
            Sign in to your Janibear account
          </p>
        </div>

        {/* Login Form — no space: sits directly under subtitle */}
        <div style={{ marginTop: 0 }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
