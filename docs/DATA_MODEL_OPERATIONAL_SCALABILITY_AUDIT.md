# JANIBEAR — Data Model Operational Scalability Audit

**Date:** 2025-03-03  
**Role:** Senior SaaS architect, production debugger  
**Scope:** Schema, types, and routes for janitorial operational scalability. Brutally honest.

---

## Executive Summary

The platform **partially** distinguishes account vs site vs service, but **multiple concepts are collapsed or duplicated**. Two parallel customer/location models (sales: clients + locations/sites; ops: accounts + facilities) create fragility at scale. There is **no first-class service agreement** or **scope package** entity; schedules and crew assignments are facility-scoped but **one schedule row = one weekday + one crew**, so mixed frequencies and temporary changes are awkward. **Launch-to-ops uses both legacy `launch_plans` (location_id) and `launch_packets` (account_id)**, and critical code still queries the **`locations`** table, which may not exist after migrations. At **25+ accounts** and **multi-site** customers, reporting and handoff will be brittle; at **50+** and with **mixed frequencies / multiple crews / temporary changes**, the model will break without targeted changes.

**Scalability score (0–10): 4** — See Part 7.

---

## PART 1 — Real Schema, Types, and Routes

### 1.1 Core tables (simplified)

| Concept | Table(s) | Key FKs | Notes |
|--------|----------|---------|--------|
| **Org** | `organizations` | — | org_type, ownership_model |
| **Customer (sales)** | `clients` | org_id | 010; used by opportunities, crm_contacts, launch_plans |
| **Customer (ops)** | `accounts` | org_id | 037; billing, facilities, launch_packets, service_deployments |
| **Location (sales)** | `locations` or `sites` | org_id, client_id (sites) | 001 locations; 010 renamed to sites + client_id; 048 uses “locations” or “sites” |
| **Location (ops)** | `facilities` | org_id, account_id | 037; 1:many per account; crew_assignments, schedules, inspections, issues |
| **Service contract** | `service_contracts` | org_id, facility_id | 001/037; name + storage_path (PDF only); no structured terms |
| **Billing** | `recurring_billing_schedules` | org_id, account_id, facility_id (opt) | 046/087; frequency, amount; facility optional |
| **Crew** | `crews`, `crew_members` | org_id | 001 |
| **Crew assignment** | `crew_assignments` | org_id, crew_id, facility_id | 037; start_date, end_date, is_active |
| **Schedule** | `schedules` | org_id, facility_id, template_id, crew_id | 001/037; recurrence 'weekly', weekday 0–6; one row per day per facility |
| **Inspection** | `inspections` | org_id, facility_id, template_id, schedule_id (opt) | 001/037 |
| **Issue** | `issues` | org_id, facility_id | 001/037 |
| **Complaints** | `account_complaints` | org_id, account_id, facility_id (opt) | 103 |
| **Launch (legacy)** | `launch_plans` | org_id, opportunity_id, client_id, location_id (cond) | 050/087; location_id only if locations exists |
| **Launch (current)** | `launch_packets` | org_id, account_id | 054/087; payload_jsonb |
| **Opportunity** | `opportunities` | org_id, client_id, account_id (069), site_id/location_id (048) | 010/048/069; both client and account |
| **Work order** | `work_orders` | org_id, site_id (010), facility_id, account_id (087) | 010/087; has both site_id and facility_id |

### 1.2 Types and routes

- **Types:** `src/lib/types/database.ts` and feature types reference `account_id`, `facility_id`; work_orders use both `site_id` and `facility_id` in code (`src/lib/work-orders.ts`).
- **Routes:** App pages under `app/accounts`, `app/ops`, `app/sales`, `app/inspections`; APIs under `api/app/ops`, `api/app/risk`, etc. Command center and dashboard data join facilities → accounts and aggregate by account (`src/lib/command-center-data.ts`, `src/lib/risk/runAccountRisk.ts`).

### 1.3 Migration order dependency

