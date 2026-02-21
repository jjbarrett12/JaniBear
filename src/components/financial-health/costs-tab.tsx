'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LaborOpsCharts } from '@/components/financial-health/labor-ops-charts';
import { getMockLaborTrend, getMockOvertimeWeekly, getMockAccountBubbles } from '@/lib/financial-health-mock';
import { Info } from 'lucide-react';

const COST_KPI = [
  { label: 'Labor % of revenue', value: '58%', target: 'Target: <55%' },
  { label: 'Overtime %', value: '6%', target: 'Target: <8%' },
  { label: 'Supplies % of revenue', value: '9%', target: '' },
  { label: 'Revenue per labor hour', value: '$42', target: '' },
  { label: 'Cost per sq ft', value: '$0.12', target: 'When sq ft exists' },
  { label: 'Cost variance vs estimate', value: '4.2%', target: 'Bid/contract vs actual' },
];

const MOCK_OVERTIME = [
  { siteName: 'Tech Campus West', overtimePct: 12, hours: 28 },
  { siteName: 'Riverside Office Park', overtimePct: 8, hours: 18 },
];
const MOCK_SUPPLY = [
  { siteName: 'Medical Plaza Suite', deltaPct: 22, spend: 288 },
  { siteName: 'Hotel North', deltaPct: 15, spend: 126 },
];

export function CostsTab() {
  const laborTrend = getMockLaborTrend(58);
  const overtime = getMockOvertimeWeekly();
  const bubbles = getMockAccountBubbles();

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
          Cost KPIs
          <span title="Labor %, Overtime %, Supplies %, Revenue per labor hour, Cost per sq ft">
            <Info className="h-3.5 w-3.5" />
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {COST_KPI.map((k) => (
            <Card key={k.label} className="border-l-4 border-border">
              <CardContent className="p-3">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">{k.label}</span>
                <p className="font-heading text-lg font-bold tabular-nums mt-0.5">{k.value}</p>
                {k.target && <p className="text-xs text-muted-foreground mt-0.5">{k.target}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section>
        <LaborOpsCharts laborTrend={laborTrend} overtimeWeekly={overtime} accountBubbles={bubbles} bidAccuracy={1.02} />
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Overtime hotspots by site</h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Site</TableHead>
                  <TableHead className="text-xs text-right">Overtime %</TableHead>
                  <TableHead className="text-xs text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_OVERTIME.map((r) => (
                  <TableRow key={r.siteName} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="py-2 text-sm">{r.siteName}</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">{r.overtimePct}%</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">{r.hours}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Supply spike hotspots</h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Site</TableHead>
                  <TableHead className="text-xs text-right">Delta %</TableHead>
                  <TableHead className="text-xs text-right">Spend $</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_SUPPLY.map((r) => (
                  <TableRow key={r.siteName} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="py-2 text-sm">{r.siteName}</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">+{r.deltaPct}%</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">${r.spend}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
