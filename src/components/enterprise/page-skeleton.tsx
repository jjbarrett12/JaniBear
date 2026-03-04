'use client';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { KpiRowSkeleton } from './loading-skeleton';

export interface PageSkeletonProps {
  /** Show KPI row (default true) */
  showKpiRow?: boolean;
  /** Number of content blocks (default 3) */
  contentBlocks?: number;
  className?: string;
}

/**
 * Full-page loading: header block + optional KPI row + content blocks. Calm, predictable.
 */
export function PageSkeleton({
  showKpiRow = true,
  contentBlocks = 3,
  className,
}: PageSkeletonProps) {
  return (
    <div className={cn('space-y-8 pb-8 min-w-0', className)}>
      <header className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-md" />
      </header>
      {showKpiRow && <KpiRowSkeleton count={4} />}
      <div className="space-y-6">
        {Array.from({ length: contentBlocks }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
