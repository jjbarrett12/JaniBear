'use client';

import {
  DollarSign,
  Percent,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Activity,
  Wallet,
  Award,
} from 'lucide-react';
import type { OverviewPayload, OverviewTrendMetric } from '@/lib/overview-data';
import { MetricTile } from '@/components/ui/metric-tile';

const METRIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  mrr: DollarSign,
  margin: Percent,
  retention: TrendingUp,
  churn_risk: AlertTriangle,
  pipeline: Briefcase,
  util_30: Activity,
  ar: Wallet,
  delivery: Award,
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export function OverviewContent({ data }: { data: OverviewPayload }) {
  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Overview</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Executive snapshot — trend and business health
          </p>
        </div>

        {/* Trend / business tiles — 6–8 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.trendMetrics.map((m) => (
            <MetricTile
              key={m.id}
              title={m.title}
              value={m.value}
              subvalue={m.subvalue ?? undefined}
              delta={m.delta ?? undefined}
              status={m.status}
              icon={METRIC_ICONS[m.id] ?? DollarSign}
              emptyTooltip="Data not available yet"
            />
          ))}
        </div>

        {/* Trends strip — placeholder deltas */}
        <section aria-labelledby="trends-heading">
          <h2 id="trends-heading" className="text-lg font-semibold text-foreground mb-3">
            Trends
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.trends.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-sm"
              >
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {t.value != null && (
                    <span className="text-xl font-semibold tabular-nums text-foreground">
                      {t.id === 'mrr' ? formatCurrency(t.value) : `${t.value}%`}
                    </span>
                  )}
                  {t.deltaLabel && (
                    <span className="text-sm text-muted-foreground">{t.deltaLabel}</span>
                  )}
                </div>
                <div className="mt-2 h-8 rounded bg-muted/50 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Chart placeholder</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Operational Risk (30 days) + Financial Health — side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section aria-labelledby="risk-heading">
            <h2 id="risk-heading" className="text-lg font-semibold text-foreground mb-3">
              Operational Risk (30 days)
            </h2>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <ul className="divide-y divide-border">
                {data.operationalRisk.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between px-5 py-3"
                  >
                    <span className="text-sm text-foreground">{r.label}</span>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {r.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section aria-labelledby="finance-heading">
            <h2 id="finance-heading" className="text-lg font-semibold text-foreground mb-3">
              Financial Health
            </h2>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  AR aging
                </p>
              </div>
              <ul className="divide-y divide-border">
                {data.financialHealth.arBuckets.map((b) => (
                  <li
                    key={b.label}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <span className="text-sm text-muted-foreground">{b.label}</span>
                    <span className="text-sm tabular-nums text-foreground">
                      {formatCurrency(b.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-3 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Collections risk</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {data.financialHealth.collectionsRiskCount} overdue
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
