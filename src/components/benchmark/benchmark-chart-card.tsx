'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  METRIC_CLOSE_RATE,
  METRIC_INSPECTION_SCORE,
  METRIC_GROSS_MARGIN,
  METRIC_COST_PER_SQFT,
  YOUR_COMPANY_LABEL,
  PEER_AVG_LABEL,
  NO_DATA_YOU,
  NO_DATA_PEERS,
} from '@/lib/benchmark-copy';
import { cn } from '@/lib/utils';

export type BenchmarkMetricKey = 'closeRate' | 'inspectionScore' | 'grossMargin' | 'costPerSqft';

const METRIC_LABELS: Record<BenchmarkMetricKey, string> = {
  closeRate: METRIC_CLOSE_RATE,
  inspectionScore: METRIC_INSPECTION_SCORE,
  grossMargin: METRIC_GROSS_MARGIN,
  costPerSqft: METRIC_COST_PER_SQFT,
};

function formatValue(key: BenchmarkMetricKey, value: number | null): string {
  if (value == null) return '—';
  if (key === 'closeRate' || key === 'grossMargin') return `${(value * 100).toFixed(1)}%`;
  if (key === 'inspectionScore') return value.toFixed(1);
  if (key === 'costPerSqft') return `$${value.toFixed(2)}`;
  return String(value);
}

export interface BenchmarkChartCardProps {
  metricKey: BenchmarkMetricKey;
  yourValue: number | null;
  peerValue: number | null;
  peerCount?: number;
  /** Optional: show a small bar or visual comparison. */
  showBar?: boolean;
  className?: string;
}

export function BenchmarkChartCard({
  metricKey,
  yourValue,
  peerValue,
  peerCount,
  showBar = true,
  className,
}: BenchmarkChartCardProps) {
  const label = METRIC_LABELS[metricKey];
  const youFormatted = formatValue(metricKey, yourValue);
  const peerFormatted = formatValue(metricKey, peerValue);
  const hasYou = yourValue != null;
  const hasPeer = peerValue != null;
  const maxVal =
    metricKey === 'closeRate' || metricKey === 'grossMargin'
      ? 1
      : metricKey === 'inspectionScore'
        ? 100
        : Math.max(yourValue ?? 0, peerValue ?? 0) * 1.2 || 1;
  const youPct = hasYou && maxVal ? Math.min(100, (yourValue! / maxVal) * 100) : 0;
  const peerPct = hasPeer && maxVal ? Math.min(100, (peerValue! / maxVal) * 100) : 0;

  return (
    <Card className={cn('rounded-2xl border border-border bg-card', className)}>
      <CardHeader className="pb-2">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        {peerCount != null && peerCount > 0 && (
          <p className="text-xs text-muted-foreground">Based on {peerCount} peer orgs</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-baseline gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {YOUR_COMPANY_LABEL}
            </p>
            <p className="font-heading text-xl font-bold tabular-nums text-foreground">
              {hasYou ? youFormatted : NO_DATA_YOU}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {PEER_AVG_LABEL}
            </p>
            <p className="font-heading text-xl font-bold tabular-nums text-muted-foreground">
              {hasPeer ? peerFormatted : NO_DATA_PEERS}
            </p>
          </div>
        </div>
        {showBar && (hasYou || hasPeer) && maxVal > 0 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>You</span>
                <span className="tabular-nums">{hasYou ? formatValue(metricKey, yourValue) : '—'}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${youPct}%` }}
                  title={YOUR_COMPANY_LABEL}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Peer avg</span>
                <span className="tabular-nums">{hasPeer ? formatValue(metricKey, peerValue) : '—'}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-muted-foreground/40 transition-all"
                  style={{ width: `${peerPct}%` }}
                  title={PEER_AVG_LABEL}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
