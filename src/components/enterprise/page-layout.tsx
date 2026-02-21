'use client';

import { cn } from '@/lib/utils';

/**
 * Enterprise page wrapper: 8px grid, section padding 32–48px, max-width, calm spacing.
 */
export function PageLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'space-y-8 pb-8',
        'min-w-0',
        className
      )}
    >
      {children}
    </div>
  );
}
