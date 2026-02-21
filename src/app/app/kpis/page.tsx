'use client';

import { useState, useMemo } from 'react';
import type { StrategicTimeframe } from '@/lib/kpi-metrics';
import {
  getExecutiveSnapshot,
  getAttentionAlerts,
  getSalesEngineMetrics,
  getOpportunitiesByStage,
  getOperationalHealth,
  getCrewPerformance,
} from '@/lib/kpi-strategic-data';
import { ExecutiveSnapshotCard } from '@/components/kpi/executive-snapshot-card';
import { AttentionRequiredStrip } from '@/components/kpi/attention-required-strip';
import { StrategicTimeframeToggle } from '@/components/kpi/strategic-timeframe-toggle';
import { KpiMetricTile } from '@/components/kpi/kpi-metric-tile';
import { OpsHealthCardTile } from '@/components/kpi/ops-health-card';
import { CrewMetricCardTile } from '@/components/kpi/crew-metric-card';
import { Card, CardContent } from '@/components/ui/card';

export default function KpiDashboardPage() {
  const [timeframe, setTimeframe] = useState<StrategicTimeframe>('90d');

  const executiveCards = useMemo(() => getExecutiveSnapshot(timeframe), [timeframe]);
  const attentionAlerts = useMemo(() => getAttentionAlerts(), []);
  const salesMetrics = useMemo(() => getSalesEngineMetrics(timeframe), [timeframe]);
  const opportunitiesByStage = useMemo(() => getOpportunitiesByStage(), []);
  const opsHealth = useMemo(() => getOperationalHealth(timeframe), [timeframe]);
  const crewMetrics = useMemo(() => getCrewPerformance(timeframe), [timeframe]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header: title + timeframe toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Strategic Performance Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Executive performance: growth, operations, contracts, and crew efficiency.
          </p>
        </div>
        <StrategicTimeframeToggle value={timeframe} onChange={setTimeframe} />
      </div>

      {/* 1. Executive Snapshot — 6 large cards */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Executive Snapshot
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {executiveCards.map((card) => (
            <ExecutiveSnapshotCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      {/* 2. Attention Required — only if alerts exist */}
      {attentionAlerts.length > 0 && (
        <section>
          <AttentionRequiredStrip alerts={attentionAlerts} />
        </section>
      )}

      {/* 3. Sales Engine Metrics */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Sales Engine Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {salesMetrics.map((tile) => (
            <KpiMetricTile key={tile.label} tile={tile} />
          ))}
          <Card className="border-l-4 border-border">
            <CardContent className="p-3">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Opportunities by Stage
              </span>
              <ul className="mt-2 space-y-1 text-sm">
                {opportunitiesByStage.map(({ stage, count }) => (
                  <li key={stage} className="flex justify-between gap-2">
                    <span className="text-muted-foreground truncate">{stage}</span>
                    <span className="font-medium tabular-nums shrink-0">{count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 4. Operational Health */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Operational Health
        </h2>
        <p className="text-xs text-muted-foreground mb-2">
          Green = Healthy · Yellow = Watch · Red = Critical · Blue = Opportunity
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {opsHealth.map((card) => (
            <OpsHealthCardTile key={card.id} card={card} />
          ))}
        </div>
      </section>

      {/* 5. Crew Performance */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Crew Performance
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {crewMetrics.map((card) => (
            <CrewMetricCardTile key={card.id} card={card} />
          ))}
        </div>
      </section>
    </div>
  );
}
