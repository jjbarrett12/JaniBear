# Unified Maps — Test / Debugging Checklist

Use this checklist to verify RLS, permissions, and data flow for the unified map system.

---

## RLS and multi-tenancy

- [ ] **Org A cannot see Org B data**: Log in as user in Org A, call `GET /api/app/maps/entities` and `GET /api/app/maps/layers/sales` and `GET /api/app/maps/layers/ops`. Response must only include `orgId` for Org A and entities for Org A. Create `geo_entities` rows for Org B and confirm they never appear for Org A.
- [ ] **geo_entities RLS**: As org member, insert/update/delete only rows with your `org_id`. As different org member, cannot see or modify other org’s rows.
- [ ] **service_areas / service_area_assignments**: Same as above; no cross-org read/write.

---

## Permissions by role

- [ ] **Kodiak (Owner/Admin/Ops)**: Can open `/app/map`, see Sales and Ops modes, see all layers (leads, accounts, crews, service areas). Can call all map APIs (entities, layers/sales, layers/ops) with 200.
- [ ] **Grizzly (Sales)**: Can open `/app/map` and Sales mode. Has `maps.read`, `lead.read`, `lead.write`, `lead.import`, `accounts.read`. Can view sales map with leads; can view read-only account layer if enabled. Cannot see ops-only sensitive data if denied `ops.read`.
- [ ] **Cub (Crew)**: Has `maps.read` only. Can open `/app/map`. Ops map should restrict to assigned accounts/sites only (when Cub scoping is implemented in API/RLS). Sales map: no leads if no `lead.read`. Document current Cub behavior (e.g. “sees all org entities” until crew-scoped filter is added).
- [ ] **Super Admin / Site owner**: Can access Settings and Maps. No permission or entitlement denial. Can see all orgs’ map data when impersonating or when in scope.

---

## Lead Engine → geo_entities

- [ ] **Lead/prospect create**: When a prospect (or lead) is created with address/lat/lng, a corresponding `geo_entities` row is upserted (`entity_type='prospect'` or `'lead'`, `entity_id`, `label`, address, `lat`, `lng`, `source`). If using server action or API that creates prospect, it should call `upsertGeoEntityForProspect` after insert.
- [ ] **Re-running import**: Re-import or duplicate lead/prospect does not duplicate geo_entities rows; upsert on `(org_id, entity_type, entity_id)` updates existing row.
- [ ] **Null lat/lng**: Entities with null `lat`/`lng` are not returned by map APIs (filtered out). Map UI shows “needs geocode” or hides marker; no crash.

---

## Accounts / Facilities → geo_entities

- [ ] **Facility create/update**: When a facility (or account) is created/updated with address/lat/lng, `upsertGeoEntityForFacility` (or `upsertGeoEntityForAccount`) is called so ops map can show it from `geo_entities` or fallback to facilities table.
- [ ] **Assignments**: When crew/franchisee is assigned to a service area, `service_area_assignments` is updated and Ops map layer reflects it (assignments returned by `GET /api/app/maps/layers/ops`).

---

## Map UI and API

- [ ] **Single map system**: Only one map route is canonical: `/app/map`. `/app/territory-map` redirects to `/app/map`. `/app/ops/map` redirects to `/app/map`. No duplicate map UIs.
- [ ] **Map page permission**: User without `maps.read` hitting `/app/map` is redirected to `/app/forbidden` (or login/join-org if context error).
- [ ] **Sales map**: Leads (and optional accounts) load; clicking a lead opens lead drawer; filters (status, score, source) work when implemented.
- [ ] **Ops map**: Accounts/sites, crews, service areas load; clicking account opens account drawer; filters (service area, crew) work when implemented.
- [ ] **Performance**: Map loads with 500+ markers without freezing. If clustering or bbox pagination is added, verify it works. Otherwise confirm acceptable behavior with large datasets.

---

## Heatmap (Sales + Ops)

- [ ] **Heatmap toggle**: Sales mode — "Sales Heatmap" chip turns on/off lead-density heatmap; "Ops Heatmap" chip is disabled (tooltip: switch to Ops). Ops mode — "Ops Heatmap" chip turns on/off account-risk heatmap; "Sales Heatmap" chip is disabled.
- [ ] **Threshold**: Heatmap settings → threshold slider; only points with weight ≥ threshold appear. Changing threshold updates heatmap without reinitializing map.
- [ ] **Bounds filtering**: Pan/zoom map; heatmap updates to show only points in view (throttled). No performance regression when dragging.
- [ ] **Performance**: Heatmap renders smoothly with 500–2000 points in view; bounds updates debounced; no per-frame heavy work.
- [ ] **Permissions**: User without `lead.read` does not see lead data (Sales heatmap empty or restricted). User without `ops.read`/`accounts.read` does not see account heatmap data. Cubs: Sales heatmap blocked or empty as per lead visibility.

---

## Coverage (Sales + Ops splits)

- [ ] **10 reps splitting a territory**: Create one parent territory, multiple coverage_areas (splits) under it, assign up to 10 reps across those areas (multiple assignees per area). All assignments visible to admin; each rep sees only their assigned areas on map with “My Coverage”.
- [ ] **Rep visibility**: Rep (Grizzly) with coverage.read sees only coverage areas they are assigned to; map returns only those areas and assignments. Rep cannot see other reps’ coverage or edit.
- [ ] **Admin view**: User with coverage.admin sees all coverage areas and assignments; “All (admin)” and “By Rep (admin)” filters available in coverage dropdown. Can reassign and edit in Admin → Coverage.
- [ ] **Routing**: When a lead is created/imported with lat/lng, computeCoverageArea + pickAssignee (using territory_parameters routing) set lead.territory_id, coverage_area_id, assigned_user_id. lead_events action='routed' logged with meta (territory_id, coverage_area_id, assignee_user_id, routing_method). Deterministic for primary; round_robin/weighted behave as configured.
- [ ] **Coverage layer**: Map layer “Coverage” shows coverage area polygons; filter “My Coverage” highlights only current user’s areas; “All (admin)” shows all with dimming for non-mine.
- [ ] **Permissions**: coverage.read required to see any coverage data; coverage.write/coverage.admin required to create/update coverage_areas, coverage_assignments, territory_parameters. Routes under /app/admin/coverage require coverage.admin.

