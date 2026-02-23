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

/** KPI body UI. No JSX in this file so Vercel SWC does not hit parse error. */
export function KpiDashboardBodyContent() {
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

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4' },
      React.createElement(
        'div',
        null,
        React.createElement('h1', { className: 'text-2xl font-heading font-bold text-foreground' }, 'KPI Dashboard'),
        React.createElement('p', { className: 'text-sm text-muted-foreground mt-1' }, 'Executive snapshot, performance, and quick metrics.')
      ),
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        React.createElement(StrategicTimeframeToggle, { value: timeframe, onChange: setTimeframe }),
        React.createElement(Button, { variant: 'outline', size: 'sm', disabled: true, 'aria-label': 'Customize (coming soon)' }, 'Customize')
      )
    ),
    React.createElement(
      KpiSection,
      { title: 'Executive Snapshot', subtitle: 'Key outcomes at a glance' },
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
        tier1.map((card) =>
          React.createElement(KpiCardLarge, {
            key: card.id,
            label: card.label,
            value: card.value,
            deltaPct: card.deltaPct,
            deltaLabel: card.deltaLabel,
            target: card.target,
            trend: card.trend,
            sparkline: card.sparkline,
            status: card.status,
            onClick: () =>
              openCardDetail(
                card.label,
                React.createElement('p', { className: 'text-sm text-muted-foreground' }, 'Drilldown and breakdown for ', card.label, ' (placeholder).')
              ),
          })
        )
      ),
      React.createElement(
        'div',
        { className: 'mt-4' },
        React.createElement(AttentionStrip, { items: attentionItems, onOpen: () => setAttentionDrawerOpen(true) })
      )
    ),
    React.createElement(
      KpiSection,
      { title: 'Performance', subtitle: 'Sales and operations' },
      React.createElement(
        'div',
        { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
        tier2Sales.map((card) =>
          React.createElement(KpiCardMedium, {
            key: card.id,
            label: card.label,
            value: card.value,
            deltaPct: card.deltaPct,
            deltaLabel: card.deltaLabel,
            target: card.target,
            trend: card.trend,
            status: card.status,
            onClick: () =>
              openCardDetail(card.label, React.createElement('p', { className: 'text-sm text-muted-foreground' }, 'Sales detail for ', card.label, '.')),
          })
        ),
        React.createElement(OperationalHealthCompositeCard, {
          score: opsComposite.score,
          status: opsComposite.status === 'neutral' ? 'healthy' : opsComposite.status,
          submetrics: opsSubmetrics.map((s) => ({
            label: s.label,
            valuePct: s.valuePct,
            targetPct: s.targetPct,
            status: s.status === 'neutral' ? undefined : s.status,
          })),
          onClick: () =>
            openCardDetail(
              'Operational Health',
              React.createElement(
                'ul',
                { className: 'text-sm space-y-1 text-muted-foreground' },
                opsSubmetrics.map((s) => React.createElement('li', { key: s.label }, s.label, ': ', s.valuePct, '%'))
              )
            ),
        }),
        tier2Sla &&
          React.createElement(KpiCardMedium, {
            label: tier2Sla.label,
            value: tier2Sla.value,
            deltaPct: tier2Sla.deltaPct,
            target: tier2Sla.target,
            trend: tier2Sla.trend,
            status: tier2Sla.status,
            onClick: () =>
              openCardDetail(tier2Sla!.label, React.createElement('p', { className: 'text-sm text-muted-foreground' }, 'SLA drilldown.')),
          })
      )
    ),
    React.createElement(KpiSection, { title: 'Quick Metrics', subtitle: 'Compact indicators' }, React.createElement(KpiPillRow, { items: microPills })),
    React.createElement(
      KpiSection,
      { title: 'Deep Dives', subtitle: 'Expand for details' },
      React.createElement(
        'div',
        { className: 'space-y-2' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setSalesExpanded(!salesExpanded),
            className: 'flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50',
          },
          'Sales Details ',
          salesExpanded ? React.createElement(ChevronDown, { className: 'h-4 w-4' }) : React.createElement(ChevronRight, { className: 'h-4 w-4' })
        ),
        salesExpanded &&
          React.createElement(
            'div',
            { className: 'rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground' },
            React.createElement('p', { className: 'mb-2' }, 'Opportunities by stage:'),
            React.createElement(
              'ul',
              { className: 'space-y-1' },
              opportunitiesByStage.map(({ stage, count }) =>
                React.createElement('li', { key: stage, className: 'flex justify-between' }, React.createElement('span', null, stage), React.createElement('span', { className: 'font-medium tabular-nums text-foreground' }, count))
              )
            ),
            React.createElement(Button, {
              variant: 'link',
              className: 'mt-2 h-auto p-0 text-primary',
              onClick: () => {
                setDetailDrawerTitle('Sales Details');
                setDetailDrawerContent(
                  React.createElement(
                    'ul',
                    { className: 'space-y-1 text-sm' },
                    opportunitiesByStage.map(({ stage, count }) =>
                      React.createElement('li', { key: stage, className: 'flex justify-between' }, React.createElement('span', null, stage), React.createElement('span', { className: 'font-medium tabular-nums' }, count))
                    )
                  )
                );
                setDetailDrawerOpen(true);
              },
            }, 'Open in drawer')
          ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setOpsExpanded(!opsExpanded),
            className: 'flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50',
          },
          'Operations Details ',
          opsExpanded ? React.createElement(ChevronDown, { className: 'h-4 w-4' }) : React.createElement(ChevronRight, { className: 'h-4 w-4' })
        ),
        opsExpanded &&
          React.createElement(
            'div',
            { className: 'rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground' },
            React.createElement(
              'ul',
              { className: 'space-y-1' },
              opsHealth.map((c) =>
                React.createElement('li', { key: c.id, className: 'flex justify-between' }, React.createElement('span', null, c.label), React.createElement('span', { className: 'font-medium tabular-nums text-foreground' }, String(c.value)))
              )
            ),
            React.createElement(Button, {
              variant: 'link',
              className: 'mt-2 h-auto p-0 text-primary',
              onClick: () => {
                setDetailDrawerTitle('Operations Details');
                setDetailDrawerContent(
                  React.createElement(
                    'ul',
                    { className: 'space-y-1 text-sm' },
                    opsHealth.map((c) =>
                      React.createElement('li', { key: c.id, className: 'flex justify-between' }, React.createElement('span', null, c.label), React.createElement('span', { className: 'font-medium tabular-nums' }, String(c.value)))
                    )
                  )
                );
                setDetailDrawerOpen(true);
              },
            }, 'Open in drawer')
          ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => setInspectionExpanded(!inspectionExpanded),
            className: 'flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-muted/50',
          },
          'Inspection Insights ',
          inspectionExpanded ? React.createElement(ChevronDown, { className: 'h-4 w-4' }) : React.createElement(ChevronRight, { className: 'h-4 w-4' })
        ),
        inspectionExpanded &&
          React.createElement(
            'div',
            { className: 'rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground' },
            React.createElement('p', null, 'Inspection completion and score breakdown. Open in drawer for full view.'),
            React.createElement(Button, {
              variant: 'link',
              className: 'mt-2 h-auto p-0 text-primary',
              onClick: () => {
                setDetailDrawerTitle('Inspection Insights');
                setDetailDrawerContent(React.createElement('p', { className: 'text-sm' }, 'Inspection metrics and trends (placeholder).'));
                setDetailDrawerOpen(true);
              },
            }, 'Open in drawer')
          )
      )
    ),
    React.createElement(
      KpiDetailsDrawer,
      {
        open: attentionDrawerOpen,
        onClose: () => setAttentionDrawerOpen(false),
        title: 'Attention Required',
        subtitle: 'Full list with filters. CTA: Open issues past SLA routes to Issues module.',
      },
      React.createElement(
        'ul',
        { className: 'space-y-2' },
        attentionAlerts.map((a) =>
          React.createElement(
            'li',
            { key: a.id, className: 'flex items-center justify-between rounded border border-border px-3 py-2 text-sm' },
            React.createElement('span', null, a.label),
            React.createElement('span', { className: 'font-semibold tabular-nums' }, a.count)
          )
        )
      ),
      React.createElement(Button, { asChild: true, className: 'mt-4' }, React.createElement('a', { href: '/app/ops/issues-sla' }, 'Open issues past SLA'))
    ),
    React.createElement(KpiDetailsDrawer, { open: detailDrawerOpen, onClose: () => setDetailDrawerOpen(false), title: detailDrawerTitle }, detailDrawerContent)
  );
}