- **001:** locations (flat “buildings/accounts”).
- **010:** clients, sites (locations renamed), opportunities (client_id, site_id), work_orders (site_id), shifts (site_id).
- **037:** accounts, facilities; _loc_fac_map; migration **reads `locations`** and creates one account + one facility per location; then service_contracts, crew_assignments, schedules, inspections, issues get facility_id and may drop location_id.
- **048:** Adds location_id to opportunities, walkthroughs, crm_activities, crm_contacts — **references “locations” or “sites”** (conditional).
- **069:** opportunities.account_id, leads.converted_account_id.
- **087:** launch_plans get location_id **only if table `locations` exists**; work_orders get facility_id, account_id; launch_packets use account_id only.

If 010 ran before 037, `locations` was renamed to `sites`, so 037’s migration loop over `locations` may run on an empty or missing table. So in some DBs we have **sites** (with client_id) and **facilities** (with account_id) as parallel concepts, and **launch_plans** and 048 logic may still expect **locations**.

---

## PART 2 — Where Account / Site / Service Are Collapsed

| Collapse | What exists | What’s missing / wrong |
|----------|-------------|-------------------------|
| **1. Customer vs account** | Two entities: `clients` (sales) and `accounts` (ops). Opportunities have both client_id and account_id; no formal sync. | Single source of truth for “customer.” Multi-site customer = one client with many sites vs one account with many facilities; conversion and reporting must reconcile both. |
| **2. Service location** | Sales: locations/sites (client_id). Ops: facilities (account_id). 048/049 index on location_id. | No single “service location” ID used everywhere. Code and migrations conditionally use locations vs sites vs facilities; launch_plans and launch-plan.ts use location_id and query `locations`. |
| **3. Service agreement** | `service_contracts`: facility_id + PDF path only. `recurring_billing_schedules`: account_id, optional facility_id, frequency, amount. | No agreement entity with: effective dates, scope reference, frequency per facility, versioning. Billing exists; “what we clean and how often” is in facilities.service_frequency_per_week (108) and schedules (one row per weekday). |
| **4. Service line / scope package** | `scope_models` (walkthrough_id, extracted_json); proposals (JSON); facilities have service_days, service_frequency_per_week (108). | No reusable “scope package” or “service line” table linked to facility or agreement. Scope is walkthrough/proposal-bound; no facility-level scope with line items. |
| **5. Crew assignment** | `crew_assignments` (crew_id, facility_id, start_date, end_date, is_active). `schedules` (facility_id, crew_id, weekday). | Multiple crews per facility over time: OK. “Temporary” override (e.g. different crew for one week) requires editing schedule or many rows; no override/exception table. |
| **6. Inspection program** | Inspections → facility_id, template_id, schedule_id. Schedules link template to facility + crew + weekday. | No explicit “inspection program” (e.g. “QC every 2 weeks at facility X”). Program is implicit in schedule + template. |
| **7. Service completion / event history** | `task_completions` (task_assignment_id); `inspections` (completed_at, total_score); work_orders (completed_at). | No single “service_visit” or “service_event” (e.g. “crew X serviced facility Y on date Z”). Completion is fragmented across task_completions, inspections, work_orders. |
| **8. Complaint / issue history** | `issues` (facility_id, inspection_id); `account_complaints` (account_id, facility_id). | Adequate for facility- and account-level complaints. |
| **9. Launch-to-ops** | **Two systems:** `launch_plans` (opportunity_id, client_id, location_id) and `launch_packets` (account_id, payload_jsonb). | launch_plans rely on `locations` table; `src/actions/launch-plan.ts` queries `from('locations')` and uses location_id for crew_assignments/schedules. If locations was dropped, this breaks. No single handoff entity that is account + facility-aware. |
| **10. Franchise/operator ownership** | organizations.org_type; franchise_relationships; RLS. | Account/facility do not carry franchisor_org_id or operator_org_id; ownership is org-level. |

---

## PART 3 — Where This Breaks (Scheduling, Inspections, Financials, Crew, Complaints)

