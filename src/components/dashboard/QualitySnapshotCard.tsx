'use client';

import { MetricCard } from './MetricCard';
import type { QualitySnapshot } from '@/lib/command-center-data';

type Props = { data: QualitySnapshot };

export function QualitySnapshotCard({ data }: Props) {
  const avg = data.avgScore ?? 0;
  const badge =
    avg > 0
      ? avg < 75
        ? { label: `${avg}% avg`, variant: 'danger' as const }
        : avg < 85
          ? { label: `${avg}% avg`, variant: 'warning' as const }
          : undefined
      : undefined;

  const subtitle = [
    data.avgScore != null ? `Avg ${data.avgScore}%` : null,
    data.locationsUnder85 > 0 ? `${data.locationsUnder85} under 85%` : null,
  ]
    .filter(Boolean)
    .join(' · ') || undefined;

  return (
    <MetricCard
      title="Quality snapshot"
      value={String(data.inspectionsYesterday)}
      subtitle={subtitle}
      badge={badge}
      href="/app/inspections"
    />
  );
}
