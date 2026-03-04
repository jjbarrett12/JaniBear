'use client';

import { MetricCard } from './MetricCard';
import type { AIInsight } from '@/lib/command-center-data';

type Props = { data: AIInsight };

export function AIInsightCard({ data }: Props) {
  const hasAlerts = data.hasAlerts;
  const value = hasAlerts
    ? `${data.sitesOverLaborBudget.length + data.staffingAlerts.length + data.riskPatterns.length} alert${data.sitesOverLaborBudget.length + data.staffingAlerts.length + data.riskPatterns.length === 1 ? '' : 's'}`
    : 'No performance alerts';

  const lines = [
    ...data.sitesOverLaborBudget.slice(0, 1),
    ...data.staffingAlerts.slice(0, 1),
    ...data.riskPatterns.slice(0, 1),
  ].filter(Boolean);
  const subtitle = hasAlerts ? lines[0] : 'AI monitoring active.';

  return (
    <MetricCard
      title="AI performance"
      value={value}
      subtitle={subtitle}
      badge={hasAlerts ? { label: 'Review', variant: 'warning' } : { label: 'Active', variant: 'success' }}
      href="/app/admin/ai-settings"
    />
  );
}
