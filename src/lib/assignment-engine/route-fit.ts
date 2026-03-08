/**
 * Route-fit scoring: distance from assigned accounts, added drive time,
 * centroid proximity, cluster fit, service window compatibility.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { distanceMiles } from '@/lib/performance/distance';
import type { RouteFitDetail } from '@/types/activation-recommendation';

/** ~2.4 min per mile urban average for drive time estimate. */
const MINUTES_PER_MILE = 2.4;

export interface RouteFitInput {
  org_id: string;
  crew_id: string;
  /** New account/facility lat/lng. */
  account_lat: number;
  account_lng: number;
  /** Account service window (evening | day | mixed) for compatibility. */
  service_window?: string | null;
}

export interface RouteFitResult extends RouteFitDetail {
  /** For backward compatibility / logging. */
  distance_miles_to_nearest: number | null;
}

/**
 * Get facility lat/lng from geo_entities (entity_type = 'facility', entity_id = facility_id).
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

/**
 * Get crew's currently assigned facility IDs (service_assignments with no effective_to or effective_to in future).
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
    .or(`effective_to.is.null,effective_to.gte.${today}`);
  return (data ?? []).map((r: { facility_id: string }) => r.facility_id);
}

/**
 * Compute centroid (average lat, average lng) of points.
 */
function centroid(points: { lat: number; lng: number }[]): { lat: number; lng: number } | null {
  if (points.length === 0) return null;
  const sumLat = points.reduce((s, p) => s + p.lat, 0);
  const sumLng = points.reduce((s, p) => s + p.lng, 0);
  return { lat: sumLat / points.length, lng: sumLng / points.length };
}

/**
 * Compute route-fit score 0–100: proximity to assigned facilities, low added drive time,
 * proximity to route centroid, optional cluster and service window match.
 */
export async function computeRouteFit(input: RouteFitInput): Promise<RouteFitResult> {
  const supabase = await createClient();
  const { org_id: orgId, crew_id: crewId, account_lat: accLat, account_lng: accLng, service_window: accountWindow } = input;

  const facilityIds = await getCrewAssignedFacilityIds(supabase, orgId, crewId);
  const coords = await getFacilityCoords(supabase, orgId, facilityIds);
  const points = [...coords.values()];

  let distance_to_nearest_miles: number | null = null;
  let distance_to_centroid_miles: number | null = null;
  let added_travel_minutes: number | null = null;

  if (points.length > 0) {
    const distances = points.map((p) => distanceMiles(accLat, accLng, p.lat, p.lng));
    distance_to_nearest_miles = Math.min(...distances);
    added_travel_minutes = Math.round(distance_to_nearest_miles * MINUTES_PER_MILE * 2); // round-trip per visit
    const cent = centroid(points);
    if (cent) {
      distance_to_centroid_miles = distanceMiles(accLat, accLng, cent.lat, cent.lng);
    }
  }

  // Route fit score: higher when closer to existing route (lower distance to nearest and to centroid)
  let route_fit_score = 50; // neutral when no assigned facilities
  if (distance_to_nearest_miles != null) {
    // 0 mi -> 100, 5 mi -> ~70, 15 mi -> 40, 30+ mi -> 0 (reuse proximity curve)
    if (distance_to_nearest_miles <= 0) route_fit_score = 100;
    else if (distance_to_nearest_miles <= 5) route_fit_score = 100 - distance_to_nearest_miles * 6;
    else if (distance_to_nearest_miles <= 15) route_fit_score = 70 - (distance_to_nearest_miles - 5) * 3;
    else if (distance_to_nearest_miles <= 30) route_fit_score = 40 - (distance_to_nearest_miles - 15) * 2.67;
    else route_fit_score = 0;
    route_fit_score = Math.max(0, Math.min(100, Math.round(route_fit_score)));
  }

  // Optional: crew_route_profile for cluster_id and service_window
  let cluster_id: string | null = null;
  let cluster_name: string | null = null;
  let service_window_match = true;
  const { data: profile } = await supabase
    .from('crew_route_profiles')
    .select('cluster_id, service_window')
    .eq('org_id', orgId)
    .eq('crew_id', crewId)
    .maybeSingle();
  if (profile) {
    const p = profile as { cluster_id?: string | null; service_window?: string | null };
    cluster_id = p.cluster_id ?? null;
    if (p.service_window && accountWindow) {
      const crewWindow = String(p.service_window).toLowerCase();
      const accW = String(accountWindow).toLowerCase();
      service_window_match = crewWindow === accW || crewWindow === 'mixed' || accW === 'mixed';
    }
    if (cluster_id) {
      const { data: cluster } = await supabase.from('route_clusters').select('name').eq('id', cluster_id).single();
      cluster_name = (cluster as { name?: string } | null)?.name ?? null;
    }
  }

  return {
    route_fit_score,
    added_travel_minutes,
    distance_to_nearest_miles,
    distance_to_centroid_miles: distance_to_centroid_miles ?? null,
    cluster_id,
    cluster_name,
    service_window_match,
    distance_miles_to_nearest: distance_to_nearest_miles,
  };
}
