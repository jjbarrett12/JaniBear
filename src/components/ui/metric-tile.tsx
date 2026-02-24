'use client';

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';

export type MetricTileStatus = 'neutral' | 'good' | 'warn' | 'bad';

const statusBorder: Record<MetricTileStatus, string> = {
  neutral: 'border-border',
  good: 'border-emerald-500/40',
  warn: 'border-amber-500/40',
  bad: 'border-destructive/50',
};

const statusValue: Record<MetricTileStatus, string> = {
  neutral: 'text-foreground',
  good: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-destructive',
};

const statusDelta: Record<MetricTileStatus, string> = {
  neutral: 'text-muted-foreground',
  good: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-destructive',
};

export interface MetricTileProps {
  title: string;
  value: string | number | null;
  subvalue?: string | null;
  /** e.g. "+12%" or "-5" — shown next to value when present */
  delta?: string | null;
  status?: MetricTileStatus;
  icon: LucideIcon;
  loading?: boolean;
  /** When set, the tile is a link (clickable) */
  href?: string;
  /** Tooltip when value is empty or "—" */
  emptyTooltip?: string;
}

export function MetricTile({
  title,
  value,
  subvalue,
  delta,
  status = 'neutral',
  icon: Icon,
  loading = false,
  href,
  emptyTooltip = 'Data not available yet',
}: MetricTileProps) {
  const isEmpty = value === null || value === undefined || value === '';
  const displayValue = isEmpty ? '—' : value;
  const titleAttr = isEmpty && emptyTooltip ? emptyTooltip : undefined;

  const content = (
    <>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
      </div>
      {loading ? (
        <div className="mt-1 h-7 w-20 animate-pulse rounded bg-muted" aria-busy="true" />
      ) : (
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className={`text-xl font-semibold tabular-nums ${statusValue[status]}`}>
            {displayValue}
          </span>
          {delta != null && delta !== '' && (
            <span className={`text-sm tabular-nums ${statusDelta[status]}`}>{delta}</span>
          )}
        </div>
      )}
      {subvalue != null && subvalue !== '' && !loading && (
        <p className="mt-0.5 text-sm text-muted-foreground">{subvalue}</p>
      )}
    </>
  );

  const tileClass = [
    'rounded-xl border bg-card p-4 sm:p-5 text-left shadow-sm transition-colors',
    statusBorder[status],
    href
      ? 'hover:bg-muted/50 hover:border-primary/30 cursor-pointer'
      : '',
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link href={href} className={tileClass} title={titleAttr}>
        {content}
      </Link>
    );
  }
  return (
    <div className={tileClass} title={titleAttr}>
      {content}
    </div>
  );
}

/** Skeleton for a grid of metric tiles while loading */
export function MetricTileSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-muted animate-pulse" />
        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
      </div>
      <div className="mt-2 h-7 w-20 rounded bg-muted animate-pulse" />
    </div>
  );
}
