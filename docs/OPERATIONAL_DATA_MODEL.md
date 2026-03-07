# Operational Data Model — Canonical Model & Compatibility

## Canonical model (target)

| Concept | Table / source | Purpose |
|--------|----------------|---------|
| **Account** | `accounts` | Commercial customer; paying entity. |
| **Facility** | `facilities` | Operational service location (building/site) under an account. |
| **Launch handoff** | `launch_packets` | Preferred sales-to-ops handoff object (payload + status). |
| **Opportunity site** | `opportunities.facility_id` | Preferred anchor for which facility/site the deal is for; fallback: `location_id`. |

- **account** = commercial customer (sales “client” maps here for ops).
- **facility** = operational site/location; use for crew, schedules, inspections, issues.
- **launch_packet** = canonical handoff; use for activation and ops readiness.

## Temporary compatibility strategy

- **opportunities**: `facility_id` preferred; `location_id` remains for legacy. New code should set/read `facility_id` and use `getOperationalSiteId(opportunity)` for crew/schedule/inspection checks.
- **launch_plans**: `facility_id` added and preferred; `location_id` kept. Creation copies `opportunity.facility_id` when present.
- **Queries**: Operational tables (`crew_assignments`, `schedules`, `inspections`, `issues`) support both `location_id` and `facility_id`. Use `.or(\`location_id.eq.${id},facility_id.eq.${id}\`)` when the “site” id might be either (or use helper that returns one id).
- **UI**: Pipeline and launch/ops pages show facility name when `facility_id` is set, else location name. `/app/sites/[id]` resolves `id` as location first, then as facility, so links to facilities work.

## What remains for full Phase 2 / Phase 3

- **Phase 2**: Canonical client ↔ account mapping; consistently use `account` + `facility` in types and selectors; deprecate legacy location-based helpers; optional backfill of `opportunity.facility_id` from existing `location_id` where a facility can be inferred.
- **Phase 3**: Migrate remaining reads from `locations` to `facilities` where applicable; consider retiring `launch_plans` in favor of `launch_packets` once feature parity is reached.

## Schema changes (Phase 1)

- **122_operational_facility_anchor.sql**: Adds `opportunities.facility_id`, `launch_plans.facility_id` (FK to `facilities`), with indexes and comments. No columns dropped.

## Helpers

- **`getOperationalSiteId(record)`** — returns `facility_id ?? location_id` for use in queries.
- **`hasOperationalSite(record)`** — true if record has a facility or location.
- **`OPERATIONAL_SITE_LABEL`** — `"facility or location"` for UI/validation messages.

Location: `src/lib/ops/operational-site.ts`.

## Files still using legacy location assumptions

These still reference `location_id` and/or `locations`; prefer `facility_id` / `facilities` when touching them.

| File | Notes |
|------|--------|
| `src/actions/launch-plan.ts` | Updated to prefer `facility_id` and `getOperationalSiteId`; readiness and list use operational site. |
| `src/actions/walkthroughs.ts` | Uses `location_id` on walkthroughs; consider `facility_id` for new rows. |
| `src/actions/sites.ts` | Location-based; consider facility-aware helpers. |
| `src/app/app/sites/page.tsx` | Uses `location_id`/`facility_id` for crew/inspections/issues; already uses both. |
| `src/app/app/sites/[id]/page.tsx` | Resolves location or facility by id; opportunities query uses both. |
| `src/app/app/accounts/[id]/facilities/[facilityId]/page.tsx` | Launch plan query uses `facility_id` and `location_id`. |
| `src/app/app/crm/pipeline/page.tsx` | Selects and displays `facility_id` + `facilities`; shows facility name when set. |
| `src/app/ticket/[locationId]/page.tsx` | Uses `location_id` in body. |
| `src/app/api/map/data/route.ts` | Selects `location_id` for map; could add `facility_id`. |
| `src/components/inspections/inspection-view.tsx` | Uses `location_id`. |
| `src/components/admin/compliance-form.tsx` | Optional `location_id`. |
| `src/components/admin/invoice-list.tsx` | Type has `location_id`. |
| `src/lib/performance/recalculateOperatorScores.ts` | Uses `facility_id`. |
| `src/actions/alerts.ts` | Uses `facility_id` for schedules/inspections. |
| `src/lib/route-optimization.ts` | Uses `facility_id`. |
| `src/lib/workflow-engine.ts` | Uses `facility_id`. |
| `src/lib/ops-core/*` | Use `facility_id` (canonical). |

New code should prefer **account** + **facility** and use `getOperationalSiteId()` where a single site id is needed for legacy tables that have both columns.
