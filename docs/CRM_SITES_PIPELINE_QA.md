# Janitorial CRM MVP (Sites + Pipeline) — QA Checklist

**Scope:** Sites = `public.locations` (UI uses word "Site"). No schema changes. No writes to `public.sites`. Ops/QC only link or read (except crew_assignments insert for Assign crew).

---

## Routes & files

| Route | Purpose |
|-------|--------|
| `/app/sites` | List sites (locations) with client, crew, last inspection, open issues; search + filters |
| `/app/sites/new` | Create site → insert into `locations` only |
| `/app/sites/[locationId]` | Site detail with tabs: Overview, Contacts, Walkthroughs, Bids, Ops, QC |
| `/app/sites/[locationId]/edit` | Edit site (LocationForm → update `locations`) |
| `/app/crm/pipeline` | Kanban opportunities by stage; cards show next activity due |

**Key files:**
- `src/app/app/sites/page.tsx` — sites list
- `src/app/app/sites/new/page.tsx` — new site page
- `src/app/app/sites/[id]/page.tsx` — site detail (tabs)
- `src/app/app/sites/[id]/edit/page.tsx` — edit site
- `src/app/app/crm/pipeline/page.tsx` — pipeline kanban
- `src/components/crm/sites-search-filter.tsx` — sites filters
- `src/components/crm/site-create-form.tsx` — create site form (locations only)
- `src/components/crm/site-detail-tabs.tsx` — Overview, Contacts, Walkthroughs, Bids, Ops, QC
- `src/actions/sites.ts` — `assignCrewToSite` (writes `crew_assignments`)

---

## Key queries

- **Sites list:** `locations` + `clients(name)`; then `crew_assignments`, `inspections`, `issues` by org, filter in memory by location id set.
- **Site detail:** Location by id; `crm_contacts` by `location_id` or `client_id`; `walkthroughs` by `location_id`; `bids` by `location_id` and by `opportunity_id` in opportunities for this location; `crew_assignments`, `schedules`, `inspections`, `issues` by `location_id` or `facility_id`.
- **Pipeline:** `opportunities` with `clients`, `locations`; `crm_activities` for next due per opportunity.

---

## QA: Full flow (exact clicks + expected DB rows)

1. **Create client**  
   - Go to **CRM** → **New Client** → fill name → submit.  
   - **Expected:** One row in `clients` with `org_id`.

2. **Create site**  
   - Go to **Sites** → **New Site** → select client, enter name, address, city, state, zip, square_footage, restroom_count, days_of_service, door_alarm_code, notes → **Create site**.  
   - **Expected:** One row in `locations` with `client_id`, `org_id`; **no** new rows in `public.sites`.

3. **Create opportunity**  
   - Go to **CRM** → open client → create opportunity (or use existing flow that sets `opportunity.location_id` and `opportunity.client_id`).  
   - **Expected:** One row in `opportunities` with `location_id` and `client_id`.

4. **Schedule walkthrough**  
   - From opportunity or walkthroughs flow, create/schedule a walkthrough for that opportunity/site.  
   - **Expected:** One row in `walkthroughs` with `location_id` (and `opportunity_id` if linked).

5. **Create bid**  
   - Create a bid linked to the opportunity (or site).  
   - **Expected:** One row in `bids` with `opportunity_id` (and optionally `location_id` if your schema has it).

6. **Assign crew**  
   - Go to **Sites** → open the site → **Ops** tab → select crew → **Assign crew**.  
   - **Expected:** One new row in `crew_assignments` with `org_id`, `crew_id`, `location_id`, `is_active = true`.

7. **View QC signals**  
   - Same site → **QC** tab.  
   - **Expected:** Read-only list of last inspections and open issues; **Start inspection** links to `/app/inspections/start?location={id}`; **View all issues** links to `/app/issues?location={id}`.

8. **Pipeline**  
   - Go to **Pipeline** (or **CRM** → Pipeline).  
   - **Expected:** Kanban columns by stage; opportunity cards show client, site, est. value, and next activity due (from `crm_activities`).

---

## Guardrails check

- No schema changes in this task.
- No writes to `public.sites`; all site creates/updates use `public.locations`.
- Inspections / issues / schedules: only read and link (no change to their logic); **Assign crew** is the only write (to `crew_assignments`).
- All queries scoped by `org_id`.
