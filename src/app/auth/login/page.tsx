import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export const metadata = { title: 'Sign in | JANIBEAR' };
export const dynamic = 'force-dynamic';

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
  let defaultEmail: string | undefined;
  let user: { id: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    // Supabase/env error — still show login form
  }
  if (user) {
    redirect(safeLandingRedirect(redirectTo));
  }
  try {
    const cookieStore = await cookies();
    defaultEmail = cookieStore.get('janibear_remember_email')?.value ?? undefined;
  } catch {
    defaultEmail = undefined;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-12 relative overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      {/* Background: dark backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" aria-hidden />
      <div className="w-full max-w-[420px] relative z-10" style={{ isolation: 'isolate' }}>
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
          <h1 className="text-2xl font-bold mt-4 mb-1" style={{ color: '#ffffff' }}>Welcome back</h1>
          <p className="text-sm mt-1" style={{ color: '#a1a1aa' }}>Sign in to your account to continue</p>
          <p className="text-xs mt-1" style={{ color: '#71717a' }}>One device per account — signing in elsewhere signs out other sessions.</p>
        </div>
        <Suspense fallback={
          <div className="rounded-2xl border shadow-xl p-6 sm:p-8 animate-pulse h-[320px]" style={{ borderColor: '#3f3f46', backgroundColor: '#18181b' }} aria-label="Loading sign in form" />
        }>
          <LoginForm defaultEmail={defaultEmail} redirectParam={redirectTo ?? undefined} />
        </Suspense>
        <noscript>
          <p className="mt-6 text-center">
            <a href="/auth/login" className="text-sm font-medium text-amber-400 hover:text-amber-300 underline">Sign in</a>
          </p>
        </noscript>
      </div>
    </div>
  );
}
