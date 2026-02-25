'use client';

import { useCallback } from 'react';
import { HEAT_LAYERS } from '@/lib/sales/territory/salesTerritoryConfig';
import type { LayerId } from '@/lib/sales/territory/salesTerritoryConfig';
import { cn } from '@/lib/utils';

export { parseLayersFromSearchParams, layersToSearchParams } from '@/lib/sales/territory/url-layers';

const STORAGE_KEY_PREFIX = 'janibear_territory_layers_';

interface Props {
  enabledLayerIds: LayerId[];
  onToggle: (layerId: LayerId, enabled: boolean) => void;
  userId: string | null;
  className?: string;
}

export function LayerToggleCluster({ enabledLayerIds, onToggle, userId, className }: Props) {
  const set = new Set(enabledLayerIds);

  const persist = useCallback(
    (ids: LayerId[]) => {
      if (typeof window === 'undefined' || !userId) return;
      try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(ids));
      } catch {
        /* ignore */
      }
    },
    [userId]
  );

  const handleToggle = useCallback(
    (layerId: LayerId) => {
      const next = set.has(layerId) ? enabledLayerIds.filter((id) => id !== layerId) : [...enabledLayerIds, layerId];
      onToggle(layerId, !set.has(layerId));
      persist(next);
    },
    [enabledLayerIds, onToggle, persist, set]
  );

  return (
    <div className={cn('flex flex-col gap-1.5 rounded-lg border border-white/15 bg-zinc-900/90 p-2 shadow-lg', className)}>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-2 pt-0.5">Layers</span>
      {HEAT_LAYERS.map((layer) => {
        const isOn = set.has(layer.id);
        return (
          <button
            key={layer.id}
            type="button"
            title={layer.description}
            onClick={() => handleToggle(layer.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors w-full',
              isOn ? 'bg-white/15 text-white' : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-300'
            )}
          >
            <span className="text-base leading-none" aria-hidden>{layer.icon}</span>
            <span className="truncate">{layer.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function readLayersFromStorage(userId: string | null): LayerId[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is LayerId => typeof id === 'string' && HEAT_LAYERS.some((l) => l.id === id)) : [];
  } catch {
    return [];
  }
}
