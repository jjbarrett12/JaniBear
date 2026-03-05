import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { LoginAlreadySignedIn } from '@/components/auth/login-already-signed-in';

export const metadata = { title: 'Sign in | JANIBEAR' };
export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; next?: string; session?: string; error?: string }>;
}) {
  const params = await searchParams;
  const redirectTo = params.redirect ?? params.next ?? null;

  if (params.session === 'invalid') {
    const nextUrl = redirectTo
      ? `/auth/login?redirect=${encodeURIComponent(redirectTo)}`
      : '/auth/login';
    redirect(`/api/auth/clear-session?next=${encodeURIComponent(nextUrl)}`);
  }

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
    return (
      <LoginAlreadySignedIn redirectTo={redirectTo} />
    );
  }
  try {
    const cookieStore = await cookies();
    defaultEmail = cookieStore.get('janibear_remember_email')?.value ?? undefined;
  } catch {
    defaultEmail = undefined;
  }

  const urlError =
    params.error === 'session'
      ? 'Session could not be established. Please sign in again.'
      : params.error === 'invalid'
        ? 'Invalid email or password. Please try again.'
        : params.error === 'missing'
          ? 'Email and password are required.'
          : params.error === 'unconfirmed'
            ? 'Your email is not confirmed yet. Check your inbox (and spam) for the confirmation link.'
            : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 sm:py-12 relative overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
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

        {/* Server-rendered form: native POST so session cookies are committed before redirect (see docs/AUTH_LOGIN_REGression.md). Do not replace with fetch() + client redirect. */}
        <div className="rounded-2xl border shadow-xl p-6 sm:p-8 text-zinc-100" style={{ borderColor: '#3f3f46', backgroundColor: '#18181b' }}>
          <form action="/api/auth/login" method="post" className="space-y-4">
            {redirectTo ? <input type="hidden" name="redirect" value={redirectTo} /> : null}
            {urlError && (
              <div className="text-sm text-red-300 bg-red-950/50 p-3 rounded-xl border border-red-800">
                {urlError}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium block">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@company.com"
                defaultValue={defaultEmail ?? ''}
                required
                autoComplete="email"
                className="w-full h-12 rounded-xl border bg-zinc-800 border-zinc-600 text-zinc-100 placeholder-zinc-500 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-medium block">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full h-12 rounded-xl border bg-zinc-800 border-zinc-600 text-zinc-100 placeholder-zinc-500 px-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                <input type="checkbox" name="remember_me" value="1" className="w-4 h-4 rounded border-zinc-500 text-cyan-500" />
                <span>Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm font-medium text-cyan-400 hover:text-cyan-300">
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-[15px] border-0 transition-colors duration-200"
            >
              Sign in
            </button>
          </form>
          <p className="mt-6 pt-4 border-t text-center text-sm" style={{ borderColor: '#3f3f46' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-semibold text-cyan-400 hover:text-cyan-300">Sign up</Link>
          </p>
          <p className="mt-2 text-center text-sm text-zinc-500">
            <a href="/auth/logout" className="text-cyan-400 hover:text-cyan-300 underline">Sign out and try again</a>
          </p>
        </div>
      </div>
    </div>
  );
}
