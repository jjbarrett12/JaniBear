# Maps Unification — Lead Engine + Unified Maps (Sales + Ops)

## Plan of attack (completed)

### 1) Existing maps module (scan)

- **Routes**: `/app/map`, `/app/territory-map` (duplicate), `/app/ops/map` (redirects to `/app/map`).
- **API**: `GET /api/map/data` — returns franchisees (franchisor) or locations + crew_assignments (operator). **Not used** by the main map UI; the map uses server-side `getTerritoryMapData()` instead.
- **Data source**: `getTerritoryMapData()` in `src/lib/territory-map-data.ts` — queries `accounts`, `quadrants`, `facilities` (with lat/lng), `site_health`, `prospects` (with lat/lng), all by `org_id`. No permission check.
- **Map provider**: **Leaflet** (`react-leaflet`) with OSM tiles in `src/components/territory-map/MapCanvas.tsx`.
- **Components**: `TerritoryMapPage`, `MapCanvas`, `MapFilters`, `MapShell`, `SiteDrawer`, `ProspectDrawer`, `PinsListPanel`, `QuadrantDrawControls`, layer toggles, building intel.
- **Types**: `src/types/territory-map.ts`, `src/lib/sales/territory/types.ts`.
- **Nav**: Single “Map” under Executive in `navFactory.ts` → `/app/map`. Sales Command Center has a “Territory map” card linking to `/app/map`.
- **Org scoping**: Data is filtered by `org_id` in `getTerritoryMapData` and in RLS on `prospects`, `facilities`, `quadrants`, `site_health`. No `maps.read` or other map-specific permission.

### 2) Decision: **Refactor and extend (keep one system)**

- **Keep**: Leaflet + existing `TerritoryMapPage` / `MapCanvas` as the single map foundation. It already has Sales/Ops mode toggle, facilities + prospects, quadrants, and org-scoped data.
- **Add**: Canonical `geo_entities` table and optional sync from prospects/facilities so other modules (Lead Engine, future APIs) can consume one geo source. Unified Map API under `/api/app/maps/*` with `requirePermission(orgId, 'maps.read')` and optional layer-specific perms (`lead.read`, `ops.read`, `accounts.read`).
- **Remove**: Duplicate route `/app/territory-map` (redirect to `/app/map`). Old `/api/map/data` can remain for backward compatibility or be deprecated in favor of `/api/app/maps/entities` and layers.
- **Enforce**: Permission `maps.read` (and role-based `lead.read`, `ops.read`, `accounts.read`) on map page and all map APIs. RLS on new tables (`geo_entities`, `service_areas`, `service_area_assignments`, `map_settings`).

### 3) Where the new map foundation lives

| Piece | Location |
|-------|----------|
| **Single map UI** | `src/app/app/map/page.tsx` (canonical). Sales/Ops via mode toggle in `TerritoryMapPage`. |
| **Map component** | `src/components/territory-map/TerritoryMapPage.tsx` + `MapCanvas.tsx` (Leaflet). Refactored to be the “UnifiedMap” — same component, optionally fed by unified API or existing `getTerritoryMapData`. |
| **Unified Map API** | `src/app/api/app/maps/entities/route.ts`, `layers/sales/route.ts`, `layers/ops/route.ts`. All require `maps.read`; layers check `lead.read` / `ops.read` / `accounts.read`. |
| **Geo canonical store** | Table `geo_entities`; sync from prospects/facilities (and later leads/accounts) on create/update. |
| **Service areas / Ops** | Tables `service_areas`, `service_area_assignments`; used by Ops map layer. |
| **Permissions** | `maps.read`, `maps.write`, `lead.read`, `lead.write`, `lead.import`, `lead.admin`, `ops.read`, `ops.write`, `accounts.read`, `accounts.write` in `src/lib/auth/permissions.ts` and `role_permissions` (migration). |
| **Nav** | “Map” under Executive (existing). Optional “Maps” under Sales and Ops linking to `/app/map?mode=sales` and `/app/map?mode=ops` so one foundation, two entry points. |

### 4) What was deleted or deprecated

- **Deleted**: `/app/territory-map` as a separate route — redirect to `/app/map` to avoid two competing map pages.
- **Deprecated (optional)**: `GET /api/map/data` — legacy shape (franchisees / locations + crew_assignments). New code should use `/api/app/maps/entities` and `/api/app/maps/layers/sales` and `layers/ops`. If nothing else calls `/api/map/data`, it can be removed later.
- **Not duplicated**: No second map system. One Leaflet-based map, one set of APIs, one geo table.

### 5) Data flow (“carry data to each module”)

- **Prospects/leads**: On create/update, upsert `geo_entities` with `entity_type='lead'` (or `'prospect'` to match existing table). Sales map shows leads from `geo_entities` or directly from `prospects` (current) until full cutover.
- **Accounts/facilities**: On create/update, upsert `geo_entities` with `entity_type='account'` or `'site'`. Ops map shows accounts/sites from `geo_entities` or from existing `facilities` (current).
- **Service areas / assignments**: Stored in `service_areas` and `service_area_assignments`; Ops map layer reads them via `GET /api/app/maps/layers/ops`.
- **Lead → Account conversion**: When a lead is converted to an account, create or update `geo_entities` row from `lead` to `account` (or insert new account geo and mark lead as converted in `lead_events`).

---

*Last updated: implementation of Lead Engine + Unified Maps (Sales + Ops).*