---

## Vertical-based coverage (Sales)

- [ ] **Verticals CRUD**: Admin → Coverage → Sales tab: "Verticals" list; add/edit/delete verticals (key, label). Only coverage.admin (or lead.admin) can manage. RLS: org-scoped.
- [ ] **Routing rules**: Sales tab: "Routing rules" list; add rule with name, priority, optional vertical/territory/coverage area, assignee, assignment_method (primary/round_robin/weighted/manual). Rules evaluated by priority (lowest first); first match assigns lead. Rule with vertical_id = "vertical split" (e.g. all healthcare to Rep A).
- [ ] **"All healthcare to Rep A"**: Create vertical "Healthcare", rule with vertical_id=Healthcare, assignee_user_id=Rep A, priority=10. Create/import lead with vertical_id=Healthcare (or matching criteria). routeLead() assigns to Rep A; lead_events action='routed' meta includes rule_id, reason, vertical_id. Works even when lead is inside same geography as other reps.
- [ ] **"Offices to Rep B"**: Rule with vertical_id=Offices, assignee=Rep B. Leads with vertical_id=Offices get Rep B.
- [ ] **Hybrid (territory + vertical)**: Rule with territory_id + vertical_id: only matches leads in that territory and that vertical. Territory split + vertical within territory both apply when routing_order = ['vertical_rules', 'coverage_area', 'territory', 'manual'].
- [ ] **Rule priority overrides geo**: When a vertical rule matches (e.g. priority 10), it wins over coverage_area-based assignment. When no rule matches, fall back to coverage_area then territory then manual.
- [ ] **Map: Vertical filter**: Sales mode, when verticals exist: "Vertical" chips (multi-select). Selecting one or more verticals filters lead markers to only those with matching vertical_id. Deselect all = show all leads.
- [ ] **Map: Show vertical ownership**: Toggle "Show vertical ownership" colors lead markers by vertical (palette). Only when Leads layer is on. Legend implied by chip colors.
- [ ] **Intel Drawer**: For a lead, show Vertical (label + confidence % + source). "Change vertical →" links to lead detail/edit. Override option (manual select) can be on lead page.
- [ ] **Permissions**: sales_routing_rules and verticals: coverage.admin or lead.admin can CRUD; reps can SELECT only (MVP: admin-only view). routeLead() runs server-side with org context.

---

## Rep capacity limits + fairness (routing guardrails)

- [ ] **Capacity settings**: Admin → Coverage → Sales tab: "Rep capacity" section. Enable/disable, max new/working per rep, overflow strategy (next_rep | overflow_rep | unassigned_queue), overflow rep picker. Save persists to sales_capacity_settings.
- [ ] **Rep counters**: Table shows each rep's new_count, working_count, qualified_count and effective max new/max working (org default or per-rep override). Counters update when leads are assigned or status changes (no full COUNT scans).
- [ ] **Rep A at 80 new**: When Rep A already has 80 new leads (max_new_leads_per_rep=80), next lead matching Rep A's rule/coverage does NOT assign to Rep A; routing picks next eligible rep or applies overflow.
- [ ] **Round-robin skips at-capacity**: With multiple assignees in a coverage area and round_robin method, at-capacity reps are excluded; assignee is chosen from eligible only.
- [ ] **Overflow next_rep**: When no eligible rep in the matched set, strategy next_rep broadens (e.g. other reps in territory); if still none, lead goes to unassigned_queue (overflow=true).
- [ ] **Overflow overflow_rep**: When overflow_strategy=overflow_rep and overflow_rep_user_id is set, overflow leads assign to that user; else unassigned_queue.
- [ ] **Overflow unassigned_queue**: lead.assigned_user_id=null, overflow=true, overflow_reason set; lead appears in Overflow Queue.
- [ ] **lead_events meta**: action='routed' meta includes candidateCount, eligibleCount, chosenUserId, overflow, overflowReason when applicable.
- [ ] **Counters after status change**: When lead status changes (e.g. new → contacted), rep_lead_counters: old assignee's new_count decremented, working_count incremented. Same for reassignment (decrement old assignee, increment new).
- [ ] **Overflow Queue view**: /app/sales/leads?overflow=true shows only leads with overflow=true. "Overflow Queue" button on main Leads page links there. No performance degradation (no expensive COUNT on each route).

---

## Data carry-over

- [ ] **Leads created/imported** → appear on Sales map (via geo_entities or prospects table fallback).
- [ ] **Accounts/facilities created/updated** → appear on Ops map.
- [ ] **Assignments updated** → Ops map reflects crew/franchisee overlays.
- [ ] **Lead → Account conversion** (when implemented): Creating account from lead and updating geo_entities (or creating new account geo row) ensures both Sales and Ops maps reflect the change.

---

## Optional

- [ ] **Map preferences**: `map_settings` (default_center, default_zoom, sales_layers, ops_layers) are read/written per org when implemented; RLS restricts to org.
- [ ] **POST /api/app/maps/geocode**: If implemented, geocode by entity_type/entity_id and update `geo_entities.lat`/`lng`; only for users with `maps.write` or appropriate role.

---

*Last updated: Lead Engine + Unified Maps implementation.*
