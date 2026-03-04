'use client';

import { MetricCard } from './MetricCard';
import type { RiskAlert } from '@/lib/command-center-data';

type Props = { data: RiskAlert };

export function RiskAlertCard({ data }: Props) {
  const hasRisk = data.totalRisk > 0;
  const value = hasRisk
    ? `${data.totalRisk} account${data.totalRisk === 1 ? '' : 's'} need attention`
    : 'All accounts stable';

  return (
    <MetricCard
      title="Operational risk"
      value={value}
      subtitle={
        hasRisk
          ? `${data.openComplaints} open · ${data.failedInspectionsLast7} failed insp · ${data.contractsExpiring30} expiring`
          : undefined
      }
      badge={hasRisk ? { label: 'Action', variant: 'danger' } : { label: 'Stable', variant: 'success' }}
      href="/app/issues"
    />
  );
}
