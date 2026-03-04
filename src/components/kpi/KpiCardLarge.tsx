'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KpiCardLargeStatus = 'healthy' | 'watch' | 'critical' | 'neutral';

export interface KpiCardLargeProps {
  label: string;
  value: string | number;
  deltaPct?: number;
  deltaLabel?: string;
  target?: string;
  trend?: 'up' | 'down' | 'flat';
  sparkline?: number[];
  status?: KpiCardLargeStatus;
  onClick?: () => void;
}

function SparklineMini({ data, status }: { data: number[]; status?: KpiCardLargeStatus }) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80;
    const h = 28;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [data]);
  const stroke =
    status === 'healthy'
      ? 'hsl(var(--health-green))'
      : status === 'watch'
        ? 'hsl(var(--health-amber))'
        : status === 'critical'
          ? 'hsl(var(--health-red))'
          : 'hsl(var(--muted-foreground))';
  return (
    <svg width={84} height={32} className="overflow-visible" aria-hidden>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function statusDotClass(status?: KpiCardLargeStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-health-green';
    case 'watch':
      return 'bg-health-amber';
    case 'critical':
      return 'bg-health-red';
    default:
      return 'bg-muted-foreground';
  }
}

function borderClass(status?: KpiCardLargeStatus): string {
  // Thin border only when status is watch/critical (below target). Healthy: dot only; neutral: default border.
  if (status === 'critical') return 'border-l-red-500/50';
  if (status === 'watch') return 'border-l-amber-500/50';
  return 'border-l-border';
}

export function KpiCardLarge({
  label,
  value,
  deltaPct,
  deltaLabel,
  target,
  trend = 'flat',
  sparkline,
  status = 'neutral',
  onClick,
}: KpiCardLargeProps) {
  return (
    <Card
      className={cn(
        'min-h-[140px] transition-shadow border-l-[3px]',
        borderClass(status),
        'hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</span>
          {status !== 'neutral' && (
            <span className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', statusDotClass(status))} aria-hidden />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-[28px] sm:text-[32px] font-bold text-foreground tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {deltaPct != null && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-sm font-medium',
                trend === 'up' && 'text-health-green',
                trend === 'down' && 'text-health-red',
                trend === 'flat' && 'text-muted-foreground'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-4 w-4" />}
              {trend === 'down' && <TrendingDown className="h-4 w-4" />}
              {trend === 'flat' && <Minus className="h-4 w-4" />}
              {Math.abs(deltaPct).toFixed(1)}%
              {deltaLabel && <span className="text-muted-foreground font-normal text-xs">({deltaLabel})</span>}
            </span>
          )}
        </div>
        {target && <p className="text-xs text-muted-foreground mt-1">{target}</p>}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-3 flex justify-end">
            <SparklineMini data={sparkline} status={status} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