| Scenario | What breaks | Root cause |
|----------|-------------|------------|
| **25+ accounts** | List/aggregate queries without strict limits or pagination; dashboard and command center may pull large sets. | Many queries use .limit(5000) or no limit (e.g. facilities, inspections); no cursor/keyset pagination. |
| **50+ accounts** | Same; report and KPI queries (e.g. inspections by account, risk by account) multiply. | command-center-data and risk libs load facilities + inspections; no materialized views or reporting tables. |
| **Multi-site customer** | Sales: one client, many sites. Ops: one account, many facilities. Opportunity has one location_id/site_id — so “one deal per site” or one deal with one site. Ambiguity in pipeline and handoff. | No account_id or facility_ids on opportunity; opportunity ↔ account link (069) is 1:1; no explicit “multi-site opportunity” or facility list on opportunity. |
| **Mixed service frequencies** | Per facility: facilities.service_frequency_per_week (1x–7x) and service_days[]. Schedules: one row per weekday. 5x/week = 5 schedule rows. | Works per facility. But no “service agreement” that says “Building A 5x, B 2x” with one effective record; mixed is implicit in many schedule rows. |
| **Multiple crews per account** | crew_assignments: multiple rows per facility (different crews, date ranges). schedules: one crew_id per row. | Different weekdays can have different crews (multiple schedule rows). Reassigning “all Mondays to Crew B” is update; “Crew B this week only” has no override model. |
| **Temporary service changes** | No effective_from/effective_to on schedule; no “override” or “exception” table for “next 2 weeks use Crew B” or “skip Thursday.” | Schedule is current state only; history is not modeled for temporary changes. |
| **Customer-requested crew change** | Can update crew_assignments or schedules. | No “requested_by_customer” or “change_reason” or audit that ties to customer request. |
| **Add-on work** | work_orders have source (e.g. 'inspection','manual'); no link to “add-on scope” or one-off line item on an agreement. | Add-on is just a work order; no link to agreement or scope package. |
| **Franchise/operator splits** | Account belongs to one org (operator). Franchisor sees outcomes, not labor; RLS uses org_id. | No account.franchisor_org_id; franchise visibility is via franchise_relationships and org, not per-account. |
| **Launch handoff** | getLaunchPlansForOpsList and crew/schedule checks use **locations** and **location_id**. If locations table was dropped (post-037), query fails or returns nothing. | `src/actions/launch-plan.ts` lines 76–77: `from('locations').select('id, name').in('id', locationIds)`. Same file uses .or(`location_id.eq.${locationId},facility_id.eq.${locationId}`) for crew_assignments/schedules — so facility_id branch works, but location fetch does not. |

---

## PART 4 — Corrected Target Model (Scalable)

### 4.1 Hierarchy (canonical)

1. **Organization** (unchanged) — org_type, franchise relationships.
2. **Account** — Single customer entity (merge client + account concept for ops; or keep client for sales and add account_id on client as “ops account”).
3. **Facility** — Service location; belongs to one account; org_id, account_id. (Deprecate locations/sites for ops; use facility everywhere.)
4. **Service agreement** — New entity: account_id (or facility_id), effective_from, effective_to, status, scope_package_id (optional), billing_schedule_id (optional). Replaces “contract = PDF” with a first-class agreement that can have lines.
5. **Scope package** — New (optional): org_id, name, scope_lines (JSONB or child table). Linked from service_agreement or proposal. Enables “same scope at 3 facilities.”
6. **Service line** — Optional child of service_agreement or scope_package: description, frequency, quantity, etc.
7. **Crew assignment** — Keep; facility_id, crew_id, start_date, end_date; add optional agreement_id or “role” (primary, backup).
8. **Schedule** — Keep facility_id, template_id, crew_id, weekday; add optional effective_from/effective_to for temporary overrides; or add **schedule_overrides** (facility_id, schedule_id, override_date, crew_id) for one-off changes.
9. **Inspection program** — Optional: facility_id, template_id, frequency_days, next_due; or keep implicit via schedules.
10. **Service visit** — New (recommended): facility_id, visit_date, crew_id, status, completed_at, source (schedule, add_on, complaint). Single place for “who serviced where when.”
11. **Complaint / issue** — Keep issues (facility_id), account_complaints (account_id, facility_id).
12. **Launch** — Single handoff: **launch_packets** only; account_id + facility_ids (array or link table). Deprecate launch_plans or migrate them to launch_packets and stop using location_id.
13. **Franchise/operator** — Keep org-level; optional account.franchisor_org_id if franchisor “owns” the customer relationship.

### 4.2 Unification

