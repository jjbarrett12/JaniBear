'use client';

import React from 'react';
import Link from 'next/link';
import { OpsPanelShell } from './OpsPanelShell';
import type { AccountHealthWatchlistItem } from '@/lib/ops/ops-command-center-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface AccountHealthWatchlistPanelProps {
  items: AccountHealthWatchlistItem[];
  className?: string;
}

function riskBadgeVariant(level: AccountHealthWatchlistItem['riskLevel']) {
  switch (level) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'secondary';
    default: return 'outline';
  }
}

export function AccountHealthWatchlistPanel({ items, className }: AccountHealthWatchlistPanelProps) {
  return (
    <OpsPanelShell
      title="Account health watchlist"
      description="Accounts below threshold"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/ops/risk">View all</Link>
        </Button>
      }
      className={className}
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No accounts on watchlist.</p>
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
                  {item.topReason && (
                    <p className="text-xs text-muted-foreground truncate">{item.topReason}</p>
                  )}
                </div>
                <Badge variant={riskBadgeVariant(item.riskLevel)} className="shrink-0">
                  {item.riskScore}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </OpsPanelShell>
  );
}
