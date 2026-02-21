'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { CrewMetricCard } from '@/lib/kpi-strategic-data';
import { TrendingUp, TrendingDown } from 'lucide-react';

function borderClass(health?: CrewMetricCard['health']): string {
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

export function CrewMetricCardTile({ card }: { card: CrewMetricCard }) {
  const border = borderClass(card.health);
  return (
    <Card className={`border-l-4 ${border} transition-shadow hover:shadow-md`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">
            {card.label}
          </span>
          {card.health && (
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
      </CardContent>
    </Card>
  );
}
