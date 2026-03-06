'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SlaRow } from '../../mockDashboardData';

const severityVariant = (s: SlaRow['severity']) =>
  s === 'high' ? 'destructive' : s === 'medium' ? 'default' : 'secondary';

export function SLAPanel({
  rows,
  summaryValue,
  delta,
  onClose,
}: {
  rows: SlaRow[];
  summaryValue: string | number;
  delta?: string;
  onClose: () => void;
}) {
  return (
    <>
      <div className="px-4 py-2.5 border-b border-border bg-muted/30 sm:px-6">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl">{summaryValue}</span>
          {delta != null && <span className="text-sm text-muted-foreground">{delta}</span>}
        </div>
      </div>
      <Card className="mx-4 mt-3 border-border bg-card sm:mx-6">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Overdue tasks and SLA breaches that need assignment or resolution.
          </p>
        </CardContent>
      </Card>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">SLA breaches / overdue</h3>
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
            <p className="font-medium text-foreground">All clear</p>
            <p className="text-sm text-muted-foreground mt-0.5">No SLA breaches or overdue tasks.</p>
            <Link href="/app/reports/operations">
              <Button variant="outline" size="sm" className="mt-3">View operations report</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={row.href}
                  className="flex items-center justify-between gap-4 rounded-md border border-border bg-card p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm">{row.title}</p>
                    <p className="text-xs text-muted-foreground">Due {row.dueDate}{row.assignee ? ` · ${row.assignee}` : ''}</p>
                  </div>
                  <Badge variant={severityVariant(row.severity)}>{row.severity}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 flex gap-2 px-4 py-3 border-t border-border sm:px-6">
        <Button asChild size="sm">
          <Link href="/app/ops/issues-sla">View all issues</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
      </div>
    </>
  );
}
