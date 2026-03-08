/**
 * Crew route profile: snapshot of a crew's current route (assigned facilities,
 * centroid, service window). Used by route-fit scoring and cluster assignment.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { distanceMiles } from '@/lib/performance/distance';

/** ~2.4 min per mile urban average. */
const MINUTES_PER_MILE = 2.4;

/**
 * Get crew's currently assigned facility IDs (service_assignments effective today).
 */
async function getCrewAssignedFacilityIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  crewId: string
): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('service_assignments')
    .select('facility_id')
    .eq('org_id', orgId)
    .eq('crew_id', crewId)
    .lte('effective_from', today)
    .or('effective_to.is.null,effective_to.gte.' + today);
  return (data ?? []).map((r: { facility_id: string }) => r.facility_id);
}

/**
 * Get facility lat/lng from geo_entities (entity_type = 'facility').
 */
async function getFacilityCoords(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  facilityIds: string[]
): Promise<Map<string, { lat: number; lng: number }>> {
  if (facilityIds.length === 0) return new Map();
  const { data } = await supabase
    .from('geo_entities')
    .select('entity_id, lat, lng')
    .eq('org_id', orgId)
    .eq('entity_type', 'facility')
    .in('entity_id', facilityIds)
    .not('lat', 'is', null)
    .not('lng', 'is', null);
  const map = new Map<string, { lat: number; lng: number }>();
  for (const row of data ?? []) {
    const r = row as { entity_id: string; lat: number; lng: number };
    map.set(r.entity_id, { lat: r.lat, lng: r.lng });
  }
  return map;
}

function centroid(points: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  return {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
}

/**
 * Compute and upsert crew_route_profile for one crew. Call from cron or on-demand.
 */
export async function getOrComputeCrewRouteProfile(
  orgId: string,
  crewId: string
): Promise<{
  facility_count: number;
  centroid_lat: number | null;
  centroid_lng: number | null;
  avg_drive_minutes_per_visit: number | null;
  service_window: 'evening' | 'day' | 'mixed' | null;
}> {
  const supabase = await createClient();
  const facilityIds = await getCrewAssignedFacilityIds(supabase, orgId, crewId);
  const coords = await getFacilityCoords(supabase, orgId, facilityIds);
  const points = [...coords.values()];
  const cent = centroid(points);

  let avg_drive_minutes_per_visit: number | null = null;
  if (points.length >= 2 && cent) {
    const totalMiles = points.reduce((sum, p) => sum + distanceMiles(cent.lat, cent.lng, p.lat, p.lng), 0);
    avg_drive_minutes_per_visit = Math.round((totalMiles / points.length) * MINUTES_PER_MILE * 2); // round-trip
  }

  const now = new Date().toISOString();
  await supabase.from('crew_route_profiles').upsert(
    {
      org_id: orgId,
      crew_id: crewId,
      facility_ids: facilityIds,
      facility_count: facilityIds.length,
      centroid_lat: cent?.lat ?? null,
      centroid_lng: cent?.lng ?? null,
      avg_drive_minutes_per_visit,
      service_window: 'evening', // default; could derive from service_agreements.service_days + config
      computed_at: now,
      updated_at: now,
    },
    { onConflict: 'org_id,crew_id' }
  );

  return {
    facility_count: facilityIds.length,
    centroid_lat: cent?.lat ?? null,
    centroid_lng: cent?.lng ?? null,
    avg_drive_minutes_per_visit,
    service_window: 'evening',
  };
}
