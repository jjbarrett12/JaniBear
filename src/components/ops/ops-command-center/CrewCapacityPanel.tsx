'use client';

import React from 'react';
import Link from 'next/link';
import { OpsPanelShell } from './OpsPanelShell';
import type { CrewCapacityItem } from '@/lib/ops/ops-command-center-types';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

export interface CrewCapacityPanelProps {
  items: CrewCapacityItem[];
  className?: string;
}

export function CrewCapacityPanel({ items, className }: CrewCapacityPanelProps) {
  return (
    <OpsPanelShell
      title="Crew capacity"
      description="Scheduled vs capacity today"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/ops/crews">Crews</Link>
        </Button>
      }
      className={className}
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No crew data.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href="/app/ops/crews"
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-medium truncate">{item.crewName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-xs">
                  <span className="text-muted-foreground">
                    {item.scheduledToday}/{item.capacity}
                  </span>
                  <span
                    className={
                      item.status === 'over'
                        ? 'text-rose-600 dark:text-rose-400'
                        : item.status === 'high'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-muted-foreground'
                    }
                  >
                    {item.utilizationPct}%
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </OpsPanelShell>
  );
}
