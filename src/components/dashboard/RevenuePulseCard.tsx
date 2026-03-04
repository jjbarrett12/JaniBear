'use client';

import { MetricCard } from './MetricCard';
import type { RevenuePulse } from '@/lib/command-center-data';

type Props = { data: RevenuePulse };

export function RevenuePulseCard({ data }: Props) {
  const pacing = data.monthPacingPct;
  const badge =
    pacing != null
      ? pacing >= 100
        ? { label: `On track ${pacing}%`, variant: 'success' as const }
        : pacing >= 90
          ? { label: `${pacing}% pace`, variant: 'warning' as const }
          : { label: `${pacing}% pace`, variant: 'danger' as const }
      : undefined;

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
  const subtitle = `WTD ${fmt(data.wtdTotal)} · Target ${fmt(data.monthlyTarget)}`;

  return (
    <MetricCard
      title="Revenue pulse"
      value={fmt(data.todayTotal)}
      subtitle={subtitle}
      badge={badge}
      href="/app/admin/invoices"
    />
  );
}
