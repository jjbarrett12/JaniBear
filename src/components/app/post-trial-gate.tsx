'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Activation banner when trial has ended. Preserves trust; clear upgrade path.
 */
export function PostTrialGate() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-5 md:px-6 md:py-6 text-center">
      <h2 className="text-lg font-semibold tracking-tight text-slate-900">
        Your JANIBEAR trial has ended
      </h2>
      <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
        Your data is safe and your system is ready. Activate your subscription to continue running operations.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button asChild className="h-11 font-medium min-w-[160px]">
          <Link href="/app/billing">Activate subscription</Link>
        </Button>
        <Button asChild variant="outline" className="h-11 border-slate-200 text-slate-700 hover:bg-slate-50">
          <Link href="/app/dashboard">View dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
