# JANIBEAR — Full Repo Restoration Brief & Domain Language Cleanup Plan

**Purpose:** Restore development context on a new machine; align domain language to a canonical business lifecycle; fix access control confusion.  
**Date:** 2025-03-07.

---

## 1. Product Architecture Summary

### 1.1 Modules

| Module | Purpose | Key routes | Key libs |
|--------|--------|------------|----------|
| **Sales (Grizzly)** | Leads, pipeline, walkthroughs, proposals | `/app/sales/*`, `/app/crm/*` | `actions/leads.ts`, `actions/crm.ts`, `lib/sales/*` |
| **Operations (Kodiak)** | Active accounts, crews, schedules, inspections, risk, launch intake | `/app/ops/*` | `lib/ops/*`, `lib/ops-core/*`, `lib/is-premium.ts` |
| **Accounts & facilities** | Customer entities and service addresses | `/app/accounts/*`, `/app/sites`, `/app/locations` | `actions/accounts.ts`, `actions/sites.ts` |
| **Launch to Ops** | Handoff from sales to operations | `/app/ops/launch-intake`, `/app/sales/launch-packets` | `actions/launch-plan.ts`, `actions/launch-packet.ts` |
| **Walkthroughs / LiDAR** | Site capture, scans, scope | `/app/walkthroughs/*`, `/app/sales/walkthroughs` | `lib/prop/*`, storage `walkthrough-scans` |
| **Proposals / Bids** | Proposals and bidding | `/app/bids/*`, `/app/proposals/build` | Scope extraction, `scope_models` |
| **Inspections / QC** | Inspections, issues, templates | `/app/inspections/*`, `/app/ops/inspections`, `/app/issues/*` | Templates, inspection_* tables |
| **Maps / Territory** | Map view, layers, entities | `/app/map`, `/app/territory-map` | `lib/territory-map-data.ts`, `api/app/maps/*` |
| **Dashboards / KPIs** | Executive, KPIs, financial health | `/app/dashboard`, `/app/kpis`, `/app/financial-health`, `/app/executive` | `lib/dashboard-data.ts`, `lib/command-center-data.ts` |
| **AI onboarding / import** | Spreadsheet import, migration | `/onboarding/import/*` | `lib/onboarding-import/*`, `api/onboarding/import/*` |
| **Franchise / multi-tenant** | Shell-based UX, franchisor vs operator | `/app/franchise/*`, `/franchisor/*` | `lib/shell.ts`, `lib/org-type.ts`, `lib/nav/navFactory.ts` |

### 1.2 Route Structure (High Level)

- **Marketing:** `(marketing)/` — page, about, contact, demo, pricing, why-janibear.
- **Auth:** `auth/*` — login, signup, callback, continue, forgot-password.
- **Onboarding:** `onboarding/*`, `onboarding/import/*`.
- **App:** `app/` — dashboard, financial-health, kpis, map, alerts, benchmarks; **accounts** (`/app/accounts`, `/app/accounts/[id]`, `/app/accounts/[id]/facilities/*`); **sites** (`/app/sites`, `/app/sites/[id]`, `/app/sites/new`, `/app/sites/[id]/edit`); **locations** (`/app/locations`, `/app/locations/[id]`, etc. — some redirect to accounts); **sales**, **crm**, **ops**, **walkthroughs**, **bids**, **inspections**, **issues**, **admin**, **settings**, **university**, **pro-gear**, **franchise**.
- **Platform:** `platform/*` — console, orgs.
- **Franchisor:** `franchisor/*`.

### 1.3 Nav Structure

