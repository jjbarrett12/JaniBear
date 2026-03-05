'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';

const POLL_INTERVAL_MS = 2000;
const TIMEOUT_MS = 120000;

const VALID_MODULE_KEYS = ['helphubqr', 'lidar_starter', 'lidar_unlimited', 'ai_command_center'] as const;

function isValidModule(value: string): boolean {
  return VALID_MODULE_KEYS.includes(value as (typeof VALID_MODULE_KEYS)[number]);
}

export default function UpgradeSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'polling' | 'success' | 'timeout'>('polling');

  const moduleParam = searchParams.get('module') ?? '';
  const fromPath = searchParams.get('from') ?? '/app/dashboard';
  const decodedFrom = decodeURIComponent(fromPath);

  useEffect(() => {
    if (!moduleParam || !isValidModule(moduleParam)) {
      router.replace('/app/billing');
      return;
    }

    let cancelled = false;
    const start = Date.now();

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() - start > TIMEOUT_MS) {
        setStatus('timeout');
        return;
      }
      try {
        const res = await fetch('/api/billing/entitlements');
        const data = (await res.json()) as { modules?: Record<string, boolean> };
        if (cancelled) return;
        if (res.ok && data.modules?.[moduleParam] === true) {
          setStatus('success');
          router.replace(decodedFrom);
          return;
        }
      } catch {
        // ignore and retry
      }
      if (!cancelled) setTimeout(poll, POLL_INTERVAL_MS);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [moduleParam, decodedFrom, router]);

  if (!moduleParam || !isValidModule(moduleParam)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6">
      {status === 'polling' && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-foreground">Setting up your plan…</p>
          <p className="text-xs text-muted-foreground mt-1">
            We’ll send you back as soon as your new module is ready.
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-4" />
          <p className="text-sm font-medium text-foreground">All set!</p>
          <p className="text-xs text-muted-foreground mt-1">Redirecting you back.</p>
        </>
      )}
      {status === 'timeout' && (
        <>
          <p className="text-sm font-medium text-foreground">Taking longer than usual</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm text-center">
            Your upgrade may still be processing. You can go back and try again in a moment.
          </p>
          <a
            href={decodedFrom}
            className="mt-4 text-sm text-primary underline hover:no-underline"
          >
            Return to app
          </a>
        </>
      )}
    </div>
  );
}
