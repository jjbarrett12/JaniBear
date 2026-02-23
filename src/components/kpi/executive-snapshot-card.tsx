'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { ExecutiveCardData, StrategicHealth } from '@/lib/kpi-metrics';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

function strategicBorderClass(health?: StrategicHealth): string {
  switch (health) {
    case 'green':
      return 'border-l-4 border-l-[hsl(var(--health-green))]';
    case 'amber':
      return 'border-l-4 border-l-[hsl(var(--health-amber))]';
    case 'red':
      return 'border-l-4 border-l-[hsl(var(--health-red))]';
    case 'blue':
      return 'border-l-4 border-l-blue-500';
    default:
      return 'border-l border-l-border';
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
          : 'hsl(var(--muted-foreground) / 0.6)';

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
  const hasSignal = card.health && card.health !== 'neutral';
  return (
    <Card
      className={cn(
        'kpi-card-elevated rounded-lg border shadow-none transition-colors h-[140px] flex flex-col',
        borderClass
      )}
    >
      <CardContent className="p-4 flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground truncate">
            {card.label}
          </span>
          {hasSignal && (
            <span
              className={cn(
                'h-2 w-2 rounded-full shrink-0 mt-0.5',
                card.health === 'green' && 'bg-[hsl(var(--health-green))]',
                card.health === 'amber' && 'bg-[hsl(var(--health-amber))]',
                card.health === 'red' && 'bg-[hsl(var(--health-red))]',
                card.health === 'blue' && 'bg-blue-500'
              )}
              aria-hidden
            />
          )}
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-2 flex-wrap">
          <span className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground tabular-nums">
            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
          </span>
          {card.delta != null && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium tabular-nums shrink-0',
                card.delta >= 0 ? 'text-[hsl(var(--health-green))]' : 'text-[hsl(var(--health-red))]'
              )}
            >
              {card.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {card.delta >= 0 ? '+' : ''}{card.delta.toFixed(1)}%
            </span>
          )}
        </div>
        {card.targetBenchmark && (
          <p className="text-[13px] text-muted-foreground mt-1 truncate">{card.targetBenchmark}</p>
        )}
        {card.sparkline && card.sparkline.length > 0 && (
          <div className="mt-auto flex justify-end pt-2">
            <SparklineMini data={card.sparkline} health={card.health} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
