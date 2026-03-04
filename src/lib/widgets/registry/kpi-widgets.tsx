'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ExecutiveSnapshotCard } from '@/components/kpi/executive-snapshot-card';
import { AttentionRequiredStrip } from '@/components/kpi/attention-required-strip';
import { KpiMetricTile } from '@/components/kpi/kpi-metric-tile';
import { OpsHealthCardTile } from '@/components/kpi/ops-health-card';
import { CrewMetricCardTile } from '@/components/kpi/crew-metric-card';
import { useKpiData } from '@/contexts/kpi-data-context';
import type { WidgetDefinition } from '../types';
import { BarChart3, AlertTriangle, TrendingUp, ListOrdered, Heart, Users } from 'lucide-react';

function ExecutiveSnapshotWidget({ orgId: _orgId }: { orgId: string }) {
  const { executiveCards } = useKpiData();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {executiveCards.map((card) => (
        <ExecutiveSnapshotCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function AttentionRequiredWidget({ orgId: _orgId }: { orgId: string }) {
  const { attentionAlerts } = useKpiData();
  if (attentionAlerts.length === 0) return <p className="text-sm text-muted-foreground/80">No items requiring attention.</p>;
  return <AttentionRequiredStrip alerts={attentionAlerts} />;
}

function SalesEngineWidget({ orgId: _orgId }: { orgId: string }) {
  const { salesMetrics } = useKpiData();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {salesMetrics.map((tile) => (
        <KpiMetricTile key={tile.label} tile={tile} />
      ))}
    </div>
  );
}

function OpportunitiesByStageWidget({ orgId: _orgId }: { orgId: string }) {
  const { opportunitiesByStage } = useKpiData();
  return (
    <Card className="kpi-card-elevated rounded-lg border shadow-none">
      <CardContent className="p-4">
        <ul className="space-y-3 text-sm">
          {opportunitiesByStage.map(({ stage, count }) => (
            <li key={stage} className="flex justify-between gap-4">
              <span className="text-muted-foreground truncate capitalize">{stage.replace(/_/g, ' ')}</span>
              <span className="font-semibold tabular-nums shrink-0 text-foreground">{count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function OpsHealthWidget({ orgId: _orgId }: { orgId: string }) {
  const { opsHealth } = useKpiData();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {opsHealth.map((card) => (
        <OpsHealthCardTile key={card.id} card={card} />
      ))}
    </div>
  );
}

function CrewPerformanceWidget({ orgId: _orgId }: { orgId: string }) {
  const { crewMetrics } = useKpiData();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {crewMetrics.map((card) => (
        <CrewMetricCardTile key={card.id} card={card} />
      ))}
    </div>
  );
}

export const kpiWidgetRegistry: WidgetDefinition[] = [
  { id: 'kpi_executive', title: 'Executive Snapshot', description: 'Key metrics', icon: <BarChart3 className="h-4 w-4" />, component: ExecutiveSnapshotWidget, default: { lg: { x: 0, y: 0, w: 2, h: 1 }, md: { x: 0, y: 0, w: 2, h: 1 }, sm: { x: 0, y: 0, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'kpi_attention', title: 'Attention Required', description: 'Alerts', icon: <AlertTriangle className="h-4 w-4" />, component: AttentionRequiredWidget, default: { lg: { x: 2, y: 0, w: 2, h: 1 }, md: { x: 0, y: 1, w: 2, h: 1 }, sm: { x: 0, y: 1, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'kpi_sales_engine', title: 'Sales Engine', description: 'Sales metrics', icon: <TrendingUp className="h-4 w-4" />, component: SalesEngineWidget, default: { lg: { x: 0, y: 1, w: 2, h: 1 }, md: { x: 0, y: 2, w: 2, h: 1 }, sm: { x: 0, y: 2, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'kpi_opportunities', title: 'Opportunities by Stage', description: 'Pipeline stages', icon: <ListOrdered className="h-4 w-4" />, component: OpportunitiesByStageWidget, default: { lg: { x: 2, y: 1, w: 1, h: 1 }, md: { x: 0, y: 3, w: 1, h: 1 }, sm: { x: 0, y: 3, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'kpi_ops_health', title: 'Operational Health', description: 'Ops health tiles', icon: <Heart className="h-4 w-4" />, component: OpsHealthWidget, default: { lg: { x: 3, y: 1, w: 1, h: 1 }, md: { x: 1, y: 3, w: 1, h: 1 }, sm: { x: 0, y: 4, w: 1, h: 1 } }, minW: 1, minH: 1 },
  { id: 'kpi_crew', title: 'Crew Performance', description: 'Crew metrics', icon: <Users className="h-4 w-4" />, component: CrewPerformanceWidget, default: { lg: { x: 0, y: 2, w: 2, h: 1 }, md: { x: 0, y: 4, w: 2, h: 1 }, sm: { x: 0, y: 5, w: 1, h: 1 } }, minW: 1, minH: 1 },
];
