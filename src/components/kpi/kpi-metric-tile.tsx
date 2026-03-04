'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { KpiTileData } from '@/lib/kpi-metrics';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

function leftBorderClass(health?: KpiTileData['health']): string {
  if (!health || health === 'neutral') return 'border-l border-l-border';
  if (health === 'green') return 'border-l-4 border-l-[hsl(var(--health-green))]';
  if (health === 'amber') return 'border-l-4 border-l-[hsl(var(--health-amber))]';
  if (health === 'red') return 'border-l-4 border-l-[hsl(var(--health-red))]';
  return 'border-l border-l-border';
}

function Sparkline({ data, health }: { data: number[]; health?: KpiTileData['health'] }) {
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
          : 'hsl(var(--muted-foreground) / 0.6)';

  return (
    <svg width={64} height={24} className="overflow-visible" aria-hidden>
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function KpiMetricTile({ tile }: { tile: KpiTileData }) {
  const isSignal = tile.health && tile.health !== 'neutral';
  return (
    <Card className={cn('kpi-card-elevated rounded-lg border shadow-none transition-colors', leftBorderClass(tile.health))}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground truncate">
            {tile.label}
          </span>
          {isSignal && (
            <span
              className={cn(
                'h-2 w-2 rounded-full shrink-0 mt-0.5',
                tile.health === 'green' && 'bg-[hsl(var(--health-green))]',
                tile.health === 'amber' && 'bg-[hsl(var(--health-amber))]',
                tile.health === 'red' && 'bg-[hsl(var(--health-red))]'
              )}
              aria-hidden
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {typeof tile.value === 'number' ? tile.value.toLocaleString() : tile.value}
          </span>
          {tile.delta != null && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium tabular-nums',
                tile.delta >= 0 ? 'text-[hsl(var(--health-green))]' : 'text-[hsl(var(--health-red))]'
              )}
            >
              {tile.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {tile.delta >= 0 ? '+' : ''}{tile.delta.toFixed(1)}%
            </span>
          )}
          {tile.rank != null && tile.rankOutOf != null && (
            <span className="text-xs text-muted-foreground/80">#{tile.rank} of {tile.rankOutOf}</span>
          )}
        </div>
        {tile.targetBenchmark && (
          <p className="text-xs text-muted-foreground/80 mt-1 truncate">{tile.targetBenchmark}</p>
        )}
        {tile.sparkline && tile.sparkline.length > 0 && (
          <div className="mt-2 flex justify-end">
            <Sparkline data={tile.sparkline} health={tile.health} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
