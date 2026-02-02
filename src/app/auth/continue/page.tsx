'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const ALLOWED_PATHS = ['/app/', '/onboarding', '/auth/'];
const DEFAULT_NEXT = '/app/dashboard';
const INITIAL_DELAY_MS = 400;
const RETRY_DELAY_MS = 250;
const MAX_ATTEMPTS = 6;

export default function AuthContinuePage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'redirecting' | 'error'>('redirecting');

  useEffect(() => {
    let next = searchParams.get('next') ?? DEFAULT_NEXT;
    const isValid = ALLOWED_PATHS.some((p) => next.startsWith(p));
    if (!isValid) next = DEFAULT_NEXT;

    const supabase = createClient();
    let cancelled = false;

    const tryRedirect = async () => {
      await new Promise((r) => setTimeout(r, INITIAL_DELAY_MS));
      if (cancelled) return;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          window.location.replace(next);
          return;
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      }

      if (cancelled) return;
      setStatus('error');
      window.location.replace('/auth/login?error=session');
    };

    tryRedirect();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  if (status === 'error') return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <p className="text-gray-600">Signing you in...</p>
    </div>
  );
}
