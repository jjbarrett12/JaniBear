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
    <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? 'secondary' : 'ghost'}
          size="sm"
          className="rounded-md font-medium"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
