'use client';

import React from 'react';
import Link from 'next/link';
import { OpsPanelShell } from './OpsPanelShell';
import type { LiveDeploymentItem } from '@/lib/ops/ops-command-center-types';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';

export interface LiveDeploymentsPanelProps {
  items: LiveDeploymentItem[];
  className?: string;
}

export function LiveDeploymentsPanel({ items, className }: LiveDeploymentsPanelProps) {
  return (
    <OpsPanelShell
      title="Live deployments"
      description="Active deployment pipeline"
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/ops/service-deployments">View all</Link>
        </Button>
      }
      className={className}
    >
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active deployments.</p>
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
                  <p className="text-xs text-muted-foreground">{item.deploymentType} · {item.stage}</p>
                </div>
                <Rocket className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </OpsPanelShell>
  );
}
