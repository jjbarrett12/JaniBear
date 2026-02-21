'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { OpsHealthCard } from '@/lib/kpi-strategic-data';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';

function borderClass(health: OpsHealthCard['health']): string {
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

function SparklineMini({ data, health }: { data: number[]; health: OpsHealthCard['health'] }) {
  const path = useMemo(() => {
    if (!data || data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 60;
    const h = 20;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 2) - 1;
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
    <svg width={64} height={24} className="overflow-visible" aria-hidden>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OpsHealthCardTile({ card }: { card: OpsHealthCard }) {
  const border = borderClass(card.health);
  return (
    <Card className={`border-l-4 ${border} transition-shadow hover:shadow-md`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">
            {card.label}
          </span>
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
        </div>
        <div className="flex items-baseline gap-2 mt-1 flex-wrap">
          <span className="font-heading text-lg font-bold text-foreground tabular-nums">
            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
          </span>
          {card.delta != null && (
            <span
              className={`flex items-center gap-0.5 text-xs font-medium ${
                card.delta >= 0 ? 'text-health-green' : 'text-health-red'
              }`}
            >
              {card.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(card.delta).toFixed(1)}%
            </span>
          )}
        </div>
        {card.target && (
          <p className="text-xs text-muted-foreground mt-0.5">Target: {card.target}</p>
        )}
        {card.sparkline && card.sparkline.length > 0 && (
          <div className="mt-1.5 flex justify-end">
            <SparklineMini data={card.sparkline} health={card.health} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
