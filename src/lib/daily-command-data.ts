/**
 * Daily Command Overview — source of truth: Supabase views only.
 * v_revenue_today, v_capacity_today, v_hiring_pressure_14d, v_buildings_cleaned_today.
 * No invoice/work_order/facility-derived revenue. Minimal lookups for display names.
 */
import { createClient } from '@/lib/supabase/server';

export type RevenueTodayRow = {
  buildings_scheduled_today: number;
  projected_recurring_revenue_today: number;
};

export type CapacityTodayRow = {
  active_crews: number;
  building_capacity_today: number;
};

export type HiringPressure14dRow = {
  buildings_scheduled_14d: number;
  crews_needed_14d: number;
  hiring_trigger?: boolean | null;
};

export type BuildingTodayRow = {
  id: string;
  location_id: string | null;
  crew_id: string | null;
  template_id: string | null;
  weekday: number | null;
  start_date: string | null;
  expected_completion_time?: string | null;
  [key: string]: unknown;
};

export type BuildingTodayDisplay = {
  id: string;
  locationName: string;
  clientName: string;
  crewName: string | null;
  templateName: string | null;
  weekday: number | null;
  start_date: string | null;
  startTime: string | null;
};

export type DailyCommandPayload = {
  revenueToday: RevenueTodayRow | null;
  capacityToday: CapacityTodayRow | null;
  hiring14d: HiringPressure14dRow | null;
  buildingsToday: BuildingTodayDisplay[];
  unassignedCount: number;
  /** buildings_scheduled_today / building_capacity_today (app-side only) */
  utilizationPct: number | null;
};

const EMPTY_PAYLOAD: DailyCommandPayload = {
  revenueToday: null,
  capacityToday: null,
  hiring14d: null,
  buildingsToday: [],
  unassignedCount: 0,
  utilizationPct: null,
};

export async function getDailyCommand(orgId: string): Promise<DailyCommandPayload> {
  try {
    return await getDailyCommandInner(orgId);
  } catch (e) {
    if (process.env.NODE_ENV === 'development') console.error('[getDailyCommand]', e);
    return EMPTY_PAYLOAD;
  }
}

