# JANIBEAR Production-Readiness Debug Audit

**Date:** 2025-03-07  
**Scope:** Auth, RBAC, tenant isolation, route guards, service-role usage, feature gating, launch state, crew reassignment, dashboard math, client-trust.

---

## 1. Categorized Bug/Risk List

### 1.1 Auth

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| A1 | **Resolved-org not used on first request** | **Medium** (fixed in prior pass) | Middleware set `x-resolved-org-id` and cookie on response; layout ran in same request and only read cookie (empty). Layout could show wrong org (first membership) for one request when entering via `/org/[slug]` or subdomain. | `src/lib/user-context.ts` — fixed by falling back to `x-resolved-org-id` when cookie absent. |
| A2 | **Two `requireFeature` implementations** | Low | `src/lib/auth/requireFeature.ts` (orgId + FeatureKey) and `src/lib/access.ts` (featureCode string, uses getEffectiveAccess) both exist. LiDAR/extract-scope uses access.ts; other code may use auth version. Risk of inconsistent feature checks. | `src/lib/auth/requireFeature.ts`, `src/lib/access.ts`, `src/app/api/extract-scope/route.ts` |

### 1.2 Permissions / RBAC

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| P1 | **Settings AI gated by wrong permission key** | Medium | AI Control Center page uses `settings.org.edit` for access. Governance defines `org.ai.manage`; design says “authorization by permissions, not role.” If RLS/DB map only governance keys, AI may be over- or under-gated. | `src/app/app/settings/ai/page.tsx` (line 18: `canManageAi = permissions['settings.org.edit']`) |
| P2 | **`settings.ai` not in SETTINGS_PERMISSION_KEYS** | Low | `getSettingsPermissions()` only returns keys from `SETTINGS_PERMISSION_KEYS`; `settings.ai` is in PERMISSIONS array but not in SETTINGS list. So AI page cannot gate by `settings.ai` without adding it. | `src/lib/auth/permissions.ts` (SETTINGS_PERMISSION_KEYS), `src/lib/auth/permission-helpers.ts` |
| P3 | **Launch plan uses role names instead of permissions** | Medium | `launch-plan.ts` uses `LAUNCH_PLAN_WRITE_ROLES` / `LAUNCH_PLAN_READ_ROLES` (owner, manager, admin, sales, ops). JANIBEAR design: “authorization decisions use permissions, not role names.” Mismatch with governance model. | `src/actions/launch-plan.ts` (e.g. canWriteLaunchPlan(role), canReadLaunchPlan(role)) |
| P4 | **Dual permission namespaces** | Low | `src/lib/permissions.ts` (e.g. ORG_MANAGE_USERS) used by api-auth and `/api/orgs/*`; `src/lib/auth/permissions.ts` + governance used by server guards. Both used consistently in their layers but keys differ; RPC `has_permission` must accept both. | `src/lib/permissions.ts`, `src/lib/auth/permissions.ts`, `src/lib/api-auth.ts` |

### 1.3 Settings access

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| S1 | **No layout-level settings guard** | Low | Settings pages each call `requireOrg()` then `getSettingsPermissions()` and show lock UI when missing permission. No shared layout that blocks access to `/app/settings/*` by permission; user can hit URLs directly and sees lock screen (correct) but no early redirect. | `src/app/app/settings/page.tsx`, `team/page.tsx`, `ai/page.tsx` |
| S2 | **Test data link visible without explicit permission** | Low | Settings page shows “Test data” card and link to `/app/settings/test-data` without a permission check. Anyone who can reach Settings (e.g. `settings.view`) can open test data. | `src/app/app/settings/page.tsx` (Test data card not gated) |

### 1.4 Super-admin / site-owner

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| SA1 | **Site admin via env + DB + platform** | Info | Site admin: `SITE_ADMIN_USER_IDS` env, `profiles.is_site_admin`, or platform admin. Cached env list in memory. No bug; document that changing env requires restart. | `src/lib/auth/siteAdmin.ts` |
| SA2 | **Admin reset password: dev or secret** | Info | `/api/auth/admin-reset-password` allowed in dev or when `x-admin-reset-secret` matches. Not gated by session/site admin. Intentional for recovery; ensure secret is not exposed. | `src/app/api/auth/admin-reset-password/route.ts` |
| SA3 | **Set password correctly gated** | OK | `/api/admin/users/set-password` uses `getEffectiveAccessForCurrentUser()` and `access?.isPlatformAdmin`. Correct. | `src/app/api/admin/users/set-password/route.ts` |

