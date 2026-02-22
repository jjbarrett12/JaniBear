'use client';

import { cn } from '@/lib/utils';

export type KpiPillStatus = 'healthy' | 'watch' | 'critical' | 'neutral';

export interface KpiPillItem {
  id: string;
  label: string;
  value: string | number;
  deltaPct?: number;
  status?: KpiPillStatus;
}

function statusDotClass(status?: KpiPillStatus): string {
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

export function KpiPillRow({ items }: { items: KpiPillItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          {item.status && item.status !== 'neutral' && (
            <span
              className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusDotClass(item.status))}
              aria-hidden
            />
          )}
          <span className="text-muted-foreground font-medium">{item.label}:</span>
          <span className="font-heading font-semibold tabular-nums">
            {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
          </span>
          {item.deltaPct != null && (
            <span
              className={cn(
                'text-xs tabular-nums',
                item.deltaPct >= 0 ? 'text-health-green' : 'text-health-red'
              )}
            >
              {item.deltaPct >= 0 ? '+' : ''}{item.deltaPct.toFixed(1)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
