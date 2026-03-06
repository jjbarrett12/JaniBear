import { createClient } from '@/lib/supabase/server';
import { getEntityCoordinates } from '@/lib/maps/getEntityCoordinates';
import type {
  AccountOption,
  FacilityWithHealth,
  Prospect,
  Quadrant,
  TerritoryMapPayload,
  MapEntity,
  TerritoryPolygon,
  LeadPoint,
  AccountPoint,
  CoverageArea,
  CoverageAssignment,
} from '@/types/territory-map';
import { salesLeadWeight, opsAccountRiskScore } from '@/lib/maps/weights';
import { hasPermission } from '@/lib/auth/permission-helpers';

/** Build MapEntity[] from rows that may have lat/lng or latitude/longitude; exclude missing coords. */
function toMapEntities<T>(
  rows: T[],
  type: MapEntity['type'],
  getId: (r: T) => string,
  getName: (r: T) => string,
  getMeta?: (r: T) => Record<string, unknown> | undefined
): MapEntity[] {
  const out: MapEntity[] = [];
  for (const r of rows) {
    const coords = getEntityCoordinates(r as Parameters<typeof getEntityCoordinates>[0]);
    if (!coords) continue;
    out.push({
      id: getId(r),
      name: getName(r),
      lat: coords.lat,
      lng: coords.lng,
      type,
      meta: getMeta?.(r),
    });
  }
  return out;
}

export interface GetTerritoryMapDataOptions {
  /** When set, used to enforce coverage visibility: admins see all areas, reps see only assigned. */
  userId?: string;
}

/**
 * Fetch all data needed for the Territory Map page (RLS-safe).
 * Returns accounts, quadrants, facilities, prospects, unified layers, coverage areas/assignments.
 */