- **Source of truth:** `src/lib/nav/navFactory.ts` (sections) + `src/lib/nav/shellNav.ts` (shell → orgType).
- **Sections (operator/franchisee):** Executive → Sales → Launch → Operations → System.
- **Key nav labels (app-translations):** `navLocations: 'Sites'`, `navAccounts: 'Accounts'`, `navAccountsActive: 'Accounts (Active)'`, `navAccountsProspects: 'Accounts (Prospects)'`, `navAccountsAtRisk: 'Accounts at Risk'`.
- **Ops section:** Links to `/app/ops/accounts`, `/app/sites` (label “Sites”), `/app/ops/crews`, schedules, inspections, etc.
- **Franchisor:** Separate section (placement board, listings, KPIs, benchmarks); no labor/sites as primary nav.

### 1.4 Data Model (Canonical Spine)

- **Organizations** — `org_id` on all tenant data; `org_type` (operator | franchisor), `ownership_model` (independent | unit_franchisee | area_franchisor), `shell` (owner_operator | franchisee | franchisor). **Owner roles to support:** Owner - Independent (shell owner_operator), Owner - Area Franchisor (shell franchisor), Owner - Unit Franchisee (shell franchisee).
- **CRM / lifecycle:** **Leads** → **Opportunities** → **Walkthroughs** → **Proposals/Bids**. Won deals → **Accounts** (commercial relationship) + **Facilities** (physical service location). One account can have many facilities.
- **Tables in use:** `accounts`, `facilities` (037); many FKs use `account_id`, `facility_id`. **Legacy:** `locations` table may still exist in some DBs (001, 048); migration 037 created accounts/facilities from locations and added `facility_id` to schedules, inspections, issues, crew_assignments, etc. `locations` was dropped only if no dependencies remained.
- **Sales:** `leads`, `opportunities`, `clients` (048: clients → locations → opportunities → walkthroughs → bids). Post-037, “locations” in CRM may be backed by facilities or legacy locations depending on migration order.
- **Launch:** `launch_plans` (per opportunity), `launch_packets` (per account, payload_jsonb).

### 1.5 Role / Permission Model

- **Legacy:** `org_members.role` (owner, admin, manager, sales, ops, inspector, client_viewer, …) → `role_permissions` (permission_key). RPC `has_permission(p_org_id, p_permission_key)` (114) delegates to `has_org_permission` (gov + legacy).
- **Governance (114):** `gov_roles`, `gov_permissions`, `gov_role_permissions`, `gov_member_roles`, `gov_member_permissions`, view `member_effective_permissions`. Not all org_members have gov_member_roles populated; legacy role_permissions still drive many checks.
- **App:** `requirePermission({ orgId, userId, permission })` in pages/actions; `hasPermissionCached` → RPC. **Site admin** (`isSiteAdmin(userId)`) bypasses all permission checks. **Platform admin** (`getIsPlatformAdmin(userId)`) gets plan bypass (e.g. Kodiak for ops).

### 1.6 Plan / Feature Gating Model

- **Plans:** `org_subscriptions.plan_code` (canonical) with fallback to `organizations.plan`. Values: cub, grizzly, kodiak. `getPlanType(orgId, userId)` — platform admin → kodiak.
- **Gates:** `isPremiumPlan` = Grizzly or Kodiak; `isOperationsEnabled` = same (used by **Ops layout**). Cub = no access to `/app/ops/*` (layout shows upgrade screen before any permission check).
- **Add-ons:** `org_features` (org_id, feature_key, enabled); `features`, `plan_features` (046, 043). Feature gates in API via `requireFeature()` / module checks.

---

## 2. Current Domain Language Audit

### 2.1 Where “Account(s)” Is Used

- **UI/nav:** “Accounts”, “Accounts (Active)”, “Accounts (Prospects)”, “Accounts at Risk”. Routes: `/app/accounts`, `/app/ops/accounts` (redirects to `/app/accounts`), `/app/sales/accounts`.
- **Components:** Many under `components/accounts/` (account-detail-tabs, account-edit-form, account-lifecycle-ribbon, account-onboarding-form, account-sales-tabs, account-team-tab, facility-form, etc.). CRM: account-detail-drawer, accounts-table, accounts-filter-bar.
- **DB/tables:** `accounts` table (org_id, name, status, billing_*, contract_value_monthly). `account_id` on facilities, launch_packets, service_deployments, account_users, etc.
- **Actions/API:** `actions/accounts.ts`, `actions/account-assignment.ts`, `actions/account-users.ts`; API routes under `api/app/risk/accounts/`, etc.
- **Copy:** Dashboard, KPIs, risk, launch, and sales flows refer to “account” as the customer/contract entity. Generally consistent.

