'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface TrialBannerProps {
  currentTrialDay: number;
  daysRemaining: number;
  isExpired: boolean;
  subscriptionStatus: string;
}

const TRIAL_DAYS_TOTAL = 14;

/**
 * Dashboard-level trial banner. Informative, not spammy. Day count visible; CTA clear.
 */
export function TrialBanner({
  currentTrialDay,
  daysRemaining,
  isExpired,
  subscriptionStatus,
}: TrialBannerProps) {
  if (subscriptionStatus !== 'trial' || isExpired) return null;

  const isUrgent = daysRemaining <= 2;
  const isEscalated = daysRemaining <= 4;
  const dayNum = Math.min(currentTrialDay + 1, TRIAL_DAYS_TOTAL);

  return (
    <div
      className={
        (isUrgent
          ? 'border-amber-300 bg-amber-50/90 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 '
          : isEscalated
            ? 'border-slate-200 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 '
            : 'border-slate-200 bg-slate-50/80 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300 ') +
        'rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3'
      }
    >
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-semibold tabular-nums">
          Trial — Day {dayNum} of {TRIAL_DAYS_TOTAL}
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
        </span>
      </div>
      {isEscalated && (
        <p className="text-sm text-slate-600 dark:text-slate-400 w-full sm:w-auto sm:max-w-md">
          {daysRemaining === 1
            ? 'Your trial ends tomorrow. Activate your subscription to keep JANIBEAR running for your team.'
            : daysRemaining <= 3
              ? `Your trial ends in ${daysRemaining} days. Activate your subscription to keep JANIBEAR running for your team.`
              : 'Activate your subscription to keep full access after your trial.'}
        </p>
      )}
      <Button asChild size="sm" variant={isUrgent ? 'default' : 'secondary'} className="h-9 font-medium shrink-0">
        <Link href="/app/billing">Activate subscription</Link>
      </Button>
    </div>
  );
}
