'use client';

import type { StrategicTimeframe } from '@/lib/kpi-metrics';
import { Button } from '@/components/ui/button';

interface StrategicTimeframeToggleProps {
  value: StrategicTimeframe;
  onChange: (v: StrategicTimeframe) => void;
}

const OPTIONS: { value: StrategicTimeframe; label: string }[] = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'ytd', label: 'YTD' },
];

export function StrategicTimeframeToggle({ value, onChange }: StrategicTimeframeToggleProps) {
  return (
    <div className="flex gap-0 rounded-md border border-border/80 bg-transparent p-0.5">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 rounded px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
