/**
 * Geo location normalization for map entities.
 * If entity has valid lat/lng → use them.
 * If only address exists → geocode (future feature; for now exclude).
 * Never crash the map; return null when coordinates are missing.
 */

export interface EntityWithOptionalCoords {
  lat?: number | null;
  lng?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  address1?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  postal_code?: string | null;
}

export interface CoordsResult {
  lat: number;
  lng: number;
}

/**
 * Returns { lat, lng } if the entity has valid coordinates; otherwise null.
 * Prefers lat/lng, then latitude/longitude. Does not geocode (future feature).
 * Exclude entity from map when null.
 */
export function getEntityCoordinates(
  entity: EntityWithOptionalCoords | null | undefined
): CoordsResult | null {
  if (!entity) return null;
  const lat =
    entity.lat ?? entity.latitude ?? null;
  const lng =
    entity.lng ?? entity.longitude ?? null;
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng)
  ) {
    return { lat, lng };
  }
  // Future: if (entity.address ?? entity.address1 ?? [entity.city, entity.state].filter(Boolean).join(', ')) → geocode
  return null;
}
