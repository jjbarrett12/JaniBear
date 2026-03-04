'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export type AttentionStripSeverity = 'watch' | 'critical';

export interface AttentionStripItem {
  id: string;
  label: string;
  count: number;
  severity: AttentionStripSeverity;
}

export function AttentionStrip({
  items,
  onOpen,
}: {
  items: AttentionStripItem[];
  onOpen: () => void;
}) {
  if (items.length === 0) return null;

  const top3 = items.slice(0, 3);
  const totalCount = items.reduce((s, i) => s + i.count, 0);

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border bg-muted/30 px-4 py-2.5"
      role="region"
      aria-label="Attention required"
    >
      <div className="flex items-center gap-2 shrink-0">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
        <span className="text-sm font-medium text-foreground">Attention Required</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
        {top3.map((item) => (
          <span
            key={item.id}
            className={cn(
              'text-xs font-medium',
              item.severity === 'critical'
                ? 'text-red-700 dark:text-red-300'
                : 'text-amber-700 dark:text-amber-300'
            )}
          >
            {item.label}: <span className="font-semibold tabular-nums">{item.count}</span>
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="ml-auto shrink-0 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
      >
        View all ({totalCount})
      </button>
    </div>
  );
}
