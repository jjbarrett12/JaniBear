'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StrategicKpiStatus = 'healthy' | 'watch' | 'critical' | 'neutral';

export interface StrategicKpiCardProps {
  label: string;
  value: string | number;
  trendPct?: number;
  comparison30d?: string;
  sparkline?: number[];
  status?: StrategicKpiStatus;
  onClick?: () => void;
}

function SparklineMini({ data, status }: { data: number[]; status?: StrategicKpiStatus }) {
  const path = useMemo(() => {
    if (!data?.length || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 72;
    const h = 24;
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
    <svg width={76} height={28} className="overflow-visible shrink-0" aria-hidden>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function statusDotClass(status?: StrategicKpiStatus): string {
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

function borderClass(status?: StrategicKpiStatus): string {
  if (status === 'critical') return 'border-l-red-500/50';
  if (status === 'watch') return 'border-l-amber-500/50';
  return 'border-l-border';
}

export function StrategicKpiCard({
  label,
  value,
  trendPct,
  comparison30d,
  sparkline,
  status = 'neutral',
  onClick,
}: StrategicKpiCardProps) {
  const trend = trendPct == null ? 'flat' : trendPct > 0 ? 'up' : trendPct < 0 ? 'down' : 'flat';

  return (
    <Card
      className={cn(
        'min-h-[120px] transition-shadow border-l-[3px] overflow-hidden',
        borderClass(status),
        'hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">{label}</span>
          {status !== 'neutral' && (
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0 mt-0.5', statusDotClass(status))} aria-hidden />
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-heading text-xl sm:text-2xl font-bold text-foreground tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {trendPct != null && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium',
                trend === 'up' && 'text-health-green',
                trend === 'down' && 'text-health-red',
                trend === 'flat' && 'text-muted-foreground'
              )}
            >
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend === 'flat' && <Minus className="h-3 w-3" />}
              {Math.abs(trendPct).toFixed(1)}%
            </span>
          )}
        </div>
        {comparison30d && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{comparison30d}</p>
        )}
        {sparkline && sparkline.length > 0 && (
          <div className="mt-2 flex justify-end">
            <SparklineMini data={sparkline} status={status} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
