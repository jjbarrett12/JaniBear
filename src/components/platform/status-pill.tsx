'use client';

import { cn } from '@/lib/utils';

export type OrgStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'suspended';

const STATUS_CONFIG: Record<
  OrgStatus,
  { label: string; className: string }
> = {
  trial: {
    label: 'Trial',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  active: {
    label: 'Active',
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  past_due: {
    label: 'Past due',
    className: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  },
  canceled: {
    label: 'Canceled',
    className: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  },
};

export function StatusPill({
  status,
  className,
}: {
  status: OrgStatus;
  className?: string;
}) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.canceled;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
