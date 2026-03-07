'use client';

import React from 'react';
import Link from 'next/link';
import { OpsPanelShell } from './OpsPanelShell';
import type { TerritoryCoverageItem } from '@/lib/ops/ops-command-center-types';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TerritoryCoveragePanelProps {
  items: TerritoryCoverageItem[];
  className?: string;
}

export function TerritoryCoveragePanel({ items, className }: TerritoryCoveragePanelProps) {
  return (
    <OpsPanelShell
      title="Territory coverage"
      description="Coverage by territory"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/map">View map</Link>
        </Button>
      }
      minHeight="min-h-[320px]"
      className={className}
    >
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
          <MapPin className="h-10 w-10 mb-2 opacity-50" />
          <p>No territory data</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">{item.territoryName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <span className="text-muted-foreground">
                    {item.scheduledCount}/{item.accountCount}
                  </span>
                  <span
                    className={
                      item.status === 'ok'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : item.status === 'partial'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                    }
                  >
                    {item.coveragePct}%
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </OpsPanelShell>
  );
}
