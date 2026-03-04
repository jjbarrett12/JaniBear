'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { RepSalesMetrics } from '@/types/sales';
import { Flame, Target, Clock, AlertTriangle, Trophy, DollarSign, TrendingUp } from 'lucide-react';

type KpiStatus = 'red' | 'yellow' | 'green';

function statusBorder(s: KpiStatus): string {
  return s === 'red' ? 'border-l-health-red' : s === 'yellow' ? 'border-l-amber-500' : 'border-l-health-green';
}

export function SalesRevenueKpis({
  metrics,
  openPipelineValue,
  dealsStalled14d,
}: {
  metrics: RepSalesMetrics | null;
  openPipelineValue: number;
  dealsStalled14d: number;
}) {
  const m = metrics;
  const weightedForecast = m?.weighted_pipeline ?? 0;
  const winRate30 = m?.close_rate_30d != null ? m.close_rate_30d * 100 : null;
  const avgContract = m?.avg_contract_size_30d ?? null;
  const revenueClosingMonth = m?.mrr_closed_mtd ?? 0;

  const stalledStatus: KpiStatus = dealsStalled14d >= 5 ? 'red' : dealsStalled14d >= 2 ? 'yellow' : 'green';
  const pipelineStatus: KpiStatus =
    openPipelineValue >= (m?.monthly_mrr_target ?? 0) * 2 ? 'green' : openPipelineValue >= (m?.monthly_mrr_target ?? 0) ? 'yellow' : 'red';
  const forecastStatus: KpiStatus = weightedForecast >= (m?.monthly_mrr_target ?? 0) ? 'green' : weightedForecast > 0 ? 'yellow' : 'red';
  const winRateStatus: KpiStatus =
    winRate30 != null ? (winRate30 >= 40 ? 'green' : winRate30 >= 25 ? 'yellow' : 'red') : 'yellow';
  const revenueStatus: KpiStatus =
    (m?.monthly_mrr_target ?? 0) > 0
      ? revenueClosingMonth >= m!.monthly_mrr_target ? 'green' : revenueClosingMonth >= m!.monthly_mrr_target * 0.5 ? 'yellow' : 'red'
      : 'green';

  const kpis: { id: string; label: string; value: string; status: KpiStatus; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'pipeline', label: 'Open Pipeline Value', value: formatCurrency(openPipelineValue), status: pipelineStatus, icon: Flame },
    { id: 'forecast', label: 'Weighted Forecast', value: formatCurrency(weightedForecast), status: forecastStatus, icon: Target },
    { id: 'stalled', label: 'Deals Stalled >14d', value: String(dealsStalled14d), status: stalledStatus, icon: Clock },
    { id: 'at_risk', label: 'Deals At Risk', value: String(dealsStalled14d), status: dealsStalled14d > 0 ? 'red' : 'green', icon: AlertTriangle },
    { id: 'win_rate', label: 'Win Rate (30d)', value: winRate30 != null ? `${Math.round(winRate30)}%` : '—', status: winRateStatus, icon: Trophy },
    { id: 'avg_contract', label: 'Avg Contract Value', value: avgContract != null ? formatCurrency(avgContract) : '—', status: avgContract != null && avgContract >= 500 ? 'green' : 'yellow', icon: DollarSign },
    { id: 'revenue_month', label: 'Revenue Closing This Month', value: formatCurrency(revenueClosingMonth), status: revenueStatus, icon: TrendingUp },
  ];

  return (
    <section className="rounded-lg border border-border bg-card/80 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">Revenue snapshot</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.id} className={`border-l-4 ${statusBorder(k.status)} transition-shadow hover:shadow-md`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">{k.label}</span>
                </div>
                <p className="font-heading text-lg font-bold tabular-nums mt-1 truncate">{k.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
