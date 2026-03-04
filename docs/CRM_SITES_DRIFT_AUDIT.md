# CRM Spine — Sites Drift Audit

**Date:** 2025-02-20  
**Goal:** Lock in `public.locations` as canonical facility; stop all new writes to `sites` and to `opportunities.site_id` / `walkthroughs.site_id`.

---

## 1. Code paths that INSERT or UPDATE `public.sites`

| File | What it does |
|------|----------------|
| `supabase/migrations/RUN_MANUAL_FOR_LIDAR.sql` | **Manual script only.** If `locations` exists, copies rows into `sites` via `INSERT INTO sites (...)`. Not used by app at runtime. |
| **No app code** in `src/` performs `.from('sites').insert()` or `.from('sites').update()**. | Create-facility flow uses `locations` (see walkthrough-form, location-form). |

**Conclusion:** No application code writes to `sites`. Only a one-off migration script can create `sites` rows. No changes required to “stop creating sites” in app—already true.

---

## 2. Code paths that write `opportunities.site_id` or `walkthroughs.site_id`

| File | What it does |
|------|----------------|
| `src/components/walkthroughs/walkthrough-form.tsx` | Creates client → **locations** (correct) → opportunity → walkthrough. **Bug:** Sets `site_id: site.id` on both opportunity (line 145) and walkthrough (line 168). Should set `location_id: site.id` and omit `site_id` (leave NULL). |
| `src/actions/walkthroughs.ts` | `createWalkthrough()` reads `site_id` from form and inserts into `walkthroughs` (line 36). Should read `location_id` and write `location_id` only; omit `site_id`. |

**Conclusion:** Two places to fix: walkthrough-form.tsx (opportunity + walkthrough inserts) and walkthroughs.ts (walkthrough insert).

---

## 3. Code paths that READ `sites` or `site_id` (for display fallback)

| File | What it does |
|------|----------------|
| `src/app/app/walkthroughs/page.tsx` | Selects `sites (name, address)`; displays `w.sites?.name \|\| w.sites?.address`. Need: also select `locations`; display `locations` first, fallback to `sites`. |
| `src/app/app/walkthroughs/[id]/page.tsx` | Selects `sites:locations (*)` (locations aliased as sites). For legacy rows with only `site_id`, need to also join `sites` and use fallback in UI. |
| `src/app/app/proposals/build/page.tsx` | Selects `sites (name, address)`; uses `w.sites?.name ?? scope?.site?.name`. Need: select `locations` + `sites`; prefer `locations`, then `sites`. |
| `src/actions/crm.ts` | `getOpportunityDetail()` fetches opportunity with `location_id` only; fetches location from `locations`. Need: if `location_id` is null and `site_id` present, fetch from `sites` for display only (optional, try/catch). |
| `scripts/backfill-crm-canonical.ts` | Reads `sites` and backfills `location_id` from `site_id`. Report only; no change for “stop the bleeding.” |

---

## 4. Facility create/update (already correct)

| File | What it does |
|------|----------------|
| `src/components/walkthroughs/walkthrough-form.tsx` | Creates facility via `.from('locations').insert(...)` (line 123). **Correct.** |
| `src/components/locations/location-form.tsx` | Inserts/updates `.from('locations')` only. **Correct.** |

---

## Summary

- **Writes to `sites`:** None in app; only manual migration script.
- **Writes to `opportunities.site_id` / `walkthroughs.site_id`:** walkthrough-form.tsx (2 inserts), walkthroughs.ts (1 insert). Fix: use `location_id` only, leave `site_id` null.
- **Reads:** Add location-first + sites fallback on walkthroughs list, walkthrough detail, proposals build; optional site fallback in getOpportunityDetail for legacy rows.

---

## QA checklist (after deploy)

1. **Create client** (CRM or walkthrough flow) — no `sites` rows created.
2. **Create location** (locations UI or walkthrough flow) — only `locations` insert; no `sites` insert.
3. **Create opportunity** — row has `location_id` set, `site_id` NULL (when created via walkthrough-form or any future CRM flow).
4. **Create walkthrough** — row has `location_id` set, `site_id` NULL.
5. **Create bid** — link via `opportunity_id` / `walkthrough_id`; no new `sites` rows.
6. **List walkthroughs** — display shows location name/address when `location_id` set; legacy rows with only `site_id` still show site name/address (read fallback).
7. **Opportunity detail** — when `location_id` is null and `site_id` is set, location display falls back to site (read-only).
8. **Verify** — After full flow (client → location → opportunity → walkthrough → bid), query `SELECT COUNT(*) FROM sites` and confirm count did not increase (or run backfill separately for existing data).
