'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { InspectionRow } from '../../mockDashboardData';

function statusVariant(s: InspectionRow['status']) {
  if (s === 'overdue') return 'destructive';
  if (s === 'due_today') return 'default';
  return 'secondary';
}

export function InspectionsPanel({
  rows,
  summaryValue,
  delta,
  onClose,
}: {
  rows: InspectionRow[];
  summaryValue: string | number;
  delta?: string;
  onClose: () => void;
}) {
  return (
    <>
      <div className="px-6 py-3 border-b border-border bg-muted/30">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{summaryValue}</span>
          {delta != null && <span className="text-sm text-muted-foreground">{delta}</span>}
        </div>
      </div>
      <Card className="mx-6 mt-4 border-border bg-card">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Inspections due today or overdue. Assign and complete to maintain quality.
          </p>
        </CardContent>
      </Card>
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Inspections due today</h3>
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
            <p className="font-medium text-foreground">All clear</p>
            <p className="text-sm text-muted-foreground mt-1">No inspections due today.</p>
            <Link href="/app/inspections">
              <Button variant="outline" size="sm" className="mt-4">Open inspections</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm">{row.siteName}</p>
                    <p className="text-xs text-muted-foreground">{row.accountName} · {row.dueDate}</p>
                    {row.inspector && <p className="text-xs text-muted-foreground">Inspector: {row.inspector}</p>}
                  </div>
                  <Badge variant={statusVariant(row.status)}>{row.status.replace('_', ' ')}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 flex gap-2 px-6 py-4 border-t border-border">
        <Button asChild size="sm">
          <Link href="/app/inspections">Open inspections</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
    </>
  );
}