### 2.2 Where “Site(s)” Is Used

- **UI/nav:** Nav label **“Sites”** (`navLocations: 'Sites'`) for the link that goes to `/app/sites`. So one nav item is literally “Sites” but the URL can also be `/app/locations` (redirects).
- **Routes:** `/app/sites`, `/app/sites/new`, `/app/sites/[id]`, `/app/sites/[id]/edit` — full CRUD surface. `src/app/app/sites/page.tsx` lists “sites” (backed by locations or facilities depending on code path).
- **Components:** `components/site/Footer.tsx`, `components/crm/site-create-form.tsx`, `components/crm/site-detail-tabs.tsx`, `components/financial-health/site-profitability-table.tsx`, `components/financial-health/site-finance-drawer.tsx`, `components/territory-map/SiteDrawer.tsx`, `components/crm/sites-search-filter.tsx`.
- **Lib:** `lib/auth/siteAdmin.ts` (different concept: “site admin” as super-user), `lib/ops/operational-site.ts`, `lib/routes.ts` (sites: () => '/app/sites', site: (id) => `/app/sites/${id}`).
- **DB:** Some migrations or legacy code still reference `sites` table; 048/037 and SITE_LOCATION_ALIAS doc say canonical facility is `locations` (or post-037, account+facility). So “site” in UI often maps to location or facility.

### 2.3 Where “Location(s)” Is Used

- **UI/nav:** “Locations” appears in some copy; nav has `navLocations` but label is “Sites” in EN. So user-facing “Locations” is partly internal.
- **Routes:** `/app/locations`, `/app/locations/[id]`, `/app/locations/[id]/edit`, `/app/locations/new` — some redirect to `/app/accounts` or to account/facility URLs (e.g. locations/[id]/edit → accounts/${facility.account_id}/facilities/${id}/edit).
- **Components:** `components/locations/locations-list-with-filter.tsx`, `components/locations/location-form.tsx` — form pushes to `/app/sites` or similar.
- **DB:** Table `locations` in 001 (and possibly still present if 037 didn’t drop it). Columns like `location_id` on inspections, schedules, etc., with migration to `facility_id` in 037. CRM chain (048) links opportunities/walkthroughs to `location_id` (locations table).
- **API:** `api/map/data/route.ts`, `api/public/locations/[id]/route.ts` — “locations” as data concept. Ticket URL: `/ticket/[locationId]`.

### 2.4 Overlap and Conflict

| Concept | Tables | Routes | Nav label | Conflict |
|--------|--------|--------|-----------|----------|
| Customer / contract entity | `accounts` | `/app/accounts` | “Accounts” | Clear. |
| Physical service place | `facilities` (post-037), sometimes `locations` | `/app/sites`, `/app/locations`, `/app/accounts/…/facilities/…` | “Sites” for one link; “Locations” in places | **Same concept, three names and multiple URLs.** |
| List of “places” | facilities or locations | `/app/sites` (list), `/app/locations` (redirects to accounts), `/app/accounts` (account list) | “Sites” vs “Accounts” | **Sites page lists locations/facilities; Accounts page lists accounts. So “Sites” = list of service addresses; “Accounts” = list of customers.** |

- **SITE_LOCATION_ALIAS.md** says: canonical entity `locations`; UI uses “Site(s)” for that. But 037 introduced **accounts + facilities** and migrated locations → one account + one facility per location. So in DBs that ran 037, the canonical “place” is **facility**; “location” may be legacy or alias.
- **Result:** “Account” is consistently the customer/contract. “Site” and “location” and “facility” are used inconsistently for “place we clean” — sometimes same row (facility), sometimes legacy location, sometimes UI-only “site” label.