### 1.5 Org switching

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| O1 | **Org switch validates membership** | OK | `/api/org/switch` checks auth then `org_members` for user+org_id; sets cookie only if member. No issue. | `src/app/api/org/switch/route.ts` |
| O2 | **Impersonation only for platform admin** | OK | `requireOrg()` uses `impersonate_org_id` cookie only when `isPlatformAdmin()`. Correct. | `src/lib/auth.ts` (requireOrg) |

### 1.6 Page guard inconsistencies

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| G1 | **Mixed guard entrypoints** | Medium | Some pages use `getServerContextOrThrow()`, others `requireOrg()` + optional permission. Billing/upgrade/helphub/team use serverGuards; settings use requireOrg + getSettingsPermissions. Inconsistent pattern. | `src/lib/auth/serverGuards.ts`, `src/lib/auth.ts`, settings pages, `src/app/app/billing/page.tsx`, etc. |
| G2 | **Franchisor shell redirect** | OK | App layout redirects to `/app/franchise` when shell is franchisor and path not franchise/settings/kpis/benchmarks. Correct. | `src/app/app/layout.tsx` |

### 1.7 Tenant isolation

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| T1 | **Crew-change module trusts caller orgId** | High | `createCrewChangeRequest`, `approveCrewChangeRequest`, `rejectCrewChangeRequest`, `getCrewChangeRequests` take `orgId` from caller. No server-side auth or membership check inside the module. If an API/action calls these with client-supplied or unchecked orgId, tenant isolation is broken. | `src/lib/ops-core/crew-change.ts` |
| T2 | **Stripe portal org_id validated** | OK | Stripe portal accepts body `org_id` but calls `requireOrgSeatAdmin(org_id)` before using it. Correct. | `src/app/api/stripe/portal/route.ts` |
| T3 | **Internal/risk run accepts body orgId** | OK | Route protected by CRON_SECRET; body orgId used only for server-to-server. Not client-trust. | `src/app/api/internal/risk/run/route.ts` |

### 1.8 RLS assumptions

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| R1 | **computeReadiness(opportunity_id) not filtering by org** | Medium | `computeReadiness` does `requireOrg()` then queries `opportunities` by `opportunity_id` only (no `.eq('org_id', org.org_id)`). Relies on RLS to restrict opportunities to current user’s org. If RLS is missing or wrong, cross-org read. | `src/actions/launch-plan.ts` (computeReadiness) |
| R2 | **Dashboard data by orgId** | Low | `getOperatorDashboardData(orgId)` and `getCommandCenterData(orgId)` receive orgId from pages that got it via `requireOrg()`. They do not re-validate membership; RLS on inspections/issues/facilities/crews etc. must enforce org. Document assumption. | `src/lib/dashboard-data.ts`, `src/lib/command-center-data.ts` |
| R3 | **has_permission RPC** | Info | Many RLS policies use `has_permission(org_id, key)`. Migration 114 wires it to gov + legacy. Ensure all permission keys used in app exist in DB. | `supabase/migrations/097_*.sql`, `114_*.sql` |

### 1.9 Service-role usage

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| SR1 | **Service-role only in trusted server paths** | OK | `createAdminClient()` used in: cron (CRON_SECRET), internal risk (CRON_SECRET), Stripe webhook (signature), admin set-password (platform admin), admin reset-password (dev or secret), benchmarking refresh, workflow-engine, recurring-billing, contract-renewals, customer-surveys, observability. No use with user-supplied input without prior auth. | Multiple; see grep createAdminClient. |
| SR2 | **Cron routes protected** | OK | Missed-task-notifications and internal/risk/run check CRON_SECRET (or INTERNAL_CRON_SECRET). | `src/app/api/cron/*`, `src/app/api/internal/risk/run/route.ts` |

