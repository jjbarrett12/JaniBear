'use client';

import React from 'react';
import Link from 'next/link';
import { OpsPanelShell } from './OpsPanelShell';
import type { UpcomingGoLiveItem } from '@/lib/ops/ops-command-center-types';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

export interface UpcomingGoLivesPanelProps {
  items: UpcomingGoLiveItem[];
  className?: string;
}

export function UpcomingGoLivesPanel({ items, className }: UpcomingGoLivesPanelProps) {
  return (
    <OpsPanelShell
      title="Upcoming go-lives"
      description="Scheduled activations"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/ops/service-deployments">Deployments</Link>
        </Button>
      }
      className={className}
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming go-lives.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{item.accountName}</p>
                  <p className="text-xs text-muted-foreground">{item.deploymentType}</p>
                </div>
                <span className="text-xs font-medium tabular-nums shrink-0 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(item.goLiveDate), 'MMM d')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </OpsPanelShell>
  );
}