### 2.5 Tables / Routes / Components Using Inconsistent Terminology

- **Routes:** Both `/app/sites` and `/app/locations` exist; `/app/locations` often redirects to `/app/accounts`. So “locations” and “sites” and “accounts” are all entry points.
- **Components:** `site-detail-tabs`, `site-create-form`, `site-finance-drawer`, `SiteDrawer` vs `location-form`, `locations-list-with-filter` vs `account-detail-tabs`, `facility-form` — mix of site, location, account, facility.
- **Actions:** `actions/sites.ts` (revalidatePath `/app/sites`); `actions/accounts.ts` (revalidatePath `/app/accounts`). Data reads may hit `locations` or `facilities` depending on code path.
- **Nav:** One item is “Sites” (navLocations) linking to `/app/sites`; another is “Accounts (Active)” linking to `/app/ops/accounts` (then redirect to `/app/accounts`). So “Sites” and “Accounts” are both in nav with different semantics (addresses vs customers) but overlapping in practice (accounts have facilities; sites list may show facilities/locations).

---

## 3. Canonical Domain Model Proposal

### 3.1 Recommended Object Hierarchy (Lifecycle + Structure)

**Lifecycle (sales → ops):**

1. **Leads** — prospect, not yet opportunity.
2. **Walkthroughs** — site visit / capture (can link to opportunity or lead).
3. **Proposals** — sent to lead/opportunity; may link to walkthrough.
4. **Accounts** — won customer; commercial relationship (billing, contract). *Preferred UI term: “Account”.*
5. **Active Accounts** — accounts with status active, in service.
6. **Cancelled / Attrition** — accounts ended or churned.

**Structure under Account:**

- **Account** — one per customer/contract (name, status, billing, contract value).
- **Service Address** — one or more per account; physical place where service is performed. *In DB: keep table name `facilities`; in UI prefer “Service Address” or “Address” for clarity.*
- **Area / Zone / Floor / Space** — optional sub-structure inside a service address (e.g. for mapping, inspections). *In DB: e.g. `location_areas`, `spaces`; in UI use “Area”, “Zone”, “Floor”, or “Space” as needed.*

**Deprecate in user-facing language:**

- **“Site”** — avoid as primary term; use “Account” for the customer and “Service Address” for the place. Keep “site” only where internal/technical (e.g. URLs or legacy code) and migrate copy to “Service Address” or “Account” as appropriate.
- **“Location”** — reserve for internal/technical (e.g. `location_id` in DB if still present, or “service location” in one-off copy). Prefer “Service Address” or “Address” in UI.

### 3.2 What Should Remain

- **Account** — primary customer/contract object in UI and product language. Table `accounts`; routes `/app/accounts/*`.
- **Facility** — table name for physical service place (no need to rename DB). In UI, expose as “Service Address” or “Address” (and in forms: “Add service address”, “Edit service address”).
- **Area / Zone / Floor / Space** — for sub-structure; keep or introduce where needed for mapping/inspections.

### 3.3 What Should Be Deprecated (User-Facing)

- **“Sites” as primary nav or primary label** — replace with “Accounts” for the list of customers, and “Service addresses” (or “Addresses”) when listing places under an account. So: one nav item “Accounts” (list of accounts); under each account, “Service addresses” (list of facilities).
- **“Locations” as primary label** — same as above; use “Service Address” or “Account” depending on context. Keep “location” only in technical/URL/DB naming where it already exists.

### 3.4 Migration Strategy (Legacy Naming → Canonical)

**Phase A — Copy and nav (no DB renames):**

