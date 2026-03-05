'use client';

import { useEffect } from 'react';

export function AuthContinueClient({ defaultNext }: { defaultNext: string }) {
  useEffect(() => {
    // Cookie-based auth (server-set httpOnly cookies) can leave client auth state empty.
    // Do not wait for browser Supabase session; navigate to next route immediately.
    const timer = window.setTimeout(() => {
      window.location.replace(defaultNext);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [defaultNext]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-amber-50/30">
      <p className="text-zinc-600">Signing you in...</p>
    </div>
  );
}
