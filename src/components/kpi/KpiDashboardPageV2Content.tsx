'use client';

import React, { useState, useMemo } from 'react';
import { useKpiData } from '@/contexts/kpi-data-context';
import { StrategicTimeframeToggle } from '@/components/kpi/strategic-timeframe-toggle';
import { KpiSection } from '@/components/kpi/KpiSection';
import { KpiCardLarge } from '@/components/kpi/KpiCardLarge';
import { KpiCardMedium } from '@/components/kpi/KpiCardMedium';
import { KpiPillRow } from '@/components/kpi/KpiPillRow';
import { AttentionStrip } from '@/components/kpi/AttentionStrip';
import { KpiDetailsDrawer } from '@/components/kpi/KpiDetailsDrawer';
import { OperationalHealthCompositeCard } from '@/components/kpi/OperationalHealthCompositeCard';
import {
  mapTier1Cards,
  mapAttentionStripItems,
  mapTier2SalesCards,
  mapTier2OpsSlaCard,
  mapOpsSubmetrics,
  computeOpsCompositeScore,
  mapMicroPillItems,
} from '@/lib/kpi-dashboard-adapter';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiDashboardLayout } from '@/components/kpi/KpiDashboardLayout';

/** All KPI dashboard UI. In separate file so KpiDashboardPageV2.tsx can stay JSX-free (SWC parse fix). */
export function KpiDashboardPageV2Content() {
  const {
    timeframe,
    setTimeframe,
    executiveCards,
    attentionAlerts,
    salesMetrics,
    opsHealth,
    opportunitiesByStage,
  } = useKpiData();

  const [attentionDrawerOpen, setAttentionDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailDrawerTitle, setDetailDrawerTitle] = useState('');
  const [detailDrawerContent, setDetailDrawerContent] = useState<React.ReactNode>(null);
  const [salesExpanded, setSalesExpanded] = useState(false);
  const [opsExpanded, setOpsExpanded] = useState(false);
  const [inspectionExpanded, setInspectionExpanded] = useState(false);

  const tier1 = useMemo(() => mapTier1Cards(executiveCards), [executiveCards]);
  const attentionItems = useMemo(() => mapAttentionStripItems(attentionAlerts), [attentionAlerts]);
  const tier2Sales = useMemo(() => mapTier2SalesCards(salesMetrics), [salesMetrics]);
  const tier2Sla = useMemo(() => mapTier2OpsSlaCard(opsHealth), [opsHealth]);
  const opsComposite = useMemo(() => computeOpsCompositeScore(opsHealth), [opsHealth]);
  const opsSubmetrics = useMemo(() => mapOpsSubmetrics(opsHealth), [opsHealth]);
  const microPills = useMemo(
    () => mapMicroPillItems(executiveCards, salesMetrics, opsHealth),
    [executiveCards, salesMetrics, opsHealth]
  );

  const openCardDetail = (title: string, content: React.ReactNode) => {
    setDetailDrawerTitle(title);
    setDetailDrawerContent(content);
    setDetailDrawerOpen(true);
  };

  const inner = (<>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">KPI Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Executive snapshot, performance, and quick metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StrategicTimeframeToggle value={timeframe} onChange={setTimeframe} />
          <Button variant="outline" size="sm" disabled aria-label="Customize (coming soon)">
            Customize
          </Button>
        </div>
      </div>

      {/* SECTION 1 — Executive Snapshot (Tier 1) */}
      <KpiSection title="Executive Snapshot" subtitle="Key outcomes at a glance">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {tier1.map((card) => (
            <KpiCardLarge
              key={card.id}
              label={card.label}
              value={card.value}
              deltaPct={card.deltaPct}
              deltaLabel={card.deltaLabel}
              target={card.target}
              trend={card.trend}
              sparkline={card.sparkline}
              status={card.status}
              onClick={() =>
                openCardDetail(card.label, (
                  <p className="text-sm text-muted-foreground">
                    Drilldown and breakdown for {card.label} (placeholder).
                  </p>
                ))
              }
            />
          ))}
        </div>
        <div className="mt-4">
          <AttentionStrip items={attentionItems} onOpen={() => setAttentionDrawerOpen(true)} />
        </div>
      </KpiSection>

      {/* SECTION 2 — Performance (Tier 2) */}
      <KpiSection title="Performance" subtitle="Sales and operations">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tier2Sales.map((card) => (
            <KpiCardMedium
              key={card.id}
              label={card.label}
              value={card.value}
              deltaPct={card.deltaPct}
              deltaLabel={card.deltaLabel}
              target={card.target}
              trend={card.trend}
              status={card.status}
              onClick={() =>
                openCardDetail(card.label, (
                  <p className="text-sm text-muted-foreground">Sales detail for {card.label}.</p>
                ))
              }
            />
          ))}
          <OperationalHealthCompositeCard
            score={opsComposite.score}
            status={opsComposite.status === 'neutral' ? 'healthy' : opsComposite.status}
            submetrics={opsSubmetrics.map((s) => ({
              label: s.label,
              valuePct: s.valuePct,
              targetPct: s.targetPct,
              status: s.status === 'neutral' ? undefined : s.status,
            }))}
            onClick={() =>
              openCardDetail('Operational Health', (
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {opsSubmetrics.map((s) => (
                    <li key={s.label}>
                      {s.label}: {s.valuePct}%
                    </li>
                  ))}
                </ul>
              )
            }
          />
          {tier2Sla && (
            <KpiCardMedium
              label={tier2Sla.label}
              value={tier2Sla.value}
              deltaPct={tier2Sla.deltaPct}
              target={tier2Sla.target}
              trend={tier2Sla.trend}
              status={tier2Sla.status}
              onClick={() =>
                openCardDetail(tier2Sla!.label, (
                  <p className="text-sm text-muted-foreground">SLA drilldown.</p>
                ))
              }
            />
          )}
        </div>
      </KpiSection>

      {/* SECTION 3 — Quick Metrics (Tier 3) */}
      <KpiSection title="Quick Metrics" subtitle="Compact indicators">
        <KpiPillRow items={microPills} />
      </KpiSection>

      {/* SECTION 4 — Expandable Deep Dives */}
      <KpiSection title="Deep Dives" subtitle="Expand for details">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setSalesExpanded(!salesExpanded)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Sales Details
            {salesExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {salesExpanded && (
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <p className="mb-2">Opportunities by stage:</p>
              <ul className="space-y-1">
                {opportunitiesByStage.map(({ stage, count }) => (
                  <li key={stage} className="flex justify-between">
                    <span>{stage}</span>
                    <span className="font-medium tabular-nums text-foreground">{count}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="link"
                className="mt-2 h-auto p-0 text-primary"
                onClick={() => {
                  setDetailDrawerTitle('Sales Details');
                  setDetailDrawerContent(
                    <ul className="space-y-1 text-sm">
                      {opportunitiesByStage.map(({ stage, count }) => (
                        <li key={stage} className="flex justify-between">
                          <span>{stage}</span>
                          <span className="font-medium tabular-nums">{count}</span>
                        </li>
                      ))}
                    </ul>
                  );
                  setDetailDrawerOpen(true);
                }}
              >
                Open in drawer
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpsExpanded(!opsExpanded)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Operations Details
            {opsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {opsExpanded && (
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <ul className="space-y-1">
                {opsHealth.map((c) => (
                  <li key={c.id} className="flex justify-between">
                    <span>{c.label}</span>
                    <span className="font-medium tabular-nums text-foreground">{String(c.value)}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="link"
                className="mt-2 h-auto p-0 text-primary"
                onClick={() => {
                  setDetailDrawerTitle('Operations Details');
                  setDetailDrawerContent(
                    <ul className="space-y-1 text-sm">
                      {opsHealth.map((c) => (
                        <li key={c.id} className="flex justify-between">
                          <span>{c.label}</span>
                          <span className="font-medium tabular-nums">{String(c.value)}</span>
                        </li>
                      ))}
                    </ul>
                  );
                  setDetailDrawerOpen(true);
                }}
              >
                Open in drawer
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setInspectionExpanded(!inspectionExpanded)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50"
          >
            Inspection Insights
            {inspectionExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {inspectionExpanded && (
            <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <p>Inspection completion and score breakdown. Open in drawer for full view.</p>
              <Button
                variant="link"
                className="mt-2 h-auto p-0 text-primary"
                onClick={() => {
                  setDetailDrawerTitle('Inspection Insights');
                  setDetailDrawerContent(
                    <p className="text-sm">Inspection metrics and trends (placeholder).</p>
                  );
                  setDetailDrawerOpen(true);
                }}
              >
                Open in drawer
              </Button>
            </div>
          )}
        </div>
      </KpiSection>

      {/* Attention drawer */}
      <KpiDetailsDrawer
        open={attentionDrawerOpen}
        onClose={() => setAttentionDrawerOpen(false)}
        title="Attention Required"
        subtitle="Full list with filters. CTA: Open issues past SLA routes to Issues module."
      >
        <ul className="space-y-2">
          {attentionAlerts.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
            >
              <span>{a.label}</span>
              <span className="font-semibold tabular-nums">{a.count}</span>
            </li>
          ))}
        </ul>
        <Button asChild className="mt-4">
          <a href="/app/ops/issues-sla">Open issues past SLA</a>
        </Button>
      </KpiDetailsDrawer>

      {/* Generic KPI detail drawer */}
      <KpiDetailsDrawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title={detailDrawerTitle}
      >
        {detailDrawerContent}
      </KpiDetailsDrawer>
    </>
  );
  return React.createElement(KpiDashboardLayout, null, inner);
}
