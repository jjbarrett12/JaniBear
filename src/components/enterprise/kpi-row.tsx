'use client';

import { cn } from '@/lib/utils';

/**
 * Top KPI summary row: 4–6 cards max. Clear metric + trend + micro.
 */
export function KpiRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
        className
      )}
    >
      {children}
    </div>
  );
}