- **Customer:** Use **account** as the single ops customer. Either (a) merge client into account and use account_id on opportunities, or (b) keep clients for sales and add client.ops_account_id → accounts.id and always set it on conversion.
- **Location:** Use **facility** everywhere for ops (schedules, crew_assignments, inspections, issues, work_orders). Drop dependency on `locations` in launch-plan and 048-style logic; add facility_id to opportunities and launch_plans (or retire launch_plans).
- **Agreement:** Introduce **service_agreements** (and optionally scope_packages) so that “what we clean, how often, for how long” is queryable and not only in PDFs or schedule rows.

---

## PART 5 — Minimum Migration Path (Current → Scalable)

### Phase 1 — Stop the bleeding (no new tables)

1. **Launch plans and locations**
   - **Problem:** `launch-plan.ts` and launch_plans table use location_id and query `locations`, which may not exist.
   - **Fix:** In `src/actions/launch-plan.ts`, resolve “location” from opportunity: if opportunities have account_id, join to facilities and use facility_id for crew_assignments/schedules. Stop querying `locations`; use `facilities` and opportunity.account_id → facilities.account_id. Add launch_plans.facility_id (or account_id) and backfill from opportunity.account_id / first facility.
   - **Files:** `src/actions/launch-plan.ts`; new migration: add `launch_plans.facility_id` and `launch_plans.account_id` (nullable), backfill from opportunities; optionally add index.

2. **Opportunity ↔ facility**
   - Add opportunity.facility_id (nullable) and set it on conversion when creating/linking to a facility. Use facility_id (not location_id) for downstream ops. Migration: add column; backfill from existing opportunity location_id/site_id if a mapping to facility exists (_loc_fac_map or sites → facilities by address/name).

3. **Work orders**
   - Code already has facility_id and account_id (087). Prefer facility_id for filtering; treat site_id as legacy and stop writing it in new code.

### Phase 2 — Unify customer and location in code

4. **Single “service location” in app**
   - All ops UI and APIs that today accept or display “location” or “site” should use **facility** (and facility_id). Deprecate locations/sites in ops paths; keep only for legacy sales if needed.
   - **Files:** Any component or API that reads/writes location_id for ops (launch-plan, work_orders, schedules, inspections) should use facility_id and facilities table.

5. **Client ↔ account sync**
   - On lead conversion, create or link account and set opportunity.account_id. Optionally add client.ops_account_id and keep it in sync when account is created from that client. Use account as source of truth for “customer” in ops and reporting.

### Phase 3 — Add scalable entities (optional but recommended)

6. **Service agreement table**
   - New table: service_agreements (id, org_id, account_id, facility_id (nullable), effective_from, effective_to, status, scope_snapshot_jsonb, created_at, updated_at). Link recurring_billing_schedules to it if needed. Migrate “contract” from “PDF only” to “agreement + optional PDF path.”

7. **Service visit / event**
   - New table: service_visits (id, org_id, facility_id, crew_id, visit_date, status, completed_at, source, created_at). Populate from task_completions (if schedule_id → facility), inspections (facility_id, completed_at), and work_orders. Enables “service history” and “last serviced” without scanning three tables.

8. **Schedule overrides**
   - New table: schedule_overrides (id, schedule_id or facility_id, override_date, crew_id, reason). Optional; supports “Crew B on this date only” without changing the base schedule.

9. **Launch: one system**
   - Migrate launch_plans data to launch_packets (one packet per opportunity/account); add launch_packets.facility_ids (array or junction). Deprecate launch_plans and remove location_id from launch-plan.ts.

---

## PART 6 — Exact Files and Tables to Change

### 6.1 Schema (migrations)

| Change | Table / object | Action |
|--------|----------------|--------|
| Launch plans use facility | launch_plans | ADD COLUMN facility_id UUID REFERENCES facilities(id); ADD COLUMN account_id UUID REFERENCES accounts(id); backfill from opportunities (account_id, then first facility). |
| Opportunity facility | opportunities | ADD COLUMN facility_id UUID REFERENCES facilities(id); backfill from location_id/site_id if mapping exists. |
| (Phase 3) Service agreement | — | CREATE TABLE service_agreements (...). |
| (Phase 3) Service visit | — | CREATE TABLE service_visits (...). |
| (Phase 3) Schedule override | — | CREATE TABLE schedule_overrides (...). |

