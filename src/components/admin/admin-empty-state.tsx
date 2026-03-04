'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function AdminEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: AdminEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md py-16 px-8 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-6" size="lg">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
