'use client';

import { useDashboardData } from '@/contexts/dashboard-data-context';
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

/** Shared card shell: matches cockpit CommandPanel styling (border, padding) for consistent hierarchy. */
function ExecutiveCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card dark:bg-card/90 overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 p-4 sm:p-5 border-b border-border shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="flex-1 min-h-0 p-4 sm:p-5 space-y-1">
        {children}
      </div>
    </section>
  );
}

export function ExecutiveView() {
  const data = useDashboardData();
  const { revenue, ar, accountHealth, quality, pipeline } = data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ExecutiveCard title="Revenue" icon={DollarSign}>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{fmtCurrency(revenue.todayTotal)}</p>
        <p className="text-xs text-muted-foreground">Today</p>
        <p className="text-lg font-medium tabular-nums text-foreground">{fmtCurrency(revenue.wtdTotal)}</p>
        <p className="text-xs text-muted-foreground">WTD</p>
        {revenue.monthPacingPct != null && (
          <p className="text-sm text-muted-foreground">Month pacing: {revenue.monthPacingPct}%</p>
        )}
      </ExecutiveCard>

      <ExecutiveCard title="Gross margin" icon={Percent}>
        <p className="text-2xl font-semibold text-muted-foreground">—</p>
        <p className="text-xs text-muted-foreground">Coming soon</p>
      </ExecutiveCard>

      <ExecutiveCard title="AR aging" icon={Clock}>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{fmtCurrency(ar.totalOutstanding)}</p>
        <p className="text-xs text-muted-foreground">Outstanding</p>
        <div className="text-sm space-y-0.5">
          {ar.overdue30 > 0 && <p className="tabular-nums text-foreground">30+ days: {fmtCurrency(ar.overdue30)}</p>}
          {ar.overdue60 > 0 && <p className="tabular-nums text-foreground">60+ days: {fmtCurrency(ar.overdue60)}</p>}
          {ar.overdue90 > 0 && <p className="tabular-nums text-amber-600 dark:text-amber-400">90+ days: {fmtCurrency(ar.overdue90)}</p>}
        </div>
      </ExecutiveCard>

      <ExecutiveCard title="Account health" icon={AlertTriangle}>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{accountHealth.pctAbove80}%</p>
        <p className="text-xs text-muted-foreground">Sites above 80</p>
        {accountHealth.countBelow60 > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{accountHealth.countBelow60} below 60</p>
        )}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted mt-2">
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
      </ExecutiveCard>

      <ExecutiveCard title="Inspection trend" icon={ClipboardCheck}>
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          {quality.avgScore != null ? quality.avgScore : '—'}
        </p>
        <p className="text-xs text-muted-foreground">Avg score (yesterday)</p>
        <p className="text-sm text-muted-foreground">{quality.inspectionsYesterday} inspections</p>
        {quality.locationsUnder85 > 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">{quality.locationsUnder85} under 85</p>
        )}
      </ExecutiveCard>

      <ExecutiveCard title="Pipeline value" icon={TrendingUp}>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{fmtCurrency(pipeline.pipelineValue)}</p>
        <p className="text-xs text-muted-foreground">{pipeline.openBids} open</p>
        {pipeline.winRate30Pct != null && (
          <p className="text-sm text-muted-foreground">Win rate 30d: {pipeline.winRate30Pct}%</p>
        )}
      </ExecutiveCard>
    </div>
  );
}
