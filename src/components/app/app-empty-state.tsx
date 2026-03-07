'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface AppEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
}

/**
 * Unified empty state for app screens. Use for lists and tables so users
 * see consistent copy and a clear next step. Keeps layout calm and trustworthy.
 */
export function AppEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: AppEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-border bg-card/50 py-12 px-6 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
