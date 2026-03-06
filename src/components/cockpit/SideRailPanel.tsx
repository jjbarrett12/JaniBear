'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SideRailPanelProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function SideRailPanel({ title, description, action, children, className }: SideRailPanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card dark:bg-card/90 overflow-hidden',
        'flex flex-col min-h-0',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 p-4 border-b border-border shrink-0">
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