async function getDailyCommandInner(orgId: string): Promise<DailyCommandPayload> {
  const supabase = await createClient();

  const [revRes, capRes, hiringRes, buildingsRes] = await Promise.all([
    supabase.from('v_revenue_today').select('*').eq('org_id', orgId).maybeSingle(),
    supabase.from('v_capacity_today').select('*').eq('org_id', orgId).maybeSingle(),
    supabase.from('v_hiring_pressure_14d').select('*').eq('org_id', orgId).maybeSingle(),
    supabase.from('v_buildings_cleaned_today').select('*').eq('org_id', orgId).order('start_date', { ascending: true }),
  ]);

  if (revRes.error && revRes.error.code !== 'PGRST116') throw revRes.error;
  if (capRes.error && capRes.error.code !== 'PGRST116') throw capRes.error;
  if (hiringRes.error && hiringRes.error.code !== 'PGRST116') throw hiringRes.error;
  if (buildingsRes.error) throw buildingsRes.error;

  const revenueToday = (revRes.data ?? null) as RevenueTodayRow | null;
  const capacityToday = (capRes.data ?? null) as CapacityTodayRow | null;
  const hiring14d = (hiringRes.data ?? null) as HiringPressure14dRow | null;
  const buildingsRaw = (buildingsRes.data ?? []) as BuildingTodayRow[];

  const unassignedCount = buildingsRaw.filter((r) => r.crew_id == null).length;
  const buildingCapacity = capacityToday?.building_capacity_today ?? 0;
  const scheduledToday = revenueToday?.buildings_scheduled_today ?? buildingsRaw.length;
  const utilizationPct =
    buildingCapacity > 0 ? Math.round((scheduledToday / buildingCapacity) * 100) : null;

  const locationIds = [...new Set(buildingsRaw.map((b) => b.location_id).filter(Boolean))] as string[];
  const crewIds = [...new Set(buildingsRaw.map((b) => b.crew_id).filter(Boolean))] as string[];
  const templateIds = [...new Set(buildingsRaw.map((b) => b.template_id).filter(Boolean))] as string[];

  let locationNameById = new Map<string, string>();
  let clientNameByLocationId = new Map<string, string>();
  const crewNameById = new Map<string, string>();
  const templateNameById = new Map<string, string>();

  if (locationIds.length > 0 || crewIds.length > 0 || templateIds.length > 0) {
    const [facilitiesRes, crewsRes, templatesRes] = await Promise.all([
      locationIds.length
        ? supabase.from('facilities').select('id, name, account_id').in('id', locationIds)
        : Promise.resolve({ data: [] }),
      crewIds.length ? supabase.from('crews').select('id, name').in('id', crewIds) : Promise.resolve({ data: [] }),
      templateIds.length ? supabase.from('templates').select('id, name').in('id', templateIds) : Promise.resolve({ data: [] }),
    ]);

    const facilities = (facilitiesRes.data ?? []) as { id: string; name: string; account_id: string }[];
    const crews = (crewsRes.data ?? []) as { id: string; name: string }[];
    const templates = (templatesRes.data ?? []) as { id: string; name: string }[];

    facilities.forEach((f) => locationNameById.set(f.id, f.name));
    crews.forEach((c) => crewNameById.set(c.id, c.name));
    templates.forEach((t) => templateNameById.set(t.id, t.name));

    const accountIds = [...new Set(facilities.map((f) => f.account_id).filter(Boolean))];
    if (accountIds.length > 0) {
      const { data: accounts } = await supabase.from('accounts').select('id, name').in('id', accountIds);
      const accountNameById = new Map((accounts ?? []).map((a: { id: string; name: string }) => [a.id, a.name]));
      facilities.forEach((f) => clientNameByLocationId.set(f.id, accountNameById.get(f.account_id) ?? '—'));
    }
  }

  const buildingsToday: BuildingTodayDisplay[] = buildingsRaw.map((b) => {
    const locId = b.location_id ?? b.facility_id ?? null;
    const locationName = locId ? locationNameById.get(locId) ?? '—' : '—';
    const clientName = locId ? clientNameByLocationId.get(locId) ?? '—' : '—';
    const crewName = b.crew_id ? crewNameById.get(b.crew_id) ?? null : null;
    const templateName = b.template_id ? templateNameById.get(b.template_id) ?? null : null;
    const startTime = b.expected_completion_time ? String(b.expected_completion_time).slice(0, 5) : null;
    return {
      id: b.id,
      locationName,
      clientName,
      crewName,
      templateName,
      weekday: b.weekday,
      start_date: b.start_date,
      startTime,
    };
  });

  return {
    revenueToday,
    capacityToday,
    hiring14d,
    buildingsToday,
    unassignedCount,
    utilizationPct,
  };
}

/** @deprecated Use getDailyCommand. Kept for backwards compatibility. */
export async function getDailyCommandData(orgId: string): Promise<{
  summary: unknown;
  buildings: unknown[];
  risk: unknown;
  revenue: unknown;
}> {
  const payload = await getDailyCommand(orgId);
  const buildingsScheduled = payload.revenueToday?.buildings_scheduled_today ?? payload.buildingsToday.length;
  return {
    summary: {
      buildingsScheduledToday: buildingsScheduled,
      projectedRecurringRevenueToday: payload.revenueToday?.projected_recurring_revenue_today ?? 0,
      activeCrews: payload.capacityToday?.active_crews ?? 0,
      buildingCapacityToday: payload.capacityToday?.building_capacity_today ?? 0,
      utilizationPct: payload.utilizationPct,
      crewsNeeded14d: payload.hiring14d?.crews_needed_14d ?? null,
      hiringTrigger: payload.hiring14d?.hiring_trigger ?? false,
      unassignedCount: payload.unassignedCount,
    },
    buildings: payload.buildingsToday,
    risk: {},
    revenue: {},
  };
}