export async function getTerritoryMapData(
  orgId: string,
  options?: GetTerritoryMapDataOptions
): Promise<TerritoryMapPayload> {
  const supabase = await createClient();
  const userId = options?.userId;

  const [
    accountsRes,
    quadrantsRes,
    facilitiesRes,
    healthRes,
    prospectsRes,
    leadsRes,
    crewsRes,
    geoRes,
    serviceAreasRes,
    franchiseAssocRes,
    verticalsRes,
  ] = await Promise.all([
    supabase.from('accounts').select('id, name').eq('org_id', orgId).eq('status', 'active').order('name'),
    supabase.from('quadrants').select('*').eq('org_id', orgId).order('created_at'),
    supabase
      .from('facilities')
      .select('id, org_id, account_id, name, address_line1, city, state, zip, latitude, longitude, accounts!inner(name)')
      .eq('org_id', orgId)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null),
    supabase.from('site_health').select('*').eq('org_id', orgId),
    supabase
      .from('prospects')
      .select('*')
      .eq('org_id', orgId)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .order('created_at', { ascending: false }),
    supabase.from('leads').select('id, company, contact_name, address, city, state, zip, status, vertical_id, vertical_confidence, vertical_source').eq('org_id', orgId).order('created_at', { ascending: false }).limit(500),
    supabase.from('crews').select('id, name').eq('org_id', orgId).order('name'),
    supabase
      .from('geo_entities')
      .select('entity_type, entity_id, label, lat, lng')
      .eq('org_id', orgId)
      .not('lat', 'is', null)
      .not('lng', 'is', null),
    supabase.from('service_areas').select('id, name, type, geojson, color').eq('org_id', orgId),
    supabase.from('franchise_associations').select('franchisee_org_id').eq('franchisor_org_id', orgId).eq('status', 'active'),
    supabase.from('verticals').select('id, key, label').eq('org_id', orgId).eq('active', true).order('key'),
  ]);

  const franchiseeIds = (franchiseAssocRes.data ?? []).map((a: { franchisee_org_id: string }) => a.franchisee_org_id);
  let franchiseeOrgs: { id: string; name: string; latitude?: number | null; longitude?: number | null }[] = [];
  if (franchiseeIds.length > 0) {
    const { data } = await supabase
      .from('organizations')
      .select('id, name, address_line, city, state, zip, latitude, longitude')
      .in('id', franchiseeIds);
    franchiseeOrgs = data ?? [];
  }

  const accounts: AccountOption[] = (accountsRes.data ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }));
  const quadrants: Quadrant[] = (quadrantsRes.data ?? []) as Quadrant[];
  const healthMap = new Map((healthRes.data ?? []).map((h: { site_id: string }) => [h.site_id, h]));
  const facilities: FacilityWithHealth[] = (facilitiesRes.data ?? []).map((f: Record<string, unknown>) => {
    const h = healthMap.get(f.id as string);
    const acct = f.accounts as { name: string } | null;
    return {
      id: f.id as string,
      org_id: f.org_id as string,
      account_id: f.account_id as string,
      name: f.name as string,
      address_line1: f.address_line1 as string | null,
      city: f.city as string | null,
      state: f.state as string | null,
      zip: f.zip as string | null,
      latitude: f.latitude as number,
      longitude: f.longitude as number,
      account_name: acct?.name ?? '',
      health_status: (h as { health_status?: string })?.health_status ?? 'green',
      last_inspection_at: (h as { last_inspection_at?: string | null })?.last_inspection_at ?? null,
      last_inspection_score: (h as { last_inspection_score?: number | null })?.last_inspection_score ?? null,
      checklist_completion_7d: (h as { checklist_completion_7d?: number | null })?.checklist_completion_7d ?? null,
      open_ticket_count: (h as { open_ticket_count?: number })?.open_ticket_count ?? 0,
      overdue_ticket_count: (h as { overdue_ticket_count?: number })?.overdue_ticket_count ?? 0,
      missed_shifts_7d: (h as { missed_shifts_7d?: number })?.missed_shifts_7d ?? 0,
    };
  });

  const accountRiskMap = new Map<string, { risk_score: number; risk_level: string }>();
  const { data: riskSnapshots } = await supabase
    .from('account_risk_snapshots')
    .select('account_id, risk_score, risk_level')
    .eq('org_id', orgId)
    .eq('status', 'active');
  for (const r of riskSnapshots ?? []) {
    const row = r as { account_id: string; risk_score: number; risk_level: string };
    accountRiskMap.set(row.account_id, { risk_score: row.risk_score, risk_level: row.risk_level });
  }
  for (const f of facilities) {
    const risk = accountRiskMap.get(f.account_id);
    if (risk) {
      (f as FacilityWithHealth & { account_risk_score?: number; account_risk_level?: string }).account_risk_score = risk.risk_score;
      (f as FacilityWithHealth & { account_risk_level?: string }).account_risk_level = risk.risk_level as FacilityWithHealth['account_risk_level'];
    }
  }

  const prospects: Prospect[] = (prospectsRes.data ?? []) as Prospect[];

  const geoByEntity = new Map<string, { lat: number; lng: number; label: string }>();
  for (const g of geoRes.data ?? []) {
    const row = g as { entity_type: string; entity_id: string; label: string; lat: number; lng: number };
    geoByEntity.set(`${row.entity_type}:${row.entity_id}`, { lat: row.lat, lng: row.lng, label: row.label });
  }

  const verticalsList = (verticalsRes.data ?? []) as { id: string; key: string; label: string }[];
  const verticalLabelById = new Map(verticalsList.map((v) => [v.id, v.label]));

  const leads: MapEntity[] = [];
  for (const lead of leadsRes.data ?? []) {
    const row = lead as {
      id: string;
      company?: string | null;
      contact_name?: string | null;
      status?: string;
      vertical_id?: string | null;
      vertical_confidence?: number | null;
      vertical_source?: string | null;
    };
    const geo = geoByEntity.get(`lead:${row.id}`);
    if (geo) {
      const meta: Record<string, unknown> = { contact: row.contact_name, status: row.status };
      if (row.vertical_id) {
        meta.vertical_id = row.vertical_id;
        meta.vertical_label = verticalLabelById.get(row.vertical_id) ?? null;
        meta.vertical_confidence = row.vertical_confidence ?? null;
        meta.vertical_source = row.vertical_source ?? null;
      }
      leads.push({
        id: row.id,
        name: (row.company || row.contact_name || 'Lead') as string,
        lat: geo.lat,
        lng: geo.lng,
        type: 'lead',
        meta,
      });
    }
  }
  const prospectsAsLeads = toMapEntities(
    prospects,
    'lead',
    (p) => p.id,
    (p) => p.name ?? 'Prospect',
    (p) => ({ status: p.status })
  );
  const leadIds = new Set(leads.map((l) => l.id));
  for (const p of prospectsAsLeads) {
    if (!leadIds.has(p.id)) leads.push(p);
  }

  const accountsList: MapEntity[] = toMapEntities(
    facilitiesRes.data ?? [],
    'account',
    (f: Record<string, unknown>) => f.id as string,
    (f: Record<string, unknown>) => (f.name as string) || ((f.accounts as { name?: string })?.name ?? 'Account'),
    (f: Record<string, unknown>) => ({ account_name: (f.accounts as { name?: string })?.name })
  );

  const crews: MapEntity[] = [];
  for (const crew of crewsRes.data ?? []) {
    const row = crew as { id: string; name: string };
    const geo = geoByEntity.get(`crew:${row.id}`);
    if (geo) {
      crews.push({ id: row.id, name: row.name, lat: geo.lat, lng: geo.lng, type: 'crew' });
    }
  }

  const franchisees: MapEntity[] = [];
  for (const o of franchiseeOrgs) {
    const coords = getEntityCoordinates(o);
    if (coords) franchisees.push({ id: o.id, name: o.name, lat: coords.lat, lng: coords.lng, type: 'franchisee' });
  }

  const operatorIds = [
    ...crews.map((c) => ({ type: 'crew' as const, id: c.id })),
    ...franchisees.map((f) => ({ type: 'franchisee' as const, id: f.id })),
  ];
  const perfMap = new Map<string, number>();
  if (operatorIds.length > 0) {
    const { data: perfRows } = await supabase
      .from('operator_performance')
      .select('operator_type, operator_id, total_score')
      .eq('org_id', orgId)
      .in('operator_type', ['crew', 'franchisee']);
    for (const p of perfRows ?? []) {
      const row = p as { operator_type: string; operator_id: string; total_score: number };
      perfMap.set(`${row.operator_type}:${row.operator_id}`, row.total_score);
    }
    for (const c of crews) {
      const score = perfMap.get(`crew:${c.id}`);
      if (score != null) c.meta = { ...c.meta, performance_score: score, total_score: score };
    }
    for (const f of franchisees) {
      const score = perfMap.get(`franchisee:${f.id}`);
      if (score != null) f.meta = { ...f.meta, performance_score: score, total_score: score };
    }
  }

  const territories: TerritoryPolygon[] = (quadrantsRes.data ?? []).map((q: Record<string, unknown>) => ({
    id: q.id as string,
    name: q.name as string,
    type: 'territory' as const,
    geojson: q.geojson as GeoJSON.Geometry | GeoJSON.Feature,
    color: q.color as string | null,
    fillOpacity: 0.12,
  }));

  const serviceAreas: TerritoryPolygon[] = (serviceAreasRes.data ?? []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    name: s.name as string,
    type: 'service_area' as const,
    geojson: s.geojson as GeoJSON.Geometry | GeoJSON.Feature,
    color: s.color as string | null,
    fillOpacity: 0.2,
  }));

  const heatmapLeads: LeadPoint[] = [];
  const addLeadPoint = (id: string, lat: number, lng: number, score: number, priority: 'high' | 'normal' | 'low', status: string) => {
    const weight = salesLeadWeight({ score, priority, status });
    heatmapLeads.push({ id, lat, lng, score, priority, status, weight });
  };
  for (const p of prospects) {
    const priority: 'high' | 'normal' | 'low' = 'normal';
    const score = 50;
    addLeadPoint(p.id, p.lat, p.lng, score, priority, p.status);
  }
  for (const l of leads) {
    const meta = l.meta ?? {};
    const score = typeof meta.score === 'number' ? meta.score : 50;
    const priority = (meta.priority === 'high' || meta.priority === 'low' ? meta.priority : 'normal') as 'high' | 'normal' | 'low';
    const status = (meta.status as string) ?? 'new';
    addLeadPoint(l.id, l.lat, l.lng, score, priority, status);
  }

  const heatmapAccounts: AccountPoint[] = facilities.map((f) => {
    const snapshotRisk = f.account_risk_score != null ? f.account_risk_score : null;
    const riskScore = snapshotRisk ?? opsAccountRiskScore({
      health_status: f.health_status,
      last_inspection_score: f.last_inspection_score,
      open_ticket_count: f.open_ticket_count,
      overdue_ticket_count: f.overdue_ticket_count,
      missed_shifts_7d: f.missed_shifts_7d,
    });
    return {
      id: f.id,
      lat: f.latitude,
      lng: f.longitude,
      riskScore,
      weight: riskScore,
      risk_level: f.account_risk_level ?? undefined,
    };
  });

  let coverageAreas: CoverageArea[] = [];
  let coverageAssignments: CoverageAssignment[] = [];
  let coverageAdmin = false;
  let myCoverageAreaIds: string[] = [];

  if (userId) {
    try {
      const hasCoverageRead = await hasPermission(orgId, userId, 'coverage.read');
      if (hasCoverageRead) {
        coverageAdmin = await hasPermission(orgId, userId, 'coverage.admin');
        const { data: assignRows } = await supabase
          .from('coverage_assignments')
          .select('id, coverage_area_id, assignee_role, assignee_user_id, weight, is_primary')
          .eq('org_id', orgId);
        const assignmentsRaw = (assignRows ?? []) as { id: string; coverage_area_id: string; assignee_role: string; assignee_user_id: string; weight: number; is_primary: boolean }[];
        coverageAssignments = assignmentsRaw.map((a) => ({
          id: a.id,
          coverage_area_id: a.coverage_area_id,
          assignee_role: a.assignee_role as 'sales_rep' | 'ops_manager',
          assignee_user_id: a.assignee_user_id,
          weight: a.weight,
          is_primary: a.is_primary,
        }));

        const areaIds = [...new Set(assignmentsRaw.map((a) => a.coverage_area_id))];
        let areasQ = supabase
          .from('coverage_areas')
          .select('id, org_id, name, type, geojson, parent_territory_id, active')
          .eq('org_id', orgId)
          .eq('active', true);
        if (!coverageAdmin && areaIds.length > 0) {
          areasQ = areasQ.in('id', areaIds);
        } else if (!coverageAdmin) {
          areasQ = areasQ.limit(0);
        }
        const { data: areaRows } = await areasQ;
        const areaList = (areaRows ?? []) as { id: string; org_id: string; name: string; type: string; geojson: unknown; parent_territory_id: string | null; active: boolean }[];
        const assignByArea = new Map<string, CoverageAssignment[]>();
        for (const a of coverageAssignments) {
          const list = assignByArea.get(a.coverage_area_id) ?? [];
          list.push(a);
          assignByArea.set(a.coverage_area_id, list);
        }
        coverageAreas = areaList.map((row) => ({
          id: row.id,
          org_id: row.org_id,
          name: row.name,
          type: row.type as 'polygon' | 'radius',
          geojson: row.geojson as GeoJSON.Geometry | GeoJSON.Feature,
          parent_territory_id: row.parent_territory_id,
          active: row.active,
          assignments: assignByArea.get(row.id) ?? [],
        }));
      }
    } catch {
      coverageAreas = [];
      coverageAssignments = [];
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: gapRows } = await supabase
    .from('shift_coverage')
    .select('id, account_id, facility_id, shift_date, start_time, end_time')
    .eq('org_id', orgId)
    .eq('shift_date', today)
    .eq('coverage_status', 'coverage_needed');
  const coverageGaps: { id: string; facility_id: string | null; lat: number; lng: number; account_name: string; start_time: string; end_time: string }[] = [];
  if (gapRows?.length) {
    const gapList = gapRows as Array<{ id: string; account_id: string; facility_id: string | null; start_time: string; end_time: string }>;
    const facilityIds = gapList.map((g) => g.facility_id).filter(Boolean) as string[];
    const accountIds = [...new Set(gapList.map((g) => g.account_id))];
    let coordsByFacility = new Map<string, { lat: number; lng: number }>();
    const accountNames = new Map<string, string>();
    if (facilityIds.length > 0) {
      const { data: facs } = await supabase.from('facilities').select('id, latitude, longitude').in('id', facilityIds);
      for (const f of facs ?? []) {
        const row = f as { id: string; latitude: number | null; longitude: number | null };
        if (row.latitude != null && row.longitude != null) coordsByFacility.set(row.id, { lat: row.latitude, lng: row.longitude });
      }
    }
    if (accountIds.length > 0) {
      const { data: accts } = await supabase.from('accounts').select('id, name').in('id', accountIds);
      for (const a of accts ?? []) accountNames.set((a as { id: string; name: string }).id, (a as { name: string }).name);
    }
    for (const g of gapList) {
      const coord = g.facility_id ? coordsByFacility.get(g.facility_id) : null;
      if (coord) {
        coverageGaps.push({
          id: g.id,
          facility_id: g.facility_id,
          lat: coord.lat,
          lng: coord.lng,
          account_name: accountNames.get(g.account_id) ?? '',
          start_time: g.start_time,
          end_time: g.end_time,
        });
      }
    }
  }

  return {
    accounts,
    quadrants,
    facilities,
    prospects,
    leads,
    accounts: accountsList,
    crews,
    franchisees,
    territories,
    serviceAreas,
    heatmapLeads,
    heatmapAccounts,
    coverageAreas,
    coverageAssignments,
    coverageAdmin,
    myCoverageAreaIds,
    verticals: verticalsList,
    coverageGaps,
  };
}