### 6.2 Code (file-level)

| File | What to change |
|------|----------------|
| `src/actions/launch-plan.ts` | Replace `from('locations')` with resolution via opportunity.account_id → facilities. Use facility_id (and account_id) for crew_assignments and schedules. Add fallback when location_id exists (e.g. map to facility via _loc_fac_map or drop). |
| `src/lib/work-orders.ts` | Prefer facility_id; document site_id as legacy; ensure create/update always set facility_id when available. |
| `src/lib/command-center-data.ts` | Already uses facilities + account_id; add pagination or hard limits if missing. |
| `src/lib/risk/runAccountRisk.ts` | Already account/facility based; ensure no N+1 when loading many accounts. |
| Any API or page that lists “locations” for ops | Switch to facilities and account_id; remove references to locations table in ops paths. |
| Types | `src/lib/types/database.ts`, feature types: ensure opportunity has facility_id; launch_plan has facility_id/account_id where used. |

### 6.3 Routes / pages

- **app/accounts**, **app/ops**, **app/sales**: Ensure list and detail pages use account_id and facility_id; avoid relying on location_id for ops behavior.
- **Launch intake / launch packet pages**: Use launch_packets and account + facilities only; do not depend on launch_plans.location_id or locations table.

---

## PART 7 — Scalability Rating (0–10)

| Criterion | Score | Note |
|-----------|-------|------|
| Customer/account clarity | 3 | Two concepts (client vs account); no single source of truth; sync fragile. |
| Service location clarity | 3 | locations/sites vs facilities; launch_plans and code still use locations. |
| Service agreement | 2 | No agreement entity; contract = PDF; frequency in facility + many schedule rows. |
| Service line / scope | 3 | Scope in walkthrough/proposal JSON only; no facility-level scope package. |
| Crew assignment | 6 | crew_assignments + schedules support multiple crews; no overrides. |
| Inspection program | 5 | Implicit in schedule + template; works but not explicit. |
| Service completion history | 4 | Fragmented (task_completions, inspections, work_orders); no single visit table. |
| Complaint history | 6 | issues + account_complaints; adequate. |
| Launch-to-ops | 3 | Two systems; launch_plans depend on locations table; code will break. |
| Franchise/operator | 6 | Org-level; RLS; no per-account franchise field. |
| **Overall scalability** | **4** | Model works for small ops; at 25+ accounts and multi-site/mixed frequency/multiple crews it will break without Phase 1–2 fixes. |

---

## Implemented Fix (Post-Audit)

- **Launch-plan resilience:** `src/actions/launch-plan.ts` no longer depends only on the `locations` table. It now: (1) tries `locations` for name resolution; (2) falls back to `facilities` when the id list is treated as facility ids; (3) resolves facility names via `opportunity -> account -> facilities` and uses those facility ids for crew/schedule/inspection checks when `location_id` is missing. Location name display uses the first facility name from the opportunity’s account when `location_id` has no mapping. This prevents runtime failure when `locations` is missing or empty (e.g. after 037 migration).

---

## Summary

- **Account vs site vs service:** Partially separated (accounts + facilities) but **sales still uses clients + locations/sites** and **launch_plans + launch-plan.ts rely on the locations table**, which may not exist.
- **Service agreement and scope:** Largely **collapsed** into PDFs, facility fields, and many schedule rows; **no first-class agreement or scope package**.
- **Scheduling / inspections / financials / crew / complaints:** **Scheduling and inspections** work per facility but **temporary changes and clear “service completion” history** are weak. **Financials** use recurring_billing_schedules (account/facility). **Complaints** are OK. **Crew** is OK except overrides.
- **Recommended next steps:** Implement **Phase 1** (launch_plan + locations fix, opportunity.facility_id, work_orders prefer facility_id) and **Phase 2** (use facility everywhere in ops, client–account sync). Then consider **Phase 3** (service_agreements, service_visits, schedule_overrides, single launch system) for 50+ accounts and multi-site/mixed-frequency/multi-crew scenarios.

---

*End of audit. Findings based on migrations 001–114 and code in `src/` as of audit date.*
