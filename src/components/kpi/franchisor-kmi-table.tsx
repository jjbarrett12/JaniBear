'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import type { KmiKpiRow, StandaloneKpiRow } from '@/lib/kpi-metrics';
import { KMI_TOTAL_REGIONS } from '@/lib/kpi-metrics';
import { Target } from 'lucide-react';

interface FranchisorKmiTableProps {
  rows: KmiKpiRow[];
  kmiTotal: number;
  standaloneKpi?: StandaloneKpiRow | null;
  /** Optional KMI goal (e.g. 0 = best) */
  kmiGoal?: number;
}

export function FranchisorKmiTable({
  rows,
  kmiTotal,
  standaloneKpi = null,
  kmiGoal,
}: FranchisorKmiTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5" />
          Key Metric Index (KMI) — Outcome Review
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Suggested outcome metrics. Based on self-reported data. Based out of {KMI_TOTAL_REGIONS} regions.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">KPI</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">Previous Month Ranking</TableHead>
                <TableHead className="text-right bg-amber-500/10">National Ranking</TableHead>
                <TableHead className="text-right">Weighting Factor</TableHead>
                <TableHead className="text-right">Weighted Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.currentValue}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.previousMonthRank}</TableCell>
                  <TableCell className="text-right tabular-nums bg-amber-500/10">{row.nationalRank}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.weight}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.weightedScore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-semibold">
                  KMI (Key Metric Index)
                </TableCell>
                <TableCell colSpan={2} className="text-right font-heading text-lg font-bold tabular-nums">
                  {kmiTotal}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {kmiGoal != null && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Suggested goal (lower is better)</span>
            <span className="inline-flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-400">
              GOALS — KMI = {kmiGoal}
            </span>
          </div>
        )}

        {standaloneKpi && (
          <div className="border-t border-border px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Additional outcome metric
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium">{standaloneKpi.label}</span>
              <span className="tabular-nums font-heading">{standaloneKpi.currentValue}</span>
              <span className="text-sm text-muted-foreground">
                Previous month ranking: {standaloneKpi.previousMonthRank} · National ranking: {standaloneKpi.nationalRank}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