### 1.10 Feature gating

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| F1 | **Two feature systems** | Low | auth/requireFeature (orgId + FeatureKey from features.ts: addon.lidar, etc.) vs access.ts requireFeature (featureCode string, EffectiveAccess). Extract-scope uses access. Risk of divergence. | `src/lib/auth/requireFeature.ts`, `src/lib/access.ts`, `src/lib/auth/features.ts` |

### 1.11 Launch state

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| L1 | **Launch plan mutations always scoped by org** | OK | All launch_plan updates use `.eq('org_id', org.org_id)`. No cross-org write. | `src/actions/launch-plan.ts` |
| L2 | **computeReadiness opportunity fetch** | Medium | Same as R1: opportunity fetched by id only; depends on RLS. | `src/actions/launch-plan.ts` |

### 1.12 Crew reassignment / change-request workflow

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| C1 | **No auth in crew-change module** | High | `createCrewChangeRequest`, `approveCrewChangeRequest`, `rejectCrewChangeRequest`, `getCrewChangeRequests` do not verify that the requesting user is a member of `orgId` or has ops permission. Callers must enforce; no in-module guard. Any future API that passes orgId from client without checking membership is a tenant isolation bug. | `src/lib/ops-core/crew-change.ts` |
| C2 | **Callers of crew-change** | Info | Grep shows crew-change exported from ops-core; no direct API/page callers found in audit. When APIs/actions are added, they must: require auth, resolve org from session/cookie (not body), and require permission (e.g. ops.crews.update) before calling crew-change. | `src/lib/ops-core/index.ts` |

### 1.13 Dashboard math

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| D1 | **Revenue/counts from RLS-filtered queries** | Low | Command center revenue uses invoices/accounts with org_id; dashboard stats use org-scoped queries. Math (reduce, sum) is over already-filtered data. Risk: if any query omitted org_id or used wrong org, numbers would be wrong. Spot-check: dashboard-data and command-center-data use orgId in all relevant queries. | `src/lib/dashboard-data.ts`, `src/lib/command-center-data.ts` |
| D2 | **Benchmark averages** | Low | benchmark-page-client uses reduce/sum over matching rows; divisor n from count. Ensure no div-by-zero or empty aggregates. | `src/components/benchmark/benchmark-page-client.tsx` |

### 1.14 Client-trust vulnerabilities

| # | Finding | Severity | Root cause | Files |
|---|--------|----------|------------|--------|
| CT1 | **Org from cookie/header only** | OK | Active org comes from cookie or `x-resolved-org-id` (set by middleware after membership check). Not from client body in app flows. | `src/lib/user-context.ts`, middleware |
| CT2 | **Stripe portal** | OK | body org_id validated with requireOrgSeatAdmin(org_id). | `src/app/api/stripe/portal/route.ts` |
| CT3 | **Crew-change** | High | If any action or API passes orgId/facilityId from request body to crew-change without resolving org from session and checking membership/permission, that’s client-trust. Ensure all future callers resolve org server-side. | Call sites of `src/lib/ops-core/crew-change.ts` |

---

## 2. Severity summary

| Severity | Count | Items |
|----------|-------|--------|
| High | 2 | T1/C1 (crew-change no auth), CT3 (client-trust for crew-change callers) |
| Medium | 5 | P1 (AI permission key), P3 (launch role vs permission), G1 (mixed guards), R1/L2 (computeReadiness RLS), S1 (no layout guard) – optional |
| Low | 8 | A2, P2, P4, S2, F1, R2, D1, D2 |
| OK / Info | 10+ | A1 fix, SA*, O1, O2, G2, T2, T3, SR*, L1, CT1, CT2 |

---

## 3. Exact files involved (by finding)

- **P1 / Settings AI:** `src/app/app/settings/ai/page.tsx`
- **P2:** `src/lib/auth/permissions.ts`, `src/lib/auth/permission-helpers.ts`
- **P3:** `src/actions/launch-plan.ts`
- **T1 / C1 / CT3:** `src/lib/ops-core/crew-change.ts`, any future API/action that calls it
- **R1 / L2:** `src/actions/launch-plan.ts` (computeReadiness)
- **A2 / F1:** `src/lib/auth/requireFeature.ts`, `src/lib/access.ts`
- **G1:** `src/lib/auth/serverGuards.ts`, `src/lib/auth.ts`, settings and billing pages
- **S1:** `src/app/app/settings/layout.tsx` (optional new guard)
- **S2:** `src/app/app/settings/page.tsx`

