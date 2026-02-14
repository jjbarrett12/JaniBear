'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { KpiTileData } from '@/lib/financial-health-mock';
import { healthBorderClass } from '@/lib/financial-health';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMemo } from 'react';

interface HealthKpiStripProps {
  tiles: KpiTileData[];
  onTileClick?: (label: string) => void;
}

function Sparkline({ data, health }: { data: number[]; health: KpiTileData['health'] }) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
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
          : 'hsl(var(--muted-foreground))';

  return (
    <svg width={64} height={24} className="overflow-visible" aria-hidden>
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

export function HealthKpiStrip({ tiles, onTileClick }: HealthKpiStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {tiles.map((tile) => {
        const borderClass = healthBorderClass(tile.health);
        const textClass = healthTextClass(tile.health);
        const isClickable = !!onTileClick;
        return (
          <Card
            key={tile.label}
            className={`border-l-4 ${borderClass} transition-shadow hover:shadow-md ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={() => onTileClick?.(tile.label)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                  {tile.label}
                </span>
                <span
                  className={`h-2 w-2 rounded-full shrink-0 mt-0.5 ${
                    tile.health === 'green'
                      ? 'bg-health-green'
                      : tile.health === 'amber'
                        ? 'bg-health-amber'
                        : tile.health === 'red'
                          ? 'bg-health-red'
                          : 'bg-muted-foreground'
                  }`}
                  aria-hidden
                />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-heading text-lg font-bold text-foreground tabular-nums">
                  {typeof tile.value === 'number' ? tile.value.toLocaleString() : tile.value}
                </span>
                {tile.delta != null && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      tile.delta >= 0 ? 'text-health-green' : 'text-health-red'
                    }`}
                  >
                    {tile.delta >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(tile.delta).toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex justify-end">
                <Sparkline data={tile.sparkline} health={tile.health} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