1. **Nav:** In `navFactory.ts`, change the Ops item that currently points to `/app/sites` with label `navLocations` (“Sites”) to either:
   - Point to `/app/accounts` and use a single “Accounts” list (with filters for “with service addresses” if needed), or
   - Keep a separate “Service addresses” list that goes to a dedicated route (e.g. `/app/accounts/service-addresses` or keep `/app/sites` but relabel to “Service addresses” and ensure it only shows facilities).
2. **Translations:** In `app-translations.ts`, add keys e.g. `navServiceAddresses: 'Service addresses'`, and use “Account” / “Service address” / “Active accounts” / “Cancelled accounts” consistently in new copy.
3. **Component copy:** Replace user-visible “site” and “location” with “Account” or “Service address” in: site-detail-tabs, site-create-form, site-finance-drawer, SiteDrawer, location-form, locations-list-with-filter, and any dashboard/KPI copy that says “site” or “location”.

**Phase B — Routes (optional consolidation):**

1. **Redirects:** Make `/app/sites` and `/app/locations` redirect to `/app/accounts` (or to a “service addresses” view under accounts). Already partially in place (locations → accounts).
2. **Links:** Update all internal links that point to `/app/sites/*` to point to `/app/accounts/[id]/facilities/[id]` or to a consolidated list under accounts. Leave `/app/sites` as redirect for bookmarks.

**Phase C — Code and types (gradual):**

1. **Types/comments:** Use “account” and “facility” (or “service address” in comments) consistently; add a short “Domain terms” comment in key files.
2. **No rush to rename DB columns** `location_id` where they still exist (e.g. in CRM tables that weren’t fully migrated to facility_id); do that only when touching those features, and prefer adding facility_id + backfill then deprecating location_id.

**Risk:** Renaming/redirecting “Sites” and “Locations” can break bookmarks, docs, and any external links. Do redirects and copy changes first; then update links; then document “Sites = Service addresses (legacy URL /app/sites)”.

---

## 4. Access Control Review

### 4.1 Why Owner / Super-Admin May Be Blocked from Ops or Mapping

**Ops (`/app/ops/*`):**

- **First gate:** `app/ops/layout.tsx` calls `isOperationsEnabled(org.org_id, userId)`.
- **Definition:** `isOperationsEnabled` = `isPremiumPlan` = plan is **Grizzly or Kodiak** (or user is **platform admin**). So **Cub plan = all users see the upgrade screen**, including owner. Permission is never checked for Cub.
- **Second gate (once inside ops):** Individual pages use `requirePermission(…, 'ops.read' | 'dashboard.ops')`. For Grizzly/Kodiak, owner has these in `role_permissions` (094, 098). So **owner on Grizzly/Kodiak** should pass.
- **Conclusion:** Block is **plan**, not role. Owner on **Cub** cannot access Ops. Fix options: (1) Allow owner (or org.owner) to bypass plan gate for Ops in layout, or (2) Keep plan gate and treat “owner blocked” as expected until they upgrade.

**Mapping (`/app/map`, map APIs):**

- **Gates:** `requirePermission(…, 'maps.read')` on `/app/map/page.tsx` and on `api/app/maps/entities/route.ts`, `api/app/maps/layers/ops/route.ts`, `api/app/maps/layers/sales/route.ts`.
- **Role_permissions (098):** owner, admin, manager, org.owner, org.admin, and plan-style roles (kodiak, grizzly, cub) have `maps.read`. So owner with role `owner` should have maps.read.
- **If owner is blocked:** Likely (1) org_members.role is not `owner` (e.g. different role that lacks maps.read), or (2) RPC `has_permission` / role_permissions seed is missing for that role, or (3) plan gate elsewhere (e.g. layout) blocking before the page runs.

### 4.2 Plan Gates

| Gate | Where | Effect |
|------|--------|--------|
| `isOperationsEnabled` | `app/ops/layout.tsx` | Cub → upgrade screen; Grizzly/Kodiak (and platform admin) → children |
| `isPremiumPlan` | Launch packets, university, proposals (getPlanType) | Cub restricted from some features |
| `getPlanType` | Various (e.g. university, proposals) | Drives feature visibility / gating |

