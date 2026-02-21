'use client';

import type { AttentionAlert } from '@/lib/kpi-metrics';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export function AttentionRequiredStrip({ alerts }: { alerts: AttentionAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3">
      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Attention Required
      </h3>
      <div className="flex flex-wrap gap-2">
        {alerts.map((alert) => {
          const Wrapper = alert.href ? Link : 'div';
          const wrapperProps = alert.href ? { href: alert.href } : {};
          const isCritical = alert.severity === 'critical';
          return (
            <Wrapper
              key={alert.id}
              {...wrapperProps}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                isCritical
                  ? 'border-red-500/60 bg-red-500/10 text-red-800 dark:text-red-200 hover:bg-red-500/15'
                  : 'border-amber-500/60 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/15'
              } ${alert.href ? 'cursor-pointer' : ''}`}
            >
              <span className="font-medium">{alert.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isCritical ? 'bg-red-500/20' : 'bg-amber-500/20'
                }`}
              >
                {alert.count}
              </span>
            </Wrapper>
          );
        })}
      </div>
    </div>
  );
}
