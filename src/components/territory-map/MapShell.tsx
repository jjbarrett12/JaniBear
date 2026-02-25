'use client';

import { cn } from '@/lib/utils';

type MapShellStatus = 'loading' | 'empty' | 'error' | 'ready';

interface Props {
  status: MapShellStatus;
  children: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  errorMessage?: string;
}

export function MapShell({ status, children, className, emptyMessage, errorMessage }: Props) {
  if (status === 'loading') {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center rounded-lg border border-border bg-muted/30',
          className
        )}
      >
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse h-8 w-48 bg-muted rounded mx-auto mb-2" />
          <p className="text-sm">Loading map…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5',
          className
        )}
      >
        <p className="text-sm text-destructive">{errorMessage ?? 'Failed to load map'}</p>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div
        className={cn(
          'flex h-full w-full items-center justify-center rounded-lg border border-border bg-muted/20',
          className
        )}
      >
        <p className="text-sm text-muted-foreground">{emptyMessage ?? 'No map data for this view'}</p>
      </div>
    );
  }

  return <div className={cn('h-full w-full', className)}>{children}</div>;
}
