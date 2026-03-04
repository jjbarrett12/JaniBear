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
  open_ticket_count: number;
  overdue_ticket_count: number;
  missed_shifts_7d: number;
}

export interface AccountOption {
  id: string;
  name: string;
}

export interface TerritoryMapPayload {
  accounts: AccountOption[];
  quadrants: Quadrant[];
  facilities: FacilityWithHealth[];
  prospects: Prospect[];
}
