/**
 * Point-in-polygon for GeoJSON (no PostGIS). Used to find which coverage area contains a lead/facility.
 */

type Position = [number, number]; // [lng, lat] per GeoJSON

function rayCrossesSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): boolean {
  if (ay > by) [ay, by] = [by, ay];
  if (py <= ay || py > by) return false;
  const dx = bx - ax;
  const dy = by - ay;
  if (dx === 0) return px < ax;
  const t = (py - ay) / dy;
  const x = ax + t * dx;
  return px < x;
}

/**
 * Ray-casting: point in polygon (first ring only; holes not supported for MVP).
 * Ring is array of [lng, lat] (GeoJSON order).
 */
export function pointInRing(lng: number, lat: number, ring: Position[]): boolean {
  if (ring.length < 3) return false;
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (rayCrossesSegment(lng, lat, xj, yj, xi, yi)) inside = !inside;
  }
  return inside;
}

/**
 * Extract first ring from GeoJSON Polygon or MultiPolygon.
 * Returns array of [lng, lat] rings (one for Polygon, multiple for MultiPolygon).
 */
export function getRingsFromGeojson(geojson: { type: string; coordinates?: unknown }): Position[][] {
  const coords = geojson.coordinates;
  if (!Array.isArray(coords)) return [];
  if (geojson.type === 'Polygon') {
    const ring = coords[0];
    return Array.isArray(ring) && ring.length > 0 ? [ring as Position[]] : [];
  }
  if (geojson.type === 'MultiPolygon') {
    const rings: Position[][] = [];
    for (const poly of coords as Position[][][]) {
      if (Array.isArray(poly) && poly[0]?.length) rings.push(poly[0] as Position[]);
    }
    return rings;
  }
  return [];
}

/**
 * True if (lng, lat) is inside the given GeoJSON geometry (Polygon or MultiPolygon).
 */
export function pointInGeojson(
  lng: number,
  lat: number,
  geojson: { type: string; coordinates?: unknown }
): boolean {
  const rings = getRingsFromGeojson(geojson);
  for (const ring of rings) {
    if (pointInRing(lng, lat, ring)) return true;
  }
  return false;
}
