/**
 * Typed fetchers for Territory War Board: pins, heat metrics, building intel.
 * Validate with zod; on failure return empty/safe data and log structured error.
 */

import type { MapPin, BuildingIntel, HeatMetricCell } from './types';
import { mapPinSchema } from './schemas';
import { buildingIntelSchema } from './schemas';
import { heatMetricCellSchema } from './schemas';

const UNKNOWN = 'Unknown';

function safeMapPin(raw: unknown): MapPin {
  const parsed = mapPinSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  console.error('[TerritoryWarBoard] Invalid MapPin', { raw, error: parsed.error.flatten() });
  return {
    id: typeof (raw as Record<string, unknown>)?.id === 'string' ? (raw as Record<string, unknown>).id as string : '',
    name: UNKNOWN,
    lat: 0,
    lng: 0,
    type: 'prospect',
  };
}

function safeBuildingIntel(raw: unknown): BuildingIntel {
  const parsed = buildingIntelSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  console.error('[TerritoryWarBoard] Invalid BuildingIntel', { raw, error: parsed.error.flatten() });
  const o = (raw as Record<string, unknown>) || {};
  return {
    id: typeof o.id === 'string' ? o.id : '',
    name: typeof o.name === 'string' ? o.name : UNKNOWN,
    sqft: null,
    estValueMonthly: null,
    marginPotentialPct: null,
    competitorsNearby: null,
    similarWinsInZip: null,
    riskScore: null,
    suggestedTemplate: null,
  };
}

/** Fetch map pins (buildings/prospects/clients) for the org. */
export async function getPins(orgId: string): Promise<MapPin[]> {
  const { getPinsFromAdapter } = await import('./adapters/mock');
  const raw = await getPinsFromAdapter(orgId);
  return Array.isArray(raw) ? raw.map(safeMapPin) : [];
}

/** Fetch heat metric cells for overlay (bounds + metrics). */
export async function getHeatMetrics(orgId: string, _bounds?: { north: number; south: number; east: number; west: number }): Promise<HeatMetricCell[]> {
  const { getHeatMetricsFromAdapter } = await import('./adapters/mock');
  const raw = await getHeatMetricsFromAdapter(orgId);
  if (!Array.isArray(raw)) return [];
  return raw.map((r: unknown) => {
    const parsed = heatMetricCellSchema.safeParse(r);
    if (parsed.success) return parsed.data;
    console.error('[TerritoryWarBoard] Invalid HeatMetricCell', { raw: r, error: parsed.error.flatten() });
    return null;
  }).filter(Boolean) as HeatMetricCell[];
}

/** Fetch building intel by building id for the Intelligence Card. */
export async function getBuildingIntel(orgId: string, buildingId: string): Promise<BuildingIntel> {
  const { getBuildingIntelFromAdapter } = await import('./adapters/mock');
  const raw = await getBuildingIntelFromAdapter(orgId, buildingId);
  return safeBuildingIntel(raw ?? { id: buildingId, name: UNKNOWN });
}
