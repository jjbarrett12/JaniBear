'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

const MOCK_LEAKAGE_ROWS = [
  { siteName: 'Tech Campus West', laborVariancePct: 18, suppliesDeltaPct: 5, issueRecurrence: 'High', gmTrend: '-2%', leakagePerMonth: 420 },
  { siteName: 'Retail Strip Mall', laborVariancePct: 12, suppliesDeltaPct: 8, issueRecurrence: 'Medium', gmTrend: '-1%', leakagePerMonth: 280 },
  { siteName: 'Hotel North', laborVariancePct: 8, suppliesDeltaPct: 15, issueRecurrence: 'Low', gmTrend: '0%', leakagePerMonth: 190 },
];

const MOCK_RECOMMENDATIONS = [
  { site: 'Tech Campus West', action: 'Raise price by $X to restore target margin', stub: true },
  { site: 'Retail Strip Mall', action: 'Reduce frequency / re-scope tasks', stub: true },
  { site: 'Hotel North', action: 'Change staffing plan (crew tier)', stub: true },
];

export function PricingLeakageTab() {
  const leakageScore = 72;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
          Leakage Score (0–100)
          <span title="Margin Leakage Score: labor variance, overtime, supplies anomalies, rework/issue recurrence, scope creep">
            <Info className="h-3.5 w-3.5" />
          </span>
        </h2>
        <Card className="border-l-4 border-health-amber max-w-xs">
          <CardContent className="p-4">
            <p className="text-[10px] font-medium uppercase text-muted-foreground">Margin Leakage Score</p>
            <p className="font-heading text-3xl font-bold tabular-nums mt-1">{leakageScore}</p>
            <ul className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <li>Labor variance</li>
              <li>Overtime concentration</li>
              <li>Supplies anomalies</li>
              <li>Rework / issue recurrence (from ops)</li>
              <li>Scope creep signals</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-2 border-b border-border">
              <h3 className="text-sm font-semibold">Leakage table (ranked)</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Site</TableHead>
                  <TableHead className="text-xs text-right">Est vs actual labor %</TableHead>
                  <TableHead className="text-xs text-right">Supplies delta</TableHead>
                  <TableHead className="text-xs">Issue recurrence</TableHead>
                  <TableHead className="text-xs text-right">GM% trend</TableHead>
                  <TableHead className="text-xs text-right">Leakage $/mo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_LEAKAGE_ROWS.map((r) => (
                  <TableRow key={r.siteName}>
                    <TableCell className="py-2 text-sm font-medium">{r.siteName}</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">+{r.laborVariancePct}%</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">+{r.suppliesDeltaPct}%</TableCell>
                    <TableCell className="py-2 text-sm">{r.issueRecurrence}</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">{r.gmTrend}</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">${r.leakagePerMonth}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recommended actions (top 3)</h3>
            <ul className="space-y-3">
              {MOCK_RECOMMENDATIONS.map((rec) => (
                <li key={rec.site} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="font-medium text-sm">{rec.site}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.action}</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs" disabled={rec.stub}>
                    Apply (stub)
                  </Button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Playbooks: Raise price, Reduce frequency / re-scope, Change staffing plan, Add paid add-ons.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
