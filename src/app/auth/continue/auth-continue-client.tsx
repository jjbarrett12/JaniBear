'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const RETRY_DELAY_MS = 400;
const MAX_ATTEMPTS = 15;

export function AuthContinueClient({ defaultNext }: { defaultNext: string }) {
  const [status, setStatus] = useState<'redirecting' | 'error'>('redirecting');

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const tryRedirect = async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        if (session) {
          window.location.replace(defaultNext);
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
  }, [defaultNext]);

  if (status === 'error') return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-orange-50/30">
      <p className="text-zinc-600">Signing you in...</p>
    </div>
  );
}
