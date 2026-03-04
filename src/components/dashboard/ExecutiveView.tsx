'use client';

import { useDashboardData } from '@/contexts/dashboard-data-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DollarSign,
  Percent,
  Clock,
  AlertTriangle,
  ClipboardCheck,
  TrendingUp,
} from 'lucide-react';

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

export function ExecutiveView() {
  const data = useDashboardData();
  const { revenue, ar, accountHealth, quality, pipeline } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="min-w-0">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Revenue
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums">{fmtCurrency(revenue.todayTotal)}</p>
          <p className="text-xs text-muted-foreground">Today</p>
          <p className="text-lg font-medium tabular-nums">{fmtCurrency(revenue.wtdTotal)}</p>
          <p className="text-xs text-muted-foreground">WTD</p>
          {revenue.monthPacingPct != null && (
            <p className="text-sm text-muted-foreground">Month pacing: {revenue.monthPacingPct}%</p>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Percent className="h-4 w-4" />
            Gross margin
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            AR aging
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums">{fmtCurrency(ar.totalOutstanding)}</p>
          <p className="text-xs text-muted-foreground">Outstanding</p>
          <div className="text-sm space-y-0.5">
            {ar.overdue30 > 0 && <p className="tabular-nums">30+ days: {fmtCurrency(ar.overdue30)}</p>}
            {ar.overdue60 > 0 && <p className="tabular-nums">60+ days: {fmtCurrency(ar.overdue60)}</p>}
            {ar.overdue90 > 0 && <p className="tabular-nums text-amber-600 dark:text-amber-400">90+ days: {fmtCurrency(ar.overdue90)}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            Account health
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-2xl font-semibold tabular-nums">{accountHealth.pctAbove80}%</p>
          <p className="text-xs text-muted-foreground">Sites above 80</p>
          {accountHealth.countBelow60 > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{accountHealth.countBelow60} below 60</p>
          )}
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
            <span
              className="bg-emerald-500"
              style={{ width: `${accountHealth.greenPct}%` }}
            />
            <span
              className="bg-amber-500"
              style={{ width: `${accountHealth.yellowPct}%` }}
            />
            <span
              className="bg-red-500"
              style={{ width: `${accountHealth.redPct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            Inspection trend
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums">
            {quality.avgScore != null ? quality.avgScore : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Avg score (yesterday)</p>
          <p className="text-sm text-muted-foreground">{quality.inspectionsYesterday} inspections</p>
          {quality.locationsUnder85 > 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400">{quality.locationsUnder85} under 85</p>
          )}
        </CardContent>
      </Card>

      <Card className="min-w-0">
        <CardHeader className="pb-1">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Pipeline value
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-2xl font-semibold tabular-nums">{fmtCurrency(pipeline.pipelineValue)}</p>
          <p className="text-xs text-muted-foreground">{pipeline.openBids} open</p>
          {pipeline.winRate30Pct != null && (
            <p className="text-sm text-muted-foreground">Win rate 30d: {pipeline.winRate30Pct}%</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
