'use client';

import { cn } from '@/lib/utils';
import { KpiCard, type KpiCardProps } from './kpi-card';

export interface KpiStripProps {
  /** 2–4 KPI items; same contract as KpiCard */
  items: KpiCardProps[];
  className?: string;
}

/**
 * Horizontal strip of KPI cards. Responsive grid: 2 cols small, 4 cols large.
 */
export function KpiStrip({ items, className }: KpiStripProps) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4',
        className
      )}
    >
      {items.map((item, i) => (
        <KpiCard key={i} {...item} />
      ))}
    </div>
  );
}
