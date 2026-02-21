'use client';

import { cn } from '@/lib/utils';

/**
 * Main content area: 70% primary, 30% context. Enterprise standard.
 */
export function ContentGrid({
  primary,
  context,
  className,
}: {
  primary: React.ReactNode;
  context?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-6 lg:grid-cols-10',
        className
      )}
    >
      <div className="min-w-0 lg:col-span-7">
        {primary}
      </div>
      {context && (
        <div className="min-w-0 space-y-6 lg:col-span-3">
          {context}
        </div>
      )}
    </div>
  );
}
