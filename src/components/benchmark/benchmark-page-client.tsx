'use client';

import { useMemo, useState } from 'react';
import { PeerGroupSelector } from './peer-group-selector';
import { BenchmarkUpsellPanel } from './benchmark-upsell-panel';
import { BenchmarkChartCard } from './benchmark-chart-card';
import type { BenchmarkMetricKey } from './benchmark-chart-card';
import {
  BENCHMARK_PAGE_TITLE,
  BENCHMARK_PAGE_DESCRIPTION,
  YOUR_VS_PEERS_HEADING,
  YOUR_VS_PEERS_PRIVACY,
  YOUR_VS_CODE_GROUP_HEADING,
  YOUR_VS_CODE_GROUP_PRIVACY,
} from '@/lib/benchmark-copy';

export type CodeAggregate = {
  shareCode: string;
  avgCloseRate: number | null;
  avgInspectionScore: number | null;
  avgGrossMargin: number | null;
  avgCostPerSqft: number | null;
  orgCount: number;
  updatedAt: string;
};

export interface BenchmarkPageClientProps {
  orgId: string;
  optedIn: boolean;
  companySizeBucket: string | null;
  vertical: string | null;
  /** Optional share code; when set, code-group aggregate may be shown. */
  shareCode: string | null;
  /** Aggregate for org's share code (if any). */
  codeAggregate: CodeAggregate | null;
  /** True if org has either anonymous opt-in or a share code. */
  hasAnyBenchmark: boolean;
  /** Current org metrics. */
  orgMetrics: {
    closeRate: number | null;
    inspectionScore: number | null;
    grossMargin: number | null;
    costPerSqft: number | null;
  };
  /** All aggregate rows from benchmark_aggregates (anonymous peers). */
  aggregateRows: Array<{
    companySizeBucket: string;
    vertical: string;
    avgCloseRate: number | null;
    avgInspectionScore: number | null;
    avgGrossMargin: number | null;
    avgCostPerSqft: number | null;
    orgCount: number;
    updatedAt: string;
  }>;
  canManageSettings?: boolean;
}

export function BenchmarkPageClient({
  optedIn,
  companySizeBucket,
  vertical,
  shareCode,
  codeAggregate,
  hasAnyBenchmark,
  orgMetrics,
  aggregateRows,
  canManageSettings,
}: BenchmarkPageClientProps) {
  const [selectedVertical, setSelectedVertical] = useState(vertical ?? '');
  const [selectedSize, setSelectedSize] = useState(companySizeBucket ?? '');

  const { peerCount, peerMetrics } = useMemo(() => {
    const size = selectedSize || '';
    const vert = selectedVertical || '';
    const matching = aggregateRows.filter(
      (r) =>
        (!size || r.companySizeBucket === size) &&
        (!vert || r.vertical === vert)
    );
    if (matching.length === 0) {
      return { peerCount: 0, peerMetrics: null };
    }
    const count = matching.reduce((s, r) => s + r.orgCount, 0);
    const sum = (key: 'avgCloseRate' | 'avgInspectionScore' | 'avgGrossMargin' | 'avgCostPerSqft') =>
      matching.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    const n = matching.length;
    return {
      peerCount: count,
      peerMetrics: {
        closeRate: n ? sum('avgCloseRate') / n : null,
        inspectionScore: n ? sum('avgInspectionScore') / n : null,
        grossMargin: n ? sum('avgGrossMargin') / n : null,
        costPerSqft: n ? sum('avgCostPerSqft') / n : null,
      },
    };
  }, [aggregateRows, selectedSize, selectedVertical]);

  if (!hasAnyBenchmark) {
    return (
      <div className="space-y-8 pb-8">
        <header>
          <h1 className="text-2xl font-heading font-bold text-foreground sm:text-3xl">
            {BENCHMARK_PAGE_TITLE}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{BENCHMARK_PAGE_DESCRIPTION}</p>
        </header>
        <BenchmarkUpsellPanel canManageSettings={canManageSettings} />
      </div>
    );
  }

  const anonymousMetrics: { key: BenchmarkMetricKey; you: number | null; peer: number | null }[] = [
    { key: 'closeRate', you: orgMetrics.closeRate, peer: peerMetrics?.closeRate ?? null },
    { key: 'inspectionScore', you: orgMetrics.inspectionScore, peer: peerMetrics?.inspectionScore ?? null },
    { key: 'grossMargin', you: orgMetrics.grossMargin, peer: peerMetrics?.grossMargin ?? null },
    { key: 'costPerSqft', you: orgMetrics.costPerSqft, peer: peerMetrics?.costPerSqft ?? null },
  ];

  const codeMetrics: { key: BenchmarkMetricKey; you: number | null; peer: number | null }[] = codeAggregate
    ? [
        { key: 'closeRate', you: orgMetrics.closeRate, peer: codeAggregate.avgCloseRate },
        { key: 'inspectionScore', you: orgMetrics.inspectionScore, peer: codeAggregate.avgInspectionScore },
        { key: 'grossMargin', you: orgMetrics.grossMargin, peer: codeAggregate.avgGrossMargin },
        { key: 'costPerSqft', you: orgMetrics.costPerSqft, peer: codeAggregate.avgCostPerSqft },
      ]
    : [];

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-2xl font-heading font-bold text-foreground sm:text-3xl">
          {BENCHMARK_PAGE_TITLE}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{BENCHMARK_PAGE_DESCRIPTION}</p>
      </header>

      {optedIn && (
        <>
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
            <PeerGroupSelector
              vertical={selectedVertical}
              companySize={selectedSize}
              onVerticalChange={setSelectedVertical}
              onCompanySizeChange={setSelectedSize}
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-1">{YOUR_VS_PEERS_HEADING}</h2>
            <p className="text-sm text-muted-foreground mb-4">{YOUR_VS_PEERS_PRIVACY}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {anonymousMetrics.map((m) => (
                <BenchmarkChartCard
                  key={m.key}
                  metricKey={m.key}
                  yourValue={m.you}
                  peerValue={m.peer}
                  peerCount={peerCount}
                  showBar
                />
              ))}
            </div>
          </section>
        </>
      )}

      {codeAggregate && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {YOUR_VS_CODE_GROUP_HEADING} (code: {codeAggregate.shareCode})
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{YOUR_VS_CODE_GROUP_PRIVACY}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {codeMetrics.map((m) => (
              <BenchmarkChartCard
                key={m.key}
                metricKey={m.key}
                yourValue={m.you}
                peerValue={m.peer}
                peerCount={codeAggregate.orgCount}
                showBar
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
