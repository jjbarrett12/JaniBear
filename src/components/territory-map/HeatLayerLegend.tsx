'use client';

import { HEAT_LAYERS_BY_ID } from '@/lib/sales/territory/salesTerritoryConfig';
import type { LayerId } from '@/lib/sales/territory/salesTerritoryConfig';
import { cn } from '@/lib/utils';

interface Props {
  enabledLayerIds: LayerId[];
  className?: string;
}

export function HeatLayerLegend({ enabledLayerIds, className }: Props) {
  if (enabledLayerIds.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 rounded-lg border border-white/15 bg-zinc-900/90 px-3 py-2 shadow-lg',
        className
      )}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 w-full">Heat layers on</span>
      {enabledLayerIds.map((id) => {
        const layer = HEAT_LAYERS_BY_ID[id];
        if (!layer) return null;
        return (
          <div
            key={id}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-zinc-200',
              layer.colorClass
            )}
          >
            <span aria-hidden>{layer.icon}</span>
            <span>{layer.label}</span>
          </div>
        );
      })}
    </div>
  );
}