### 4.3 Permission Checks (Ops and Mapping)

| Permission | Used in | Expected roles (from 094/098) |
|------------|--------|-------------------------------|
| `ops.read` | Ops pages, risk API, service-deployments API, crews API, shifts | owner, admin, manager, org.owner, org.admin, ops.*, kodiak, grizzly, etc. |
| `dashboard.ops` | ops/page.tsx, service-deployments/page.tsx | owner, admin, org.owner, org.admin, ops.manager, ops.crew_lead |
| `maps.read` | map/page.tsx, maps/entities, maps/layers/ops, maps/layers/sales, sales/territory | owner, admin, manager, org.owner, org.admin, cub, grizzly, kodiak, etc. |
| `accounts.write` | account-assignment, onboarding-import guard | — |
| `coverage.admin` | coverage pages, coverage-capacity, coverage-routing-rules | — |

### 4.4 Middleware and Layout Guards

- **Middleware:** Session refresh, org resolution from slug; does not enforce ops or maps.
- **Layout:** `app/ops/layout.tsx` is the only layout that gates by **plan** (isOperationsEnabled). No other layout blocks by plan for map or dashboard.
- **Pages:** Individual pages call `requirePermission`; denial throws and shows authz error. So after passing the ops layout (if Grizzly+), owner must still have the required permission (e.g. dashboard.ops, ops.read).

### 4.5 Summary: How to Unblock Owner / Super-Admin

- **If on Cub:** They are blocked from Ops by design (plan gate). Options: upgrade org to Grizzly/Kodiak, or add an explicit bypass in `isOperationsEnabled` for platform admin (already present) or for org role `owner` (business decision).
- **If on Grizzly/Kodiak:** Ensure `org_members.role` is `owner` (or admin/manager) and that `role_permissions` includes that role for `dashboard.ops`, `ops.read`, `maps.read`. If they use gov RBAC, ensure `gov_member_roles` maps them to a role that has those permissions. Check RPC `has_permission` returns true for that user/org/permission.

---

## 5. Top Priorities

### 5.1 Must Fix First

1. **Ops access for owner on paid plan** — Confirm owner on Grizzly/Kodiak has `dashboard.ops` and `ops.read` in role_permissions (and in gov if used). If not, add. If they are on Cub, document that Ops requires Grizzly+ or add owner bypass for Ops layout (product decision).
2. **Single plan source** — Use `org_subscriptions.plan_code` everywhere (already in getPlanType); remove or document fallback to `organizations.plan` so there’s no mismatch.
3. **Domain language in nav** — Switch “Sites” (navLocations) to “Service addresses” or consolidate under “Accounts” so the first thing users see matches “Account” as the main concept.

### 5.2 Can Migrate Later

1. **Copy pass** — Replace remaining “site” and “location” in user-facing strings with “Account” and “Service address” in components and dashboard copy.
2. **Route consolidation** — Redirect `/app/sites` and `/app/locations` to `/app/accounts` (or a single “service addresses” view) and update internal links over time.
3. **Gov RBAC rollout** — Backfill gov_member_roles from org_members.role; migrate permission checks to gov keys; deprecate legacy role strings where safe.

### 5.3 Where Naming Cleanup Might Break Things

- **Redirects:** Changing or removing `/app/sites` and `/app/locations` can break bookmarks and external links; keep redirects.
- **Components that read “sites” or “locations” from API/DB** — If the backend still returns or expects `site_id` / `location_id`, renaming only in UI is safe; changing API contracts needs coordination.
- **DB:** Renaming table `locations` or column `location_id` in production is high-risk; avoid unless necessary. Prefer “facility” and “account” in new code and leave legacy columns as-is until a dedicated migration.

---

## 6. Deliverables

### 6.1 Concise Architecture Summary

