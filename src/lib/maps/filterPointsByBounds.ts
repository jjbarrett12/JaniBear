/**
 * Filter heatmap points by map bounds and optional weight threshold.
 * Used to avoid rendering points outside view and to respect threshold slider.
 */

export interface WeightedPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface BoundsLike {
  getSouthWest(): { lat: number; lng: number };
  getNorthEast(): { lat: number; lng: number };
}

export function filterPointsByBounds<T extends WeightedPoint>(
  points: T[],
  bounds: BoundsLike | null,
  minWeight: number
): T[] {
  if (!bounds) return points.filter((p) => p.weight >= minWeight);
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const minLat = Math.min(sw.lat, ne.lat);
  const maxLat = Math.max(sw.lat, ne.lat);
  const minLng = Math.min(sw.lng, ne.lng);
  const maxLng = Math.max(sw.lng, ne.lng);
  return points.filter(
    (p) =>
      p.lat >= minLat &&
      p.lat <= maxLat &&
      p.lng >= minLng &&
      p.lng <= maxLng &&
      p.weight >= minWeight
  );
}
