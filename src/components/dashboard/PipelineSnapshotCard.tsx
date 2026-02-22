'use client';

import { MetricCard } from './MetricCard';
import type { PipelineSnapshot } from '@/lib/command-center-data';

type Props = { data: PipelineSnapshot };

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function PipelineSnapshotCard({ data }: Props) {
  const value = fmt(data.pipelineValue);
  const parts = [
    `${data.openBids} open bids`,
    data.followUpsDueToday > 0 && `${data.followUpsDueToday} follow-ups today`,
    data.winRate30Pct != null && `${data.winRate30Pct}% win rate`,
  ].filter(Boolean);
  const subtitle = parts.length ? parts.join(' · ') : undefined;

  return (
    <MetricCard
      title="Pipeline snapshot"
      value={value}
      subtitle={subtitle}
      href="/app/bids"
    />
  );
}
