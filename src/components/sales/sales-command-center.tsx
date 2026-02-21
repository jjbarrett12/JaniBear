'use client';

import { SalesRevenueKpis } from '@/components/sales/sales-revenue-kpis';
import { PipelineHealthBoard } from '@/components/sales/pipeline-health-board';
import { SalesActionQueue } from '@/components/sales/sales-action-queue';
import { RevenueLeakagePanel } from '@/components/sales/revenue-leakage-panel';
import { SalesTerritoryMap } from '@/components/sales/sales-territory-map';
import { RepPerformanceTable } from '@/components/sales/rep-performance-table';
import type {
  RepSalesMetrics,
  RepPipelineByStage,
  LeaderboardRow,
  StalledDeal,
  PipelineStageHealth,
  SalesActionItem,
  RevenueLeakageSignal,
} from '@/types/sales';

export type CommandCenterData = {
  metrics: RepSalesMetrics | null;
  pipelineByStage: RepPipelineByStage[];
  pipelineHealth: PipelineStageHealth[];
  leaderboard: LeaderboardRow[];
  stalledDeals: StalledDeal[];
  myRank: LeaderboardRow | null;
  totalReps: number;
  actionQueue: SalesActionItem[];
  leakageSignals: RevenueLeakageSignal[];
  openPipelineValue: number;
  dealsStalled14d: number;
};

export function SalesCommandCenter({
  orgId,
  repId,
  data,
  isAdmin,
  repName,
}: {
  orgId: string;
  repId: string;
  data: CommandCenterData;
  isAdmin: boolean;
  repName?: string;
}) {
  const {
    metrics,
    pipelineHealth,
    leaderboard,
    actionQueue,
    leakageSignals,
    openPipelineValue,
    dealsStalled14d,
  } = data;

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-heading font-bold text-foreground sm:text-3xl">
          Sales Command Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {repName ? `${repName} · ` : ''}What needs attention today. Deals at risk, follow-ups, revenue focus.
        </p>
      </header>

      {/* TOP: Revenue Snapshot + Urgency */}
      <SalesRevenueKpis
        metrics={metrics}
        openPipelineValue={openPipelineValue}
        dealsStalled14d={dealsStalled14d}
      />

      {/* MIDDLE: Left = Pipeline Health, Right = Action Queue */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <PipelineHealthBoard stages={pipelineHealth} />
        <SalesActionQueue items={actionQueue} sortable />
      </div>

      {/* BOTTOM ROW 1: Leakage + Territory Map */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueLeakagePanel signals={leakageSignals} />
        <SalesTerritoryMap />
      </div>

      {/* BOTTOM ROW 2: Rep Performance (full width) */}
      <RepPerformanceTable leaderboard={leaderboard} repId={repId} myMetrics={metrics} />
    </div>
  );
}
