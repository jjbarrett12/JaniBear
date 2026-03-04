'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutiveKpiTileProps, KpiTileStatus } from '@/lib/kpi-command-center';

function statusStyles(status: KpiTileStatus): string {
  switch (status) {
    case 'good':
      return 'border-l-[3px] border-l-emerald-600 dark:border-l-emerald-500';
    case 'warning':
      return 'border-l-[3px] border-l-amber-600 dark:border-l-amber-500';
    case 'danger':
      return 'border-l-[3px] border-l-red-600 dark:border-l-red-500';
    default:
      return 'border-l border-l-border';
  }
}

function trendColor(trendPercent: number): string {
  if (trendPercent >= 0) return 'text-emerald-600 dark:text-emerald-400';
  return 'text-red-600 dark:text-red-400';
}

export function ExecutiveKpiTile({
  title,
  value,
  trendPercent,
  status,
  comparisonLabel,
  drilldownRoute,
}: ExecutiveKpiTileProps) {
  const displayValue =
    typeof value === 'number' ? (value >= 1000 ? value.toLocaleString() : String(value)) : value;

  const content = (
    <Card
      className={cn(
        'rounded-xl border border-border/80 bg-card shadow-sm transition-colors hover:bg-muted/30',
        statusStyles(status)
      )}
    >
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {displayValue}
          </span>
          <span className={cn('flex items-center gap-0.5 text-sm font-medium tabular-nums', trendColor(trendPercent))}>
            {trendPercent >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trendPercent >= 0 ? '+' : ''}{trendPercent.toFixed(1)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{comparisonLabel}</p>
      </CardContent>
    </Card>
  );

  if (drilldownRoute) {
    return (
      <Link href={drilldownRoute} className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
