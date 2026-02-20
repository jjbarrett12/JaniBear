/**
 * Route optimization & GPS check-in service: route planning,
 * stop management, crew check-in/out, and time-on-site reporting.
 */
import { createClient } from '@/lib/supabase/server';
import type {
  RoutePlan,
  RouteStop,
  CrewCheckIn,
  TimeOnSiteReport,
} from '@/types/features';

// ─── Route Plans ─────────────────────────────────────────────────────────────

export async function getRoutePlans(orgId: string, date?: string): Promise<RoutePlan[]> {
  const supabase = await createClient();
  let query = supabase
    .from('route_plans')
    .select('*, route_stops(*, facilities(name, address))')
    .eq('org_id', orgId)
    .order('date', { ascending: true });

  if (date) query = query.eq('date', date);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as RoutePlan[];
}

export async function getRoutePlan(id: string): Promise<RoutePlan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('route_plans')
    .select('*, route_stops(*, facilities(name, address))')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as RoutePlan;
}

export async function createRoutePlan(
  orgId: string,
  plan: Partial<RoutePlan>,
  facilityIds: string[],
  userId?: string
): Promise<RoutePlan> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('route_plans')
    .insert({
      org_id: orgId,
      name: plan.name,
      date: plan.date,
      crew_id: plan.crew_id,
      assigned_to: plan.assigned_to,
      status: 'draft',
      total_stops: facilityIds.length,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  if (facilityIds.length > 0) {
    const { data: facilities } = await supabase
      .from('facilities')
      .select('id, name, address, latitude, longitude')
      .in('id', facilityIds);

    const stops = (facilities ?? []).map((f, i) => ({
      route_id: data.id,
      facility_id: f.id,
      stop_order: i + 1,
      address: f.address,
      latitude: f.latitude,
      longitude: f.longitude,
      status: 'pending' as const,
    }));

    await supabase.from('route_stops').insert(stops);
  }

  return data as RoutePlan;
}

/**
 * Basic route optimization using nearest-neighbor heuristic.
 * For production, this should call an external routing API (Google Directions,
 * OSRM, or similar) for actual drive times and optimal ordering.
 */
export async function optimizeRoute(routeId: string): Promise<RoutePlan> {
  const supabase = await createClient();

  const { data: stops } = await supabase
    .from('route_stops')
    .select('*')
    .eq('route_id', routeId)
    .order('stop_order');

  if (!stops?.length) throw new Error('No stops to optimize');

  const hasCoords = stops.every((s) => s.latitude != null && s.longitude != null);
  if (hasCoords) {
    const optimized = nearestNeighborSort(stops);
    for (let i = 0; i < optimized.length; i++) {
      await supabase
        .from('route_stops')
        .update({ stop_order: i + 1 })
        .eq('id', optimized[i].id);
    }
  }

  await supabase
    .from('route_plans')
    .update({ status: 'optimized', updated_at: new Date().toISOString() })
    .eq('id', routeId);

  return (await getRoutePlan(routeId))!;
}

function nearestNeighborSort(stops: RouteStop[]): RouteStop[] {
  if (stops.length <= 1) return stops;

  const remaining = [...stops];
  const result: RouteStop[] = [remaining.shift()!];

  while (remaining.length > 0) {
    const last = result[result.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineDistance(
        last.latitude!, last.longitude!,
        remaining[i].latitude!, remaining[i].longitude!
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    result.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return result;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// ─── GPS Check-In/Out ────────────────────────────────────────────────────────

const DEFAULT_GEOFENCE_RADIUS_METERS = 150;

export async function checkIn(
  orgId: string,
  userId: string,
  facilityId: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  photoUrl?: string,
  routeStopId?: string
): Promise<CrewCheckIn> {
  const supabase = await createClient();

  const { data: facility } = await supabase
    .from('facilities')
    .select('latitude, longitude')
    .eq('id', facilityId)
    .single();

  let withinGeofence: boolean | null = null;
  if (facility?.latitude && facility?.longitude) {
    const distMeters = haversineDistance(latitude, longitude, facility.latitude, facility.longitude) * 1609.34;
    withinGeofence = distMeters <= DEFAULT_GEOFENCE_RADIUS_METERS;
  }

  const { data, error } = await supabase
    .from('crew_check_ins')
    .insert({
      org_id: orgId,
      user_id: userId,
      facility_id: facilityId,
      route_stop_id: routeStopId,
      check_type: 'in',
      latitude,
      longitude,
      accuracy_meters: accuracy,
      is_within_geofence: withinGeofence,
      photo_url: photoUrl,
    })
    .select()
    .single();

  if (error) throw error;

  if (routeStopId) {
    await supabase
      .from('route_stops')
      .update({ status: 'arrived', arrival_time: new Date().toISOString() })
      .eq('id', routeStopId);
  }

  return data as CrewCheckIn;
}

export async function checkOut(
  orgId: string,
  userId: string,
  facilityId: string,
  latitude: number,
  longitude: number,
  accuracy: number,
  routeStopId?: string
): Promise<CrewCheckIn> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('crew_check_ins')
    .insert({
      org_id: orgId,
      user_id: userId,
      facility_id: facilityId,
      route_stop_id: routeStopId,
      check_type: 'out',
      latitude,
      longitude,
      accuracy_meters: accuracy,
    })
    .select()
    .single();

  if (error) throw error;

  if (routeStopId) {
    const { data: checkInRecord } = await supabase
      .from('crew_check_ins')
      .select('checked_at')
      .eq('route_stop_id', routeStopId)
      .eq('check_type', 'in')
      .order('checked_at', { ascending: false })
      .limit(1)
      .single();

    const actualMin = checkInRecord
      ? Math.round((Date.now() - new Date(checkInRecord.checked_at).getTime()) / 60000)
      : null;

    await supabase
      .from('route_stops')
      .update({
        status: 'completed',
        departure_time: new Date().toISOString(),
        actual_duration_min: actualMin,
      })
      .eq('id', routeStopId);
  }

  return data as CrewCheckIn;
}

// ─── Time-on-Site Reporting ──────────────────────────────────────────────────

export async function getTimeOnSiteReport(
  orgId: string,
  startDate: string,
  endDate: string,
  facilityId?: string
): Promise<TimeOnSiteReport[]> {
  const supabase = await createClient();

  let query = supabase
    .from('crew_check_ins')
    .select('*, profiles:user_id(full_name), facilities(name)')
    .eq('org_id', orgId)
    .gte('checked_at', startDate)
    .lte('checked_at', endDate)
    .order('checked_at', { ascending: true });

  if (facilityId) query = query.eq('facility_id', facilityId);

  const { data } = await query;
  if (!data?.length) return [];

  const paired: TimeOnSiteReport[] = [];
  const checkIns = data.filter((c) => c.check_type === 'in');

  for (const ci of checkIns) {
    const matchingOut = data.find(
      (c) =>
        c.check_type === 'out' &&
        c.user_id === ci.user_id &&
        c.facility_id === ci.facility_id &&
        new Date(c.checked_at) > new Date(ci.checked_at)
    );

    const dur = matchingOut
      ? Math.round((new Date(matchingOut.checked_at).getTime() - new Date(ci.checked_at).getTime()) / 60000)
      : null;

    paired.push({
      facility_id: ci.facility_id,
      facility_name: (ci.facilities as { name: string } | null)?.name ?? 'Unknown',
      date: ci.checked_at.slice(0, 10),
      user_name: (ci.profiles as { full_name: string } | null)?.full_name ?? 'Unknown',
      check_in: ci.checked_at,
      check_out: matchingOut?.checked_at ?? null,
      duration_min: dur,
      within_geofence: ci.is_within_geofence ?? false,
    });
  }

  return paired;
}
