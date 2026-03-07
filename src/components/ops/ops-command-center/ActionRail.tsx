'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { UrgentActionItem } from '@/lib/ops/ops-command-center-types';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export interface ActionRailProps {
  items: UrgentActionItem[];
  className?: string;
}

export function ActionRail({ items, className }: ActionRailProps) {
  const hasItems = items.length > 0;

  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 transition-colors',
        hasItems
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100'
          : 'border-border bg-muted/40 text-muted-foreground',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" aria-hidden />
          <span className="font-medium">
            {hasItems
              ? `${items.length} urgent task${items.length !== 1 ? 's' : ''} require action`
              : 'No urgent tasks'}
          </span>
        </div>
        {hasItems && (
          <div className="flex flex-wrap gap-2">
            {items.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="inline-flex items-center gap-1 text-sm font-medium hover:underline underline-offset-2"
              >
                {item.title}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        )}
      </div>
      {hasItems && items.length > 1 && (
        <ul className="mt-2 space-y-1">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-amber-500/10 transition-colors"
              >
                <span className="truncate">{item.title}</span>
                <span className="text-xs opacity-80 shrink-0">{item.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
