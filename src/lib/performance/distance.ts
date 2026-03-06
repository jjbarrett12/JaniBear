/**
 * Approximate distance in miles between two lat/lng points (Haversine).
 */

export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth radius miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Territory proximity score for allocation:
 * 100 if inside coverage area (caller checks),
 * 70 if within 15 miles,
 * 40 if within 30 miles,
 * 0 otherwise.
 */
export function territoryProximityScoreFromDistanceMiles(distanceMiles: number): number {
  if (distanceMiles <= 0) return 100;
  if (distanceMiles <= 15) return 70;
  if (distanceMiles <= 30) return 40;
  return 0;
}
