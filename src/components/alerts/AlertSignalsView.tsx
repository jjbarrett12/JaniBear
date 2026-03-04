'use client';

import type { AlertSignal } from '@/actions/alerts';

export function AlertSignalsView({ signals }: { signals: AlertSignal[] }) {
  if (!signals?.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">What changed?</h4>
      <ul className="space-y-1.5 text-sm">
        {signals.map((s, i) => (
          <li key={i} className="flex flex-wrap items-baseline gap-2">
            <span className="font-medium text-foreground">{s.label}:</span>
            <span className="text-muted-foreground">{s.value}</span>
            {s.detail && <span className="text-xs text-muted-foreground">— {s.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
