'use client';

import { cn } from '@/lib/utils';

/**
 * Left (70%) panel: data table, charts, core function. Rounded-2xl, subtle border.
 */
export function PrimaryPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 space-y-6', className)}>
      {children}
    </div>
  );
}
