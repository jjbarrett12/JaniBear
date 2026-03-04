'use client';

import type { AttentionAlert } from '@/lib/kpi-metrics';
import Link from 'next/link';

export function AttentionRequiredStrip({ alerts }: { alerts: AttentionAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="kpi-card-elevated rounded-lg border shadow-none p-4">
      <div className="flex flex-wrap gap-3">
        {alerts.map((alert) => {
          const Wrapper = alert.href ? Link : 'div';
          const wrapperProps = alert.href ? { href: alert.href } : {};
          const isCritical = alert.severity === 'critical';
          return (
            <Wrapper
              key={alert.id}
              {...wrapperProps}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isCritical
                  ? 'border-[hsl(var(--health-red))]/50 bg-[hsl(var(--health-red))]/10 text-[hsl(var(--health-red))] hover:bg-[hsl(var(--health-red))]/15'
                  : 'border-[hsl(var(--health-amber))]/50 bg-[hsl(var(--health-amber))]/10 text-[hsl(var(--health-amber))] hover:bg-[hsl(var(--health-amber))]/15'
              } ${alert.href ? 'cursor-pointer' : ''}`}
            >
              <span className="font-medium">{alert.label}</span>
              <span className="tabular-nums font-semibold opacity-90">{alert.count}</span>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