- **Stack:** Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui, Supabase (Auth, Postgres, Storage, RLS), Stripe.
- **Tenancy:** Org-scoped; RLS with is_org_member / has_org_permission; shell (owner_operator | franchisee | franchisor) drives nav.
- **Spine:** Leads → Walkthroughs → Proposals → Accounts (+ facilities as service addresses) → Active / Cancelled; launch_plans and launch_packets for handoff.
- **RBAC:** Legacy role_permissions + gov (gov_roles, member_effective_permissions); requirePermission + hasPermissionCached; site admin and platform admin bypass.
- **Plans:** Cub / Grizzly / Kodiak; isOperationsEnabled (Grizzly+) gates entire Ops section.

### 6.2 Domain Language Cleanup Plan

| Step | Action | Owner |
|------|--------|--------|
| 1 | In nav: replace “Sites” (navLocations) with “Service addresses” or point to accounts list; add navServiceAddresses if needed | Dev |
| 2 | In app-translations: add Service address / Address labels; use “Account” and “Service address” in new copy | Dev |
| 3 | In components: replace user-visible “site”/“location” with “Account” or “Service address” (site-detail-tabs, site-create-form, SiteDrawer, location-form, etc.) | Dev |
| 4 | Redirects: /app/locations → /app/accounts; /app/sites → /app/accounts or /service-addresses | Dev |
| 5 | Internal links: update links from /app/sites/* to /app/accounts/…/facilities/… where appropriate | Dev |
| 6 | Docs: update SITE_LOCATION_ALIAS and any runbooks to state “Account = customer, Service address = facility; avoid site/location in UI” | Dev |

### 6.3 Permissions / Access Hardening Plan

| Step | Action | Owner |
|------|--------|--------|
| 1 | Verify role_permissions: owner has dashboard.ops, ops.read, maps.read (094, 098) | Dev |
| 2 | Decide: allow org role “owner” to bypass Ops plan gate (isOperationsEnabled) so owner on Cub can access Ops, or keep plan gate and document “Ops requires Grizzly+” | Product/Dev |
| 3 | Add integration test or script: as owner on Grizzly, call ops and map routes; assert 200 | Dev |
| 4 | Audit all requirePermission calls for ops and maps: use same permission keys as in DB (dashboard.ops vs ops.read) and document which is required for which route | Dev |
| 5 | Optionally backfill gov_member_roles for existing org_members so gov and legacy stay in sync | Dev |

### 6.4 Exact Next Implementation Phases

**Phase 1 — Access and plan (1–2 days)**  
- Confirm owner has ops.read, dashboard.ops, maps.read in role_permissions.  
- If product agrees: in ops layout, allow `role === 'owner'` (or org.owner) to bypass plan gate so owner on Cub can access Ops.  
- Add one E2E or script: owner on Grizzly can load /app/ops and /app/map.

**Phase 2 — Domain copy and nav (2–3 days)**  
- Update navFactory: change “Sites” to “Service addresses” or consolidate under Accounts.  
- Update app-translations: navServiceAddresses, and “Account” / “Service address” in key strings.  
- Replace visible “site”/“location” in site-detail-tabs, site-create-form, SiteDrawer, location-form, locations-list, and dashboard copy.

**Phase 3 — Redirects and links (1–2 days)**  
- Ensure /app/locations and /app/sites redirect to /app/accounts (or dedicated service-addresses view).  
- Update internal links from /app/sites/* to /app/accounts/[id]/facilities/[id] where applicable; leave redirects for old URLs.

**Phase 4 — Docs and RBAC (ongoing)**  
- Update SITE_LOCATION_ALIAS and restoration docs with canonical terms (Account, Service address, Areas/Zones).  
- Optionally backfill gov_member_roles and migrate one module (e.g. ops) to permission keys only; document in RESTORATION_AND_DOMAIN_CLEANUP_BRIEF.

---

*End of Restoration and Domain Cleanup Brief. Revisit after major domain or access changes.*
