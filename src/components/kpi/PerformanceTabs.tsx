'use client';

import { useState } from 'react';
import { useKpiData } from '@/contexts/kpi-data-context';
import { StrategicKpiCard } from '@/components/kpi/StrategicKpiCard';
import {
  mapBusinessPulseCards,
  mapTier2SalesCards,
  mapOpsSubmetrics,
  computeOpsCompositeScore,
  mapAttentionStripItems,
} from '@/lib/kpi-dashboard-adapter';
import { cn } from '@/lib/utils';
import { DollarSign, Settings, TrendingUp, Heart } from 'lucide-react';

type TabId = 'revenue' | 'operations' | 'sales' | 'account_health';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'operations', label: 'Operations', icon: Settings },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'account_health', label: 'Account Health', icon: Heart },
];

export function PerformanceTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('revenue');
  const {
    executiveCards,
    salesMetrics,
    opsHealth,
    opportunitiesByStage,
    attentionAlerts,
  } = useKpiData();

  const tier2Sales = mapTier2SalesCards(salesMetrics);
  const opsComposite = computeOpsCompositeScore(opsHealth);
  const opsSubmetrics = mapOpsSubmetrics(opsHealth);
  const attentionItems = mapAttentionStripItems(attentionAlerts);

  const revenueCards = executiveCards
    .filter((c) => ['mrr', 'active_contracts', 'client_retention', 'net_revenue_growth'].includes(c.id))
    .map((c) => ({
      id: c.id,
      label: c.label,
      value: c.value,
      trendPct: c.delta,
      comparison30d: c.targetBenchmark?.replace(/^Target:\s*/i, '').trim(),
      sparkline: c.sparkline,
      status: (c.health === 'green' ? 'healthy' : c.health === 'amber' ? 'watch' : c.health === 'red' ? 'critical' : 'neutral') as 'healthy' | 'watch' | 'critical' | 'neutral',
    }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-primary/20 bg-muted/20 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              activeTab === id
                ? 'bg-primary/15 text-primary shadow-sm border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary/5'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-12 gap-4">
          {revenueCards.map((card) => (
            <div key={card.id} className="col-span-12 sm:col-span-6 lg:col-span-3">
              <StrategicKpiCard
                label={card.label}
                value={card.value}
                trendPct={card.trendPct}
                comparison30d={card.comparison30d}
                sparkline={card.sparkline}
                status={card.status}
              />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'operations' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Operational Health Composite</h4>
              <p className="mt-2 font-heading text-2xl font-bold tabular-nums">{opsComposite.score}%</p>
              <p className="text-xs text-muted-foreground mt-0.5">Inspection, SLA, schedule, issue recurrence</p>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8">
            <ul className="space-y-2">
              {opsSubmetrics.map((s) => (
                <li key={s.label} className="flex items-center justify-between rounded-md border border-border px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium tabular-nums">{s.valuePct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="grid grid-cols-12 gap-4">
          {tier2Sales.map((card) => (
            <div key={card.id} className="col-span-12 sm:col-span-6">
              <StrategicKpiCard
                label={card.label}
                value={card.value}
                trendPct={card.deltaPct}
                comparison30d={card.target ?? 'vs prior period'}
                status={card.status}
              />
            </div>
          ))}
          <div className="col-span-12">
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Opportunities by stage</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {opportunitiesByStage.map(({ stage, count }) => (
                <div key={stage} className="rounded-lg border border-border bg-card px-3 py-2 text-center">
                  <p className="text-lg font-semibold tabular-nums">{count}</p>
                  <p className="text-xs text-muted-foreground truncate">{stage}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account_health' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Items requiring attention that affect account health.</p>
          {attentionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No account health alerts.</p>
          ) : (
            <ul className="space-y-2">
              {attentionItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2.5 text-sm">
                  <span className="text-foreground">{item.label}</span>
                  <span className={cn('font-medium tabular-nums', item.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400')}>
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