---

## 4. Remediation plan

### 4.1 Quick wins

1. **P1 – Settings AI permission**
   - Add `settings.ai` to `SETTINGS_PERMISSION_KEYS` in `src/lib/auth/permissions.ts`.
   - In `src/app/app/settings/ai/page.tsx`, set `canManageAi = permissions['settings.ai'] ?? permissions['settings.org.edit']` (or gate only on `settings.ai` once DB/RLS map it).
   - Ensure `has_permission` / role_permissions or governance include `settings.ai` / `org.ai.manage` for intended roles.

2. **R1/L2 – computeReadiness org scope**
   - In `computeReadiness`, after `requireOrg()`, fetch opportunity with `.eq('id', opportunity_id).eq('org_id', org.org_id)` (or use org from requireOrg and add .eq('org_id', org.org_id) to the select). If RLS already enforces, this is defense in depth.

3. **T1/C1 – Crew-change auth**
   - Add a wrapper or require every public entrypoint (e.g. `createCrewChangeRequest`) to accept `userId`, verify membership and permission (e.g. `requirePermission(userId, orgId, 'ops.crews.update')`) at the start of the function, or document that “callers MUST validate auth and org before calling; this module does not check.”

4. **S2 – Test data**
   - Gate “Test data” card/link on a permission (e.g. `settings.org.edit` or a dedicated `settings.test_data`) so only allowed roles see it.

### 4.2 Deeper rebuilds

1. **P3 – Launch plan permission-based**
   - Replace role-name checks with permission checks: e.g. require `launch.handoffs.update` or a dedicated launch permission for write; use `getUserPermissionsForOrg` or `requirePermission` in launch-plan actions. Align with governance keys and RLS.

2. **G1 – Unified app guard**
   - Introduce a single pattern for “app page that needs org + optional permission”: e.g. `requireAppPage({ permission?: string })` that calls requireOrg(), optionally requirePermission, and returns context. Migrate settings and other pages to it so guard logic lives in one place.

3. **A2/F1 – Single feature system**
   - Choose one of auth/requireFeature (org-scoped, FeatureKey) or access.ts (EffectiveAccess). Use it everywhere; deprecate or alias the other. Ensure LiDAR and other features use the same path.

4. **P4 – Permission key alignment**
   - Long-term: align legacy permission keys with governance keys and a single source of truth (e.g. one RPC and one list). Reduces confusion and RLS/app drift.

---

## 5. Regression risks

- **P1:** Adding `settings.ai` and changing AI page gate: ensure DB/RLS grant the key to roles that should see AI; otherwise they lose access.
- **R1/L2:** Adding org_id to computeReadiness: if RLS already restricts, no behavior change; if not, we fix a leak.
- **Crew-change:** Adding auth inside the module may break callers that currently pass orgId from trusted context; document and add tests.

---

## 6. QA steps

1. **Org switch:** User with 2 orgs; switch via UI; confirm cookie and all data (dashboard, settings) reflect selected org. No data from other org.
2. **Settings:** As owner, open Settings, Team, AI; as member without settings.users or org.edit, confirm lock screen and no data. Test data link only if gated.
3. **Launch plan:** As sales/ops, create and transition launch plan; confirm only own org’s plans visible and updatable.
4. **Franchisor:** As franchisor shell, confirm redirect to /app/franchise and no direct access to ops-only URLs.
5. **Cron:** Call cron endpoints without CRON_SECRET → 401; with correct secret → 200 and expected side effects.
6. **Stripe portal:** POST with another org’s org_id (as non-member or member without seat admin) → 403.
7. **Dashboard math:** Compare dashboard KPIs (revenue, counts) with a known dataset or DB aggregates for one org; confirm numbers match.

---

## 7. Additional hardening (recommended)

- Add integration tests for: requireOrg + org switch, requirePermission on a sample API, and crew-change with and without auth.
- Document RLS assumptions (e.g. “opportunities, launch_plans, crew_assignments are filtered by org_id via RLS”) and add a minimal RLS test or audit script.
- Ensure every API that takes `orgId` from body or params validates membership (and permission where needed) before using it.
