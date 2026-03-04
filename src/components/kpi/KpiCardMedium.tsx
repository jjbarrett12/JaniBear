'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KpiCardMediumStatus = 'healthy' | 'watch' | 'critical' | 'neutral';

export interface KpiCardMediumProps {
  label: string;
  value: string | number;
  deltaPct?: number;
  deltaLabel?: string;
  target?: string;
  trend?: 'up' | 'down' | 'flat';
  status?: KpiCardMediumStatus;
  onClick?: () => void;
}

function statusDotClass(status?: KpiCardMediumStatus): string {
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

function borderClass(status?: KpiCardMediumStatus): string {
  if (status === 'critical') return 'border-l-red-500/50';
  if (status === 'watch') return 'border-l-amber-500/50';
  return 'border-l-border';
}

export function KpiCardMedium({
  label,
  value,
  deltaPct,
  deltaLabel,
  target,
  trend = 'flat',
  status = 'neutral',
  onClick,
}: KpiCardMediumProps) {
  return (
    <Card
      className={cn(
        'transition-shadow border-l-[3px]',
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
            <span className={cn('h-2 w-2 rounded-full shrink-0 mt-0.5', statusDotClass(status))} aria-hidden />
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-[22px] sm:text-[24px] font-bold text-foreground tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {deltaPct != null && (
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
              {Math.abs(deltaPct).toFixed(1)}%
              {deltaLabel && <span className="text-muted-foreground font-normal text-xs">({deltaLabel})</span>}
            </span>
          )}
        </div>
        {target && <p className="text-xs text-muted-foreground mt-0.5">{target}</p>}
      </CardContent>
    </Card>
  );
}
