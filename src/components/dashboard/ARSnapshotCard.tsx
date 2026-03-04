'use client';

import { MetricCard } from './MetricCard';
import type { ARSnapshot } from '@/lib/command-center-data';

type Props = { data: ARSnapshot };

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

export function ARSnapshotCard({ data }: Props) {
  const value = fmt(data.totalOutstanding);
  const parts = [
    data.overdue30 > 0 && `30+ ${fmt(data.overdue30)}`,
    data.overdue60 > 0 && `60+ ${fmt(data.overdue60)}`,
    data.overdue90 > 0 && `90+ ${fmt(data.overdue90)}`,
  ].filter(Boolean);
  const subtitle = parts.length ? parts.join(' · ') : undefined;

  return (
    <MetricCard
      title="AR snapshot"
      value={value}
      subtitle={subtitle}
      href="/app/admin/invoices"
    />
  );
}
