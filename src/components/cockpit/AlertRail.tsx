'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export interface AlertRailProps {
  count: number;
  href?: string;
  onClick?: () => void;
  className?: string;
  /** When count is 0 */
  emptyLabel?: string;
  /** When count > 0; receives count */
  getCountLabel?: (n: number) => string;
  /** CTA when count > 0 */
  viewQueueLabel?: string;
}

export function AlertRail({
  count,
  href,
  onClick,
  className,
  emptyLabel = 'No urgent items',
  getCountLabel = (n) => `${n} item${n !== 1 ? 's' : ''} require attention`,
  viewQueueLabel = 'View queue',
}: AlertRailProps) {
  const hasAttention = count > 0;
  const content = (
    <>
      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
      <span className="font-medium">
        {hasAttention ? getCountLabel(count) : emptyLabel}
      </span>
      {hasAttention && (
        <span className="flex items-center gap-1 text-sm opacity-90">
          {viewQueueLabel}
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </>
  );

  const base = cn(
    'flex items-center justify-between gap-4 w-full rounded-xl border px-4 py-2.5 transition-all duration-200',
    hasAttention
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100 hover:bg-amber-500/15 hover:border-amber-500/40'
      : 'border-border bg-muted/30 text-muted-foreground dark:bg-muted/20',
    className
  );

  if (href && hasAttention) {
    return (
      <Link href={href} className={base} aria-label="View items requiring attention">
        {content}
      </Link>
    );
  }

  if (onClick && hasAttention) {
    return (
      <button type="button" onClick={onClick} className={base} aria-label="View items requiring attention">
        {content}
      </button>
    );
  }

  return <div className={base}>{content}</div>;
}
