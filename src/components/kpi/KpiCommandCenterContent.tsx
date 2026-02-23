'use client';

import { useState } from 'react';
import { ExecutiveKpiTile } from '@/components/kpi/ExecutiveKpiTile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { KpiSummaryRow } from '@/lib/kpi-command-center';
import type { KpiDateRange } from '@/lib/kpi-command-center';

const DATE_RANGES: { value: KpiDateRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'ytd', label: 'YTD' },
];

function formatCurrency(n: number | null): string {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function statusFromDelta(delta: number | null): 'good' | 'warning' | 'danger' {
  if (delta == null) return 'good';
  if (delta >= 0) return 'good';
  if (delta >= -5) return 'warning';
  return 'danger';
}

function statusFromLevel(value: number | null, goodThreshold: number, warnThreshold: number): 'good' | 'warning' | 'danger' {
  if (value == null) return 'good';
  if (value <= goodThreshold) return 'good';
  if (value <= warnThreshold) return 'warning';
  return 'danger';
}

export function KpiCommandCenterContent({ summary }: { summary: KpiSummaryRow | null }) {
  const [dateRange, setDateRange] = useState<KpiDateRange>('30d');
  const [comparePrevious, setComparePrevious] = useState(false);

  const mrr = summary?.mrr ?? 312400;
  const grossMargin = summary?.gross_margin_percent ?? 42;
  const netMrrChange = summary?.net_mrr_change_30d ?? 2.1;
  const atRisk = summary?.accounts_at_risk_count ?? 3;

  const execTiles = [
    {
      title: 'MRR',
      value: formatCurrency(mrr),
      trendPercent: netMrrChange,
      status: statusFromDelta(summary?.net_mrr_change_30d ?? 2.1),
      comparisonLabel: comparePrevious ? 'vs previous period' : 'Current period',
      drilldownRoute: '/app/financial-health',
    },
    {
      title: 'Gross Margin %',
      value: grossMargin != null ? `${grossMargin}%` : '—',
      trendPercent: 0.8,
      status: statusFromLevel(grossMargin, 40, 35),
      comparisonLabel: comparePrevious ? 'vs previous period' : 'Current period',
      drilldownRoute: '/app/financial-health',
    },
    {
      title: 'Net MRR Change',
      value: `${netMrrChange >= 0 ? '+' : ''}${netMrrChange}%`,
      trendPercent: 0.5,
      status: statusFromDelta(netMrrChange),
      comparisonLabel: '30d',
      drilldownRoute: '/app/financial-health',
    },
    {
      title: 'Accounts at Risk',
      value: atRisk,
      trendPercent: atRisk > 5 ? 10 : 0,
      status: atRisk > 5 ? 'danger' : atRisk > 2 ? 'warning' : 'good',
      comparisonLabel: 'Requires attention',
      drilldownRoute: '/app/accounts',
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Top bar: time controls */}
      <div className="flex flex-wrap items-center gap-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Label htmlFor="kpi-range" className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Date range
          </Label>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as KpiDateRange)}>
            <SelectTrigger id="kpi-range" className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={comparePrevious}
            onChange={(e) => setComparePrevious(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-sm text-muted-foreground">Compare vs previous period</span>
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <Label className="text-xs font-medium text-muted-foreground">Territory</Label>
          <Select disabled>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Account size</Label>
          <Select disabled>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-muted-foreground">Service type</Label>
          <Select disabled>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section 1: Executive Snapshot */}
      <section aria-labelledby="executive-snapshot-heading">
        <h2 id="executive-snapshot-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Executive Snapshot
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {execTiles.map((tile) => (
            <ExecutiveKpiTile key={tile.title} {...tile} />
          ))}
        </div>
      </section>

      {/* Section 2: Revenue & Profitability */}
      <section aria-labelledby="revenue-heading">
        <h2 id="revenue-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Revenue & Profitability
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-xl border border-border/80 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">MRR Trend (12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
                Line chart placeholder
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border/80 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Gross Margin & Labor %</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
                Margin trend placeholder
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 3: Operational Performance */}
      <section aria-labelledby="ops-heading">
        <h2 id="ops-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Operational Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Crew Utilization %', value: summary?.crew_utilization_percent ?? 78, status: 'good' as const },
            { label: 'Inspection Pass Rate', value: summary?.inspection_pass_rate != null ? `${Math.round(summary.inspection_pass_rate)}%` : '94%', status: 'good' as const },
            { label: 'SLA Breaches', value: summary?.sla_breaches_count ?? 2, status: (summary?.sla_breaches_count ?? 0) > 3 ? 'danger' : 'warning' as const },
            { label: 'Open Issues / Work Orders', value: summary?.open_issues_count ?? 5, status: (summary?.open_issues_count ?? 0) > 10 ? 'danger' : 'good' as const },
          ].map((card) => (
            <Card key={card.label} className={cn('rounded-xl border border-border/80 bg-card', card.status === 'danger' && 'border-l-[3px] border-l-red-600', card.status === 'warning' && 'border-l-[3px] border-l-amber-600')}>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-foreground">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Section 4: Cash & Risk */}
      <section aria-labelledby="cash-risk-heading">
        <h2 id="cash-risk-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Cash & Risk
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-xl border border-border/80 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">AR Aging</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[160px] flex items-center justify-center rounded-lg bg-muted/30 border border-border/50 text-sm text-muted-foreground">
                Stacked bar: 0–30 / 31–60 / 61–90 / 90+
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Over 60 Days %', value: summary?.ar_over_60_percent != null ? `${summary.ar_over_60_percent}%` : '12%' },
              { label: 'Contracts Expiring (90d)', value: summary?.contracts_expiring_90d_count ?? 4 },
              { label: 'Client Health Decay Risk', value: summary?.client_health_decay_risk_count ?? 2 },
            ].map((c) => (
              <Card key={c.label} className="rounded-xl border border-border/80 bg-card">
                <CardContent className="p-5">
                  <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                  <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-foreground">{c.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Sales Health */}
      <section aria-labelledby="sales-heading">
        <h2 id="sales-heading" className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Sales Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pipeline Value', value: formatCurrency(summary?.pipeline_value ?? 485000) },
            { label: 'Close Rate %', value: summary?.close_rate_percent != null ? `${summary.close_rate_percent}%` : '48%' },
            { label: 'Avg Contract Size', value: formatCurrency(summary?.avg_contract_size ?? 7200) },
            { label: 'Sales Cycle (days)', value: summary?.sales_cycle_days ?? 28 },
          ].map((c) => (
            <Card key={c.label} className="rounded-xl border border-border/80 bg-card">
              <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
                <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-foreground">{c.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
