'use client';

import React, { useMemo } from 'react';
import { useKpiData } from '@/contexts/kpi-data-context';
import { StrategicTimeframeToggle } from '@/components/kpi/strategic-timeframe-toggle';
import { StrategicKpiCard } from '@/components/kpi/StrategicKpiCard';
import { AIExecutiveInsight } from '@/components/kpi/AIExecutiveInsight';
import { RiskAndAttentionSection } from '@/components/kpi/RiskAndAttentionSection';
import { PerformanceTabs } from '@/components/kpi/PerformanceTabs';
import { mapBusinessPulseCards } from '@/lib/kpi-dashboard-adapter';
import { KpiSection } from '@/components/kpi/KpiSection';

/**
 * Strategic Performance module: Business Pulse (max 8 KPIs), Risk & Attention, Performance Tabs.
 * 12-column responsive grid, no nested scroll. Enterprise, minimal.
 */
export function StrategicPerformanceModule() {
  const { timeframe, setTimeframe, executiveCards, attentionAlerts, salesMetrics, opsHealth } = useKpiData();

  const businessPulseCards = useMemo(
    () => mapBusinessPulseCards(executiveCards, salesMetrics, opsHealth),
    [executiveCards, salesMetrics, opsHealth]
  );

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Strategic Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Executive snapshot, risk, and performance by area.
          </p>
        </div>
        <div className="shrink-0">
          <StrategicTimeframeToggle value={timeframe} onChange={setTimeframe} />
        </div>
      </div>

      {/* 1. AI Executive Insight */}
      <section className="grid grid-cols-12">
        <div className="col-span-12">
          <AIExecutiveInsight alerts={attentionAlerts} />
        </div>
      </section>

      {/* 2. Business Pulse — max 8 KPIs, 12-col grid */}
      <KpiSection title="Business Pulse" subtitle="Key outcomes at a glance">
        <div className="grid grid-cols-12 gap-4">
          {businessPulseCards.map((card) => (
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
      </KpiSection>

      {/* 3. Risk & Attention + Quick Actions */}
      <KpiSection title="Risk & Attention" subtitle="Items requiring action">
        <RiskAndAttentionSection alerts={attentionAlerts} />
      </KpiSection>

      {/* 4. Performance Tabs: Revenue, Operations, Sales, Account Health */}
      <KpiSection title="Performance" subtitle="Revenue, operations, sales, account health">
        <PerformanceTabs />
      </KpiSection>
    </>
  );
}
