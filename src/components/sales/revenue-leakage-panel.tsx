'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { RevenueLeakageSignal } from '@/types/sales';
import { AlertTriangle } from 'lucide-react';

export function RevenueLeakagePanel({ signals }: { signals: RevenueLeakageSignal[] }) {
  if (signals.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Leakage signals
        </CardTitle>
        <p className="text-xs text-muted-foreground">Lost bids, walkthroughs not converted, proposals sitting too long.</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {signals.map((s) => (
            <li key={s.id}>
              <Link href="/app/crm/pipeline" className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                <span className="font-medium">{s.label}</span>
                <span className="text-muted-foreground tabular-nums">{s.count}{s.amount != null ? ` · ${formatCurrency(s.amount)}` : ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
