'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CockpitKpiItem, KpiVariant } from '@/lib/cockpit-data';

const VARIANT_STYLES: Record<
  KpiVariant,
  { card: string; accent: string; icon: string; sparkline: string; deltaPositive: string; deltaNegative: string }
> = {
  neutral: {
    card: 'border-border bg-card dark:bg-card/90',
    accent: 'border-l-slate-500/60',
    icon: 'bg-muted/80 text-muted-foreground',
    sparkline: 'bg-slate-500/40',
    deltaPositive: 'bg-muted/80 text-muted-foreground',
    deltaNegative: 'bg-muted/80 text-muted-foreground',
  },
  success: {
    card: 'border-border bg-card dark:bg-card/90 dark:border-emerald-500/20',
    accent: 'border-l-emerald-500',
    icon: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    sparkline: 'bg-emerald-500/50',
    deltaPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    deltaNegative: 'bg-muted/80 text-muted-foreground',
  },
  warning: {
    card: 'border-border bg-card dark:bg-card/90 dark:border-amber-500/20',
    accent: 'border-l-amber-500',
    icon: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    sparkline: 'bg-amber-500/50',
    deltaPositive: 'bg-muted/80 text-muted-foreground',
    deltaNegative: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  },
  danger: {
    card: 'border-border bg-card dark:bg-card/90 dark:border-rose-500/20',
    accent: 'border-l-rose-500',
    icon: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    sparkline: 'bg-rose-500/50',
    deltaPositive: 'bg-muted/80 text-muted-foreground',
    deltaNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  },
  revenue: {
    card: 'border-border bg-card dark:bg-card/90 dark:border-indigo-500/20',
    accent: 'border-l-indigo-500',
    icon: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    sparkline: 'bg-indigo-500/50',
    deltaPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    deltaNegative: 'bg-muted/80 text-muted-foreground',
  },
};

export interface KpiTileProps {
  item: CockpitKpiItem;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
}

export function KpiTile({ item, icon: Icon, onClick, className }: KpiTileProps) {
  const v = VARIANT_STYLES[item.variant];
  const Wrapper = item.href && !onClick ? Link : 'div';
  const wrapperProps = item.href && !onClick ? { href: item.href } : {};
  const isButton = !!onClick;
  const deltaPositive = item.delta != null && item.delta.value > 0 && item.id !== 'health_below';
  const deltaNegative = item.delta != null && (item.delta.value < 0 || (item.delta.value > 0 && item.id === 'health_below'));

  const content = (
    <>
      <div className={cn('absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl', v.accent)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {Icon && (
            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', v.icon)}>
              <Icon className="h-4 w-4" />
            </span>
          )}
          <span className="text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {item.title}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.delta != null && (
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums',
                deltaPositive && v.deltaPositive,
                deltaNegative && v.deltaNegative
              )}
            >
              {item.delta.value > 0 ? `+${item.delta.value}` : item.delta.value}
              {item.delta.label ? ` ${item.delta.label}` : ''}
            </span>
          )}
          {item.status === 'warning' && item.variant !== 'warning' && (
            <span className="rounded-md px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 text-amber-600 dark:text-amber-400">
              Review
            </span>
          )}
          {item.status === 'danger' && (
            <span className="rounded-md px-2 py-0.5 text-[11px] font-medium bg-rose-500/20 text-rose-600 dark:text-rose-400">
              Action
            </span>
          )}
        </div>
      </div>
      <p className="mt-2 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
        {item.value}
      </p>
      {item.subvalue && (
        <p className="mt-0.5 text-xs text-muted-foreground">{item.subvalue}</p>
      )}
      {item.trend && item.trend.length > 0 && (
        <div className="mt-3 flex items-end gap-px h-8" aria-hidden>
          {item.trend.map((val, i) => (
            <div
              key={i}
              className={cn('flex-1 min-w-[3px] rounded-sm transition-colors', v.sparkline)}
              style={{ height: `${Math.max(8, Math.min(100, val * 100))}%` }}
            />
          ))}
        </div>
      )}
    </>
  );

  const baseClasses = cn(
    'relative flex flex-col rounded-xl border p-4 text-left transition-all duration-200 min-h-[128px]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    v.card,
    isButton && 'cursor-pointer hover:border-primary/25 dark:hover:border-primary/30 hover:shadow-sm active:translate-y-0',
    onClick && 'hover:-translate-y-0.5',
    className
  );

  if (isButton) {
    return (
      <button type="button" onClick={onClick} className={baseClasses} aria-label={`${item.title}: ${item.value}`}>
        {content}
      </button>
    );
  }

  return (
    <Wrapper {...wrapperProps} className={baseClasses}>
      {content}
    </Wrapper>
  );
}
