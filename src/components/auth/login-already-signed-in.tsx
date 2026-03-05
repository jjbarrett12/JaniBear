'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Shown when user hits /auth/login but is already signed in.
 * Redirect to dashboard (or requested path) so middleware can set active_org_id.
 * Using /app/dashboard avoids relying on /api/auth/landing seeing cookies (which can be empty on some runtimes).
 */
export function LoginAlreadySignedIn({ redirectTo }: { redirectTo: string | null }) {
  const destination =
    redirectTo?.startsWith('/') && !redirectTo.includes('//') &&
    (redirectTo.startsWith('/app/') || redirectTo === '/onboarding' || redirectTo === '/launcher' || redirectTo.startsWith('/auth/'))
      ? redirectTo
      : '/app/dashboard';

  useEffect(() => {
    window.location.href = destination;
  }, [destination]);

  const clearUrl = redirectTo
    ? `/api/auth/clear-session?next=${encodeURIComponent(`/auth/login?redirect=${encodeURIComponent(redirectTo)}`)}`
    : '/api/auth/clear-session?next=/auth/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#0a0a0f' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black" aria-hidden />
      <div className="relative z-10 text-center max-w-md space-y-6">
        <h1 className="text-xl font-semibold" style={{ color: '#fff' }}>You&apos;re already signed in</h1>
        <p className="text-sm" style={{ color: '#a1a1aa' }}>
          Redirecting you to your account…
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={destination}
            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 underline"
          >
            Go to dashboard
          </Link>
          <Link
            href={clearUrl}
            className="text-sm text-zinc-400 hover:text-zinc-300 underline"
          >
            Use a different account
          </Link>
        </div>
      </div>
    </div>
  );
}
