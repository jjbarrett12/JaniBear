'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function AdminPageLayout({
  title,
  description,
  children,
  className,
  actions,
}: AdminPageLayoutProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="mt-2 sm:mt-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
