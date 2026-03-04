import { redirect } from 'next/navigation';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in | JANIBEAR' };

function safeLandingRedirect(redirectParam: string | null): string {
  if (!redirectParam?.startsWith('/') || redirectParam.includes('//')) return '/api/auth/landing';
  if (redirectParam.startsWith('/app/') || redirectParam === '/onboarding' || redirectParam === '/launcher' || redirectParam.startsWith('/auth/')) {
    return `/api/auth/landing?redirect=${encodeURIComponent(redirectParam)}`;
  }
  return '/api/auth/landing';
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; next?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? params.next ?? null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(safeLandingRedirect(redirectTo));
  }

  const cookieStore = await cookies();
  const defaultEmail = cookieStore.get('janibear_remember_email')?.value ?? undefined;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-12 relative overflow-hidden text-white">
      {/* Background: dark backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" aria-hidden />
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
          <h1 className="text-2xl font-bold text-white mt-4 mb-1">Welcome back</h1>
          <p className="text-zinc-400 text-sm">Sign in to your account to continue</p>
        </div>
        <LoginForm defaultEmail={defaultEmail} redirectParam={redirectTo ?? undefined} />
      </div>
    </div>
  );
}
