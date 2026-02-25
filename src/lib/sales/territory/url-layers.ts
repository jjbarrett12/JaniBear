/**
 * URL search params for territory layer toggles. Shareable links.
 */

import { HEAT_LAYERS } from './salesTerritoryConfig';
import type { LayerId } from './salesTerritoryConfig';

export function parseLayersFromSearchParams(searchParams: URLSearchParams): LayerId[] {
  const layersParam = searchParams.get('layers');
  if (!layersParam) return [];
  const ids = layersParam.split(',').map((s) => s.trim()).filter(Boolean);
  return ids.filter((id): id is LayerId => HEAT_LAYERS.some((l) => l.id === id));
}

export function layersToSearchParams(layerIds: LayerId[]): string {
  if (layerIds.length === 0) return '';
  return `layers=${layerIds.join(',')}`;
}
