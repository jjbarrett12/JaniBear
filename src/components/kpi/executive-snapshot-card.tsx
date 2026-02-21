'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { ExecutiveCardData, StrategicHealth } from '@/lib/kpi-metrics';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';

function strategicBorderClass(health?: StrategicHealth): string {
  switch (health) {
    case 'green':
      return 'border-health-green';
    case 'amber':
      return 'border-health-amber';
    case 'red':
      return 'border-health-red';
    case 'blue':
      return 'border-blue-500';
    default:
      return 'border-border';
  }
}

function SparklineMini({ data, health }: { data: number[]; health?: StrategicHealth }) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80;
    const h = 28;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [data]);

  const stroke =
    health === 'green'
      ? 'hsl(var(--health-green))'
      : health === 'amber'
        ? 'hsl(var(--health-amber))'
        : health === 'red'
          ? 'hsl(var(--health-red))'
          : health === 'blue'
            ? 'rgb(59 130 246)'
            : 'hsl(var(--muted-foreground))';

  return (
    <svg width={84} height={32} className="overflow-visible" aria-hidden>
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExecutiveSnapshotCard({ card }: { card: ExecutiveCardData }) {
  const borderClass = strategicBorderClass(card.health);
  return (
    <Card className={`border-l-4 ${borderClass} transition-shadow hover:shadow-md min-h-[140px]`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
            {card.label}
          </span>
          {card.health && card.health !== 'neutral' && (
            <span
              className={`h-2 w-2 rounded-full shrink-0 mt-0.5 ${
                card.health === 'green'
                  ? 'bg-health-green'
                  : card.health === 'amber'
                    ? 'bg-health-amber'
                    : card.health === 'red'
                      ? 'bg-health-red'
                      : card.health === 'blue'
                        ? 'bg-blue-500'
                        : 'bg-muted-foreground'
              }`}
              aria-hidden
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-2xl font-bold text-foreground tabular-nums">
            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
          </span>
          {card.delta != null && (
            <span
              className={`flex items-center gap-0.5 text-sm font-medium ${
                card.delta >= 0 ? 'text-health-green' : 'text-health-red'
              }`}
            >
              {card.delta >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(card.delta).toFixed(1)}%
              {card.deltaLabel && (
                <span className="text-muted-foreground font-normal text-xs">({card.deltaLabel})</span>
              )}
            </span>
          )}
        </div>
        {card.targetBenchmark && (
          <p className="text-xs text-muted-foreground mt-1">{card.targetBenchmark}</p>
        )}
        {card.sparkline && card.sparkline.length > 0 && (
          <div className="mt-3 flex justify-end">
            <SparklineMini data={card.sparkline} health={card.health} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
