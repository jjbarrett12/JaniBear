'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface OpsPanelShellProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  /** Minimum height for alignment across panels (e.g. min-h-[280px]) */
  minHeight?: string;
}

/**
 * Reusable panel shell for Ops Command Center: rounded-xl, border, consistent header + body.
 * Use for Territory, Live Deployments, Account Health, Crew Capacity, Upcoming Go-Lives.
 */
export function OpsPanelShell({
  title,
  description,
  action,
  children,
  className,
  minHeight = 'min-h-[260px]',
}: OpsPanelShellProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden flex flex-col',
        minHeight,
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 p-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="flex-1 min-h-0 p-4 overflow-auto">{children}</div>
    </section>
  );
}
