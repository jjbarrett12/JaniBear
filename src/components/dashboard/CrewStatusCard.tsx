'use client';

import { MetricCard } from './MetricCard';
import type { CrewStatus } from '@/lib/command-center-data';

type Props = { data: CrewStatus };

export function CrewStatusCard({ data }: Props) {
  const hasCallOffs = data.callOffsToday > 0;
  const hasLate = data.lateStarts > 0;
  const badge = hasCallOffs
    ? { label: `${data.callOffsToday} call-off${data.callOffsToday === 1 ? '' : 's'}`, variant: 'danger' as const }
    : hasLate
      ? { label: `${data.lateStarts} late`, variant: 'warning' as const }
      : undefined;

  const value = `${data.crewsClockedIn}/${data.totalCrews} crews`;
  const subtitle = data.jobsNotStarted > 0 ? `${data.jobsNotStarted} jobs not started` : undefined;

  return (
    <MetricCard
      title="Crew status"
      value={value}
      subtitle={subtitle}
      badge={badge}
      href="/app/crews"
    />
  );
}
