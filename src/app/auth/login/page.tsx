import { redirect } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in | JaniBear' };

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
      .single();
    redirect(membership ? '/app/dashboard' : '/onboarding');
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ lineHeight: 0 }}>
            <Image
              src="/janibear-logo.png"
              alt="JaniBear"
              width={600}
              height={200}
              className="w-auto object-contain bg-transparent"
              style={{ imageRendering: 'auto', height: '5rem' }}
              priority
              unoptimized
            />
          </div>
          <h1 className="text-xl font-bold text-zinc-900 mt-2 mb-0">Welcome back</h1>
          <p className="text-zinc-500 text-sm mt-0.5 mb-0">Sign in with your email and password</p>
        </div>
        <div className="mt-0">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
