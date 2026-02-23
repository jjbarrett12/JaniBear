'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { CrewMetricCard } from '@/lib/kpi-strategic-data';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

function leftBorderClass(health?: CrewMetricCard['health']): string {
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

export function CrewMetricCardTile({ card }: { card: CrewMetricCard }) {
  const hasSignal = card.health && card.health !== 'neutral';
  return (
    <Card className={cn('kpi-card-elevated rounded-lg border shadow-none min-h-[180px] transition-colors', leftBorderClass(card.health))}>
      <CardContent className="p-4">
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
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground tabular-nums">
            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
          </span>
          {card.delta != null && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-xs font-medium tabular-nums',
                card.delta >= 0 ? 'text-[hsl(var(--health-green))]' : 'text-[hsl(var(--health-red))]'
              )}
            >
              {card.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {card.delta >= 0 ? '+' : ''}{card.delta.toFixed(1)}%
            </span>
          )}
        </div>
        {card.target && (
          <p className="text-xs text-muted-foreground/80 mt-1 truncate">{card.target}</p>
        )}
      </CardContent>
    </Card>
  );
}
