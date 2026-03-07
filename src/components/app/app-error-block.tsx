'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AppErrorBlockProps {
  title?: string;
  message: string;
  recovery?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
  /** Optional inline content (e.g. form) */
  children?: ReactNode;
}

/**
 * Inline error block for forms and mutations. Shows a short title, the error message,
 * optional recovery hint, and optional retry. Use instead of raw red text for trust and clarity.
 */
export function AppErrorBlock({
  title = "Something went wrong",
  message,
  recovery,
  onRetry,
  retryLabel = "Try again",
  className,
  children,
}: AppErrorBlockProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-left',
        className
      )}
    >
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{message}</p>
          {recovery && (
            <p className="text-sm text-muted-foreground">{recovery}</p>
          )}
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              {retryLabel}
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
