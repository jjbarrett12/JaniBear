'use client';

import { MetricCard } from './MetricCard';
import type { AccountHealth } from '@/lib/command-center-data';

type Props = { data: AccountHealth };

export function AccountHealthCard({ data }: Props) {
  const value = `${data.pctAbove80}% above 80`;
  const subtitle = [
    data.countBelow60 > 0 && `${data.countBelow60} below 60`,
    data.visitsDueToday > 0 && `${data.visitsDueToday} visits due today`,
  ]
    .filter(Boolean)
    .join(' · ') || undefined;

  return (
    <MetricCard
      title="Account health"
      value={value}
      subtitle={subtitle}
      href="/app/accounts"
    >
      <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <span
          className="bg-emerald-500"
          style={{ width: `${data.greenPct}%` }}
        />
        <span
          className="bg-amber-500"
          style={{ width: `${data.yellowPct}%` }}
        />
        <span
          className="bg-red-500"
          style={{ width: `${data.redPct}%` }}
        />
      </div>
    </MetricCard>
  );
}
