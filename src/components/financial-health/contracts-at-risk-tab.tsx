'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';
import { AppLink } from '@/components/app/app-link';
import { appRoutes } from '@/lib/routes';

const MOCK_RISK_ROWS = [
  { siteName: 'Tech Campus West', clientName: 'TechCo', riskScore: 78, gmTrend: '-2%', overdueStatus: '$5.1k', issueTrend: 'Up', lastInspectionScore: 82, primaryReason: 'Low margin + late payer' },
  { siteName: 'Retail Strip Mall', clientName: 'MallCo', riskScore: 65, gmTrend: '-1%', overdueStatus: '$3.2k', issueTrend: 'Stable', lastInspectionScore: 88, primaryReason: 'Overdue AR' },
  { siteName: 'Hotel North', clientName: 'StayWell', riskScore: 58, gmTrend: '0%', overdueStatus: '$0', issueTrend: 'Down', lastInspectionScore: 79, primaryReason: 'Supply spike + low GM' },
];

export function ContractsAtRiskTab() {
  const [selectedRisk, setSelectedRisk] = useState<typeof MOCK_RISK_ROWS[0] | null>(null);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
          Contracts at risk (ranked case files)
          <span title="Finance risk blended with ops: GM trend, overdue $, issue trend, last inspection score">
            <Info className="h-3.5 w-3.5" />
          </span>
        </h2>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">Site / Client</TableHead>
                    <TableHead className="text-xs text-right">Risk score</TableHead>
                    <TableHead className="text-xs text-right">GM% trend</TableHead>
                    <TableHead className="text-xs text-right">Overdue $</TableHead>
                    <TableHead className="text-xs">Issue trend</TableHead>
                    <TableHead className="text-xs text-right">Last inspection</TableHead>
                    <TableHead className="text-xs">Primary reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_RISK_ROWS.map((r) => (
                    <TableRow
                      key={r.siteName}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedRisk(r)}
                    >
                      <TableCell className="py-2 text-sm">
                        <div>
                          <span className="font-medium">{r.siteName}</span>
                          <span className="text-muted-foreground block text-xs">{r.clientName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right text-sm tabular-nums">{r.riskScore}</TableCell>
                      <TableCell className="py-2 text-right text-sm tabular-nums">{r.gmTrend}</TableCell>
                      <TableCell className="py-2 text-right text-sm tabular-nums">{r.overdueStatus}</TableCell>
                      <TableCell className="py-2 text-sm">{r.issueTrend}</TableCell>
                      <TableCell className="py-2 text-right text-sm tabular-nums">{r.lastInspectionScore}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {r.primaryReason}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selectedRisk && (
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">Risk summary</h3>
                <p className="text-xs text-muted-foreground mb-3">{selectedRisk.siteName} · {selectedRisk.clientName}</p>
                <section className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">What changed in last 30 days</h4>
                  <ul className="text-sm list-disc pl-4 space-y-0.5">
                    <li>GM% declined 2%</li>
                    <li>One invoice entered 31–60 day bucket</li>
                    <li>Two new issues opened</li>
                  </ul>
                </section>
                <section className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Why it&apos;s flagged</h4>
                  <ul className="text-sm list-disc pl-4 space-y-0.5">
                    <li>Margin below 40%</li>
                    <li>Overdue balance &gt; $5k</li>
                    <li>Issue recurrence above baseline</li>
                  </ul>
                </section>
                <section className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Recommended next steps</h4>
                  <ul className="text-sm list-disc pl-4 space-y-0.5">
                    <li>Follow up on overdue invoice</li>
                    <li>Review labor hours vs contract</li>
                    <li>Schedule site walk with client</li>
                  </ul>
                </section>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <AppLink href={appRoutes.inspections()}>Inspections</AppLink>
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" asChild>
                    <AppLink href={appRoutes.issues()}>Issues</AppLink>
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs" disabled>Contract</Button>
                  <Button variant="outline" size="sm" className="text-xs" disabled>Invoices</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
