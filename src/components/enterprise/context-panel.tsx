'use client';

import { cn } from '@/lib/utils';

/**
 * Right (30%) panel: insights, actions, risk flags. Cards with rounded-2xl.
 */
export function ContextPanel({
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
