'use client';

import { useEffect } from 'react';
import Link from 'next/link';

/**
 * Shown when user hits /auth/login but is already signed in.
 * Uses client-side redirect to /api/auth/landing to avoid a server 302 loop
 * (login -> landing -> login when cookies don't propagate on redirect).
 */
export function LoginAlreadySignedIn({ redirectTo }: { redirectTo: string | null }) {
  const landingUrl =
    !redirectTo?.startsWith('/') || redirectTo.includes('//')
      ? '/api/auth/landing'
      : redirectTo.startsWith('/app/') || redirectTo === '/onboarding' || redirectTo === '/launcher' || redirectTo.startsWith('/auth/')
        ? `/api/auth/landing?redirect=${encodeURIComponent(redirectTo)}`
        : '/api/auth/landing';

  useEffect(() => {
    window.location.href = landingUrl;
  }, [landingUrl]);

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
            href={landingUrl}
            className="text-sm font-medium text-amber-400 hover:text-amber-300 underline"
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
