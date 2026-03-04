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
import { getMockArAging, getMockInvoiceTable } from '@/lib/financial-health-mock';
import { CashCollectionsCharts } from '@/components/financial-health/cash-collections-charts';
import { getMockCashForecast } from '@/lib/financial-health-mock';
import { Info } from 'lucide-react';
import type { ARSnapshotExtended } from '@/lib/command-center-data';

function formatArCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

const AR_KPI_TILES_FALLBACK = [
  { label: 'Total AR', value: '$37.2k', delta: 3, sparkline: [32, 33, 34, 35, 36, 37, 37, 37, 37, 37, 37, 37.2], health: 'amber' as const },
  { label: 'Overdue AR', value: '$8.4k', delta: -5, sparkline: [10, 9.5, 9, 9, 8.5, 8.5, 8.4, 8.4, 8.4, 8.4, 8.4, 8.4], health: 'amber' as const },
  { label: 'Due next 7 days', value: '$12.1k', delta: 0, sparkline: [12, 12, 12, 12, 12, 12, 12.1, 12.1, 12.1, 12.1, 12.1, 12.1], health: 'green' as const },
  { label: 'Avg days to pay', value: '38', delta: 3, sparkline: [35, 34, 36, 37, 38, 36, 37, 38, 39, 38, 38, 38], health: 'amber' as const },
];

export function ArTab({ arSnapshot }: { arSnapshot?: ARSnapshotExtended | null }) {
  const arAging = getMockArAging();
  const cashForecast = getMockCashForecast();
  const invoices = getMockInvoiceTable();

  const tiles = arSnapshot
    ? [
        { ...AR_KPI_TILES_FALLBACK[0], value: formatArCurrency(arSnapshot.totalOutstanding) },
        { ...AR_KPI_TILES_FALLBACK[1], value: formatArCurrency(arSnapshot.overdueTotal) },
        AR_KPI_TILES_FALLBACK[2],
        AR_KPI_TILES_FALLBACK[3],
      ]
    : AR_KPI_TILES_FALLBACK;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1">
          AR & Collections KPIs
          <span title="Total AR, Overdue AR, Invoices due next 7 days, Avg days to pay / DSO">
            <Info className="h-3.5 w-3.5" />
          </span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tiles.map((tile) => (
            <Card key={tile.label} className="border-l-4 border-border">
              <CardContent className="p-3">
                <span className="text-[10px] font-medium uppercase text-muted-foreground">{tile.label}</span>
                <p className="font-heading text-lg font-bold tabular-nums mt-0.5">{tile.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          AR Aging (0–30 | 31–60 | 61–90 | 90+)
        </h2>
        <p className="text-xs text-muted-foreground mb-2">Click bucket to filter invoice table.</p>
        <CashCollectionsCharts arAging={arAging} cashForecast={cashForecast} />
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Invoices
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Invoice #</TableHead>
                  <TableHead className="text-xs">Client / Site</TableHead>
                  <TableHead className="text-xs">Issue date</TableHead>
                  <TableHead className="text-xs">Due date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-right">Paid</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs text-right">Days past due</TableHead>
                  <TableHead className="text-xs w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="py-2 text-sm font-medium">{inv.invoiceNumber}</TableCell>
                    <TableCell className="py-2 text-sm">{inv.clientName} / {inv.siteName}</TableCell>
                    <TableCell className="py-2 text-sm">{inv.issueDate}</TableCell>
                    <TableCell className="py-2 text-sm">{inv.dueDate}</TableCell>
                    <TableCell className="py-2 text-sm">{inv.status}</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">${(inv.total / 1000).toFixed(1)}k</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">${(inv.paid / 1000).toFixed(1)}k</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">${(inv.balance / 1000).toFixed(1)}k</TableCell>
                    <TableCell className="py-2 text-right text-sm tabular-nums">{inv.daysPastDue ?? '—'}</TableCell>
                    <TableCell className="py-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Record payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground mt-2">
          Row actions: Record payment (modal), Mark paid, Send reminder (stub), View invoice.
        </p>
      </section>
    </div>
  );
}
