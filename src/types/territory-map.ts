import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

export const quadrantInsertSchema = z.object({
  org_id: z.string().uuid(),
  mode: z.enum(['ops', 'sales']),
  name: z.string().min(1, 'Name is required'),
  assigned_user_id: z.string().uuid().nullable().optional(),
  color: z.string().nullable().optional(),
  geojson: z.record(z.unknown()).refine((v) => v.type !== undefined, {
    message: 'geojson must be a valid GeoJSON object',
  }),
});

export const prospectInsertSchema = z.object({
  org_id: z.string().uuid(),
  quadrant_id: z.string().uuid().nullable().optional(),
  assigned_user_id: z.string().uuid().nullable().optional(),
  name: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  address1: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal: z.string().nullable().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  status: z
    .enum(['uncontacted', 'contacted', 'proposal_sent', 'closed_won', 'closed_lost'])
    .default('uncontacted'),
});

export const prospectUpdateSchema = prospectInsertSchema.partial().extend({
  id: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// TypeScript types
// ---------------------------------------------------------------------------

export type QuadrantInsert = z.infer<typeof quadrantInsertSchema>;
export type ProspectInsert = z.infer<typeof prospectInsertSchema>;
export type ProspectUpdate = z.infer<typeof prospectUpdateSchema>;

export type HealthStatus = 'green' | 'yellow' | 'red';

export type ProspectStatus =
  | 'uncontacted'
  | 'contacted'
  | 'proposal_sent'
  | 'closed_won'
  | 'closed_lost';

export type MapMode = 'ops' | 'sales';

export interface Quadrant {
  id: string;
  org_id: string;
  mode: MapMode;
  name: string;
  assigned_user_id: string | null;
  color: string | null;
  geojson: GeoJSON.Geometry | GeoJSON.Feature;
  created_at: string;
}

export interface Prospect {
  id: string;
  org_id: string;
  quadrant_id: string | null;
  assigned_user_id: string | null;
  name: string | null;
  industry: string | null;
  address1: string | null;
  city: string | null;
  state: string | null;
  postal: string | null;
  lat: number;
  lng: number;
  status: ProspectStatus;
  created_at: string;
}

export interface SiteHealth {
  site_id: string;
  org_id: string;
  health_status: HealthStatus;
  last_inspection_at: string | null;
  last_inspection_score: number | null;
  checklist_completion_7d: number | null;
  open_ticket_count: number;
  overdue_ticket_count: number;
  missed_shifts_7d: number;
  updated_at: string;
}

export interface FacilityWithHealth {
  id: string;
  org_id: string;
  account_id: string;
  name: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number;
  longitude: number;
  account_name: string;
  health_status: HealthStatus;
  last_inspection_at: string | null;
  last_inspection_score: number | null;
  checklist_completion_7d: number | null;
  /** From account_risk_snapshots when present. */
  account_risk_score?: number | null;
  account_risk_level?: 'low' | 'medium' | 'high' | 'critical' | null;
  open_ticket_count: number;
  overdue_ticket_count: number;
  missed_shifts_7d: number;
}

export interface AccountOption {
  id: string;
  name: string;
}

/** Unified map entity: one of lead, account, crew, franchisee, territory, service_area. */
export type MapEntityType = 'lead' | 'account' | 'crew' | 'franchisee' | 'territory' | 'service_area';

export interface MapEntity {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: MapEntityType;
  /** Extra for popups (e.g. lead: contact, score, status; account: assigned crew, last service). */
  meta?: Record<string, unknown>;
}

/** Polygon/GeoJSON layer for territories or service areas. */
export interface TerritoryPolygon {
  id: string;
  name: string;
  type: 'territory' | 'service_area';
  geojson: GeoJSON.Geometry | GeoJSON.Feature;
  color?: string | null;
  /** territory = transparent + border; service_area = light shaded */
  fillOpacity?: number;
}

/** Point with weight for Sales heatmap (lead density weighted by score + priority + status). */
export interface LeadPoint {
  id: string;
  lat: number;
  lng: number;
  score: number;
  priority: 'high' | 'normal' | 'low';
  status: string;
  /** Computed weight for heatmap (from weights.ts). */
  weight: number;
}

/** Point with weight for Ops heatmap (account risk: missed tasks / SLA / health). */
export interface AccountPoint {
  id: string;
  lat: number;
  lng: number;
  /** 0–100, higher = worse risk. */
  riskScore: number;
  /** Same as riskScore for heatmap intensity. */
  weight: number;
  /** From account_risk_snapshots when present (for Risk layer coloring). */
  risk_level?: 'low' | 'medium' | 'high' | 'critical' | null;
}

/** Coverage area (split of a territory); many assignees per area. */
export interface CoverageArea {
  id: string;
  org_id: string;
  name: string;
  type: 'polygon' | 'radius';
  geojson: GeoJSON.Geometry | GeoJSON.Feature;
  parent_territory_id: string | null;
  active: boolean;
  /** Assignments for this area (rep/ops manager ids and labels). */
  assignments?: CoverageAssignment[];
}

/** Assignment of a user to a coverage area. */
export interface CoverageAssignment {
  id: string;
  coverage_area_id: string;
  assignee_role: 'sales_rep' | 'ops_manager';
  assignee_user_id: string;
  assignee_label?: string;
  weight: number;
  is_primary: boolean;
}

export interface TerritoryMapPayload {
  accounts: AccountOption[];
  quadrants: Quadrant[];
  facilities: FacilityWithHealth[];
  prospects: Prospect[];
  /** Unified layers (all with id, name, lat, lng, type). */
  leads: MapEntity[];
  /** Account/customer pins (from facilities or accounts with coords). */
  accounts: MapEntity[];
  crews: MapEntity[];
  franchisees: MapEntity[];
  /** Polygons (quadrants + service_areas). */
  territories: TerritoryPolygon[];
  serviceAreas: TerritoryPolygon[];
  /** For heatmap: leads with score, priority, status, weight. */
  heatmapLeads: LeadPoint[];
  /** For heatmap: accounts/sites with riskScore, weight. */
  heatmapAccounts: AccountPoint[];
  /** Coverage areas (splits); visibility filtered by coverage.read + admin vs own. */
  coverageAreas: CoverageArea[];
  /** Flat list for filters; admins see all, reps see own. */
  coverageAssignments: CoverageAssignment[];
  /** True if current user can see all coverage (coverage.admin). */
  coverageAdmin?: boolean;
  /** Coverage area IDs the current user is assigned to (for "My Coverage" filter). */
  myCoverageAreaIds?: string[];
  /** Verticals for filter chip and legend (Sales). */
  verticals?: { id: string; key: string; label: string }[];
  /** Ops: shift coverage gaps (coverage_needed) for today with lat/lng for map markers. */
  coverageGaps?: { id: string; facility_id: string | null; lat: number; lng: number; account_name: string; start_time: string; end_time: string }[];
}
