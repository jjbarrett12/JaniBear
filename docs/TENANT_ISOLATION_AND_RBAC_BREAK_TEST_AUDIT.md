# JANIBEAR — Tenant Isolation & RBAC Break-Test Audit

**Date:** 2025-03-03  
**Role:** Senior security engineer, QA lead  
**Scope:** Server-side auth, middleware, route guards, RLS, server actions, API handlers. Break-test focus: cross-org data, route access, mutation outside role, bypass of frontend-only checks.

---

## PART 1 — Server-Side Auth Checks

### 1.1 Auth primitives

| Helper | Location | Behavior |
|--------|----------|----------|
| `getCurrentUser()` | `src/lib/auth.ts` | Supabase `getUser()` then `getSession()` fallback; returns null if no session. |
| `requireAuth()` | `src/lib/auth.ts` | Redirects to `/auth/login` if no user. |
| `requireOrg()` | `src/lib/auth.ts` | Requires user; resolves org from: (1) impersonation cookie (platform admin only), (2) `getOrgForUserId(activeOrgId)` where activeOrgId is from cookie, (3) first membership. **Critical:** `getOrgForUserId(activeOrgId)` only returns membership if user is member of that org; cookie is not trusted for org identity without membership check. |
| `getActiveOrgIdFromCookie()` | `src/lib/user-context.ts` | Reads `active_org_id` cookie. |
| `getUserContext()` | `src/lib/user-context.ts` | **effectiveOrgId** = activeOrgId only if `orgs.some(m => m.org_id === activeOrgId)`; else first org. So client cannot switch to another org by cookie alone. |
| `requirePermission({ orgId, userId, permission })` | `src/lib/auth/permission-helpers.ts` | Validates orgId/userId; `requireMembership` + `hasPermissionCached` (RPC `has_permission`). Site admin bypass. |
| `requireOrgMember(orgId)` | `src/lib/api-auth.ts` | Auth + membership check for orgId. |
| `requireOrgPermission(orgId, permissionKey)` | `src/lib/api-auth.ts` | Auth + membership + RPC `has_permission`. |
| `requireApiOrg()` | `src/lib/api-guard.ts` | `requireApiAuth` then requires `context.activeOrgId` (from getUserContext — so membership-validated). |
| `requireOrgSeatAdmin(orgId)` | `src/lib/billing/requireOrgRole.ts` | Membership check for orgId + role in SEAT_ADMIN_ROLES. |
| `requirePlatformAdmin()` | `src/lib/platform-guard.ts` | Used by platform actions and admin API routes. |

### 1.2 Impersonation

- **Cookie:** `impersonate_org_id`. Set only in `setImpersonateOrg(orgId)` (`src/actions/platform.ts`), which calls `requirePlatformAdmin()` first. Cleared by `clearImpersonation()` (no check — harmless).
- **requireOrg():** If cookie set and `isPlatformAdmin()`, returns that org’s context. So only platform admins can impersonate; and only by using the protected action.

**Finding:** Impersonation is correctly gated. No fix needed.

---

## PART 2 — Middleware

**File:** `src/middleware.ts` → `updateSession` in `src/lib/supabase/middleware.ts`.

- Refreshes Supabase session; sets cookies.
- **Protected paths:** For non-public paths, if no user and path is not `/app/*`, redirects to `/auth/login`. For `/app/*` with no user, passes through (layout will redirect).
- **active_org_id cookie:** Set only when (1) user is authenticated, (2) path is under `/app/`, and (3) either (a) resolved org from slug and user is **member** of that org, or (b) no cookie yet and first membership is used. So middleware never sets cookie to an org the user is not in.
- **Security headers:** X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

**Finding:** Middleware does not validate org membership for arbitrary cookie values on every request; it only sets the cookie when the user is a member. The cookie is httpOnly, so clients cannot set it. Org switch is done via `/api/org/switch`, which validates membership. No vulnerability identified.

---

## PART 3 — Route Guards

- **App layout:** `src/app/app/layout.tsx` uses `requireOrg()`; billing lock and redirect; platform-admin bypass.
- **Page-level:** Most `/app/**/page.tsx` use `requireOrg()` and many use `requirePermission()` with a permission key (e.g. `dashboard.sales`, `ops.read`, `maps.read`). Permission keys are enforced server-side via RPC.
- **PermissionGate (UI):** `src/components/auth/PermissionGate.tsx` — server component that checks `hasPermission` and hides children. **Not a security boundary:** UI only; server actions and API must enforce.
- **Ops layout:** `src/app/app/ops/layout.tsx` gates by `isOperationsEnabled(orgId, userId)` (plan + platform-admin bypass).

**Finding:** Route guards are server-side (requireOrg/requirePermission). PermissionGate is correctly documented as “never rely on this alone.”

---

## PART 4 — Supabase RLS

- **Pattern:** Tables with `org_id` use policies like `is_org_member(org_id, auth.uid())` or `has_org_permission(org_id, 'permission.key')`. Many also allow `is_site_admin(auth.uid())` for admin bypass.
- **Governance (114):** `has_org_permission`, `is_franchisor_of` for franchise visibility; organizations readable by member or franchisor with permission.
- **crm_activities:** FOR ALL with USING/WITH CHECK on org_members. So cross-org insert/update is blocked by RLS even if app code bugged.
- **Service role:** Used only in cron, webhooks, and platform admin flows; never exposed to client.

**Finding:** RLS is a solid second layer. Reliance on RLS alone for new tables is risky if a server action or API forgets to filter by org; defense in depth (server-side org filter + RLS) is preferred.

---

## PART 5 — Server Actions & API Handlers

### 5.1 Actions that take client-supplied identifiers

| Action / API | Client input | Server check | Org filter on data |
|--------------|--------------|--------------|--------------------|
| `createLead` | — | requireOrg, getCurrentOrg | insert org_id from org |
| `convertLeadToOpportunity` | leadId, accountId, ... | requireOrg | .eq('org_id', org.org_id) on lead and account |
| `setLeadStatusAction` | leadId | requireOrg | .eq('org_id', org.org_id) |
| `getLeadForDrawer` | orgId, leadId | caller passes orgId | .eq('org_id', orgId) |
| `createActivity` | payload.org_id, ... | requireOrg | **Fixed:** insert uses server org_id only |
| `completeActivity` | activity_id | requireOrg | **Fixed:** update .eq('org_id', org.org_id) |
| `markDealWon` | opportunityId | requireOrg | .eq('org_id', org.org_id) on opportunity and proposals |
| `getClientDetail` | org_id, client_id | caller | .eq('org_id', org_id) |
| `getOpportunityDetail` | org_id, opportunity_id | caller | .eq('org_id', org_id) |
| `updateWalkthroughStatus` | id | requireOrg | .eq('org_id', org.org_id) on fetch and update |
| account-users actions | accountId, etc. | requireOrg | .eq('org_id', org.org_id) on accounts |
| launch-plan.ts | — | requireOrg | uses org_id from context |

**Fixed in this audit:** `createActivity` now uses server-derived `org_id` only (ignores payload.org_id). `completeActivity` now adds `.eq('org_id', org.org_id)` to the update.

### 5.2 API routes with path/query/body org or ids

| Route | Input | Check |
|-------|--------|--------|
| `GET/POST /api/org/switch` | body.org_id | getUser + membership check; only then set cookie |
| `GET /api/billing/entitlements?org_id=` | query org_id | getUser; if org_id provided, **membership check**; 403 if not member |
| `POST /api/stripe/portal` | body.org_id | requireOrgSeatAdmin(org_id) → membership + role |
| `POST /api/org/tokens/assign` | body.org_id | requireOrgSeatAdmin(parsed.data.org_id) |
| `GET /api/orgs/[orgId]/members` | params.orgId | requireOrgPermission(orgId, ORG_MANAGE_USERS) |
| `GET /api/app/risk/accounts/[accountId]` | params.accountId | getCurrentUserId + getActiveOrgIdFromCookie + requirePermission(ops.read); queries .eq('org_id', orgId).eq('account_id', accountId) |

**Finding:** All checked routes either validate membership for the org they act on or filter by server-derived org. No IDOR found.

### 5.3 Public / unauthenticated routes

| Route | Purpose | Risk |
|-------|---------|------|
| `POST /api/public/tickets` | Create ticket from QR form | No auth. Uses RPC `create_service_ticket_from_public(facility_id, ...)` which looks up org from facility and inserts one row. Abuse: spam tickets for known facility_ids. Recommend rate limit. |
| `GET /api/public/locations/[id]` | Display name for ticket form | No auth. RPC `get_public_location_display` returns only name, org_name. No PII. |

---

## PART 6 — Ways the System Could Fail (Break-Test Scenarios)

### 6.1 See another org’s data

- **Cookie manipulation:** active_org_id is httpOnly; cannot be set by JS. If an attacker could set it (e.g. browser bug or misconfigured proxy), `getUserContext()` still uses effectiveOrgId only when `orgs.some(m => m.org_id === activeOrgId)`, so they would get first org, not the forged one. **Mitigated.**
- **Direct API call with another org’s id:** e.g. `GET /api/orgs/{victim_org_id}/members` — requires session; `requireOrgPermission(victim_org_id, ...)` checks membership for victim_org_id; non-members get 403. **Mitigated.**
- **Bypass RLS:** App uses anon key with RLS; service role only in server-only code. No client-side service role. **Mitigated.**

**Remaining risk:** If any new API or action is added that (1) takes org_id from client and (2) does not validate membership before querying, cross-org data could be returned. **Recommendation:** Never trust client-supplied org_id for data scope; always use requireOrg() or requireOrgMember(orgId) and then use that org.

### 6.2 Access routes they should not see

- **Crew (Cub) accessing Ops (Kodiak):** Ops layout uses `isOperationsEnabled` (plan); ops API routes use `requirePermission(..., 'ops.read'|'ops.write')`. So low-role or Cub plan users are blocked at layout or API. **Mitigated.**
- **Sales accessing Admin:** Admin routes and platform routes use requirePlatformAdmin or requireOrgPermission(ORG_MANAGE_USERS). **Mitigated.**
- **Client viewer:** If role is enforced via has_permission and RLS, client viewers only get what their role allows. No specific “client_viewer” route audit in this pass; recommend explicit E2E for client viewer.

**Remaining risk:** Any new route that only hides the link (PermissionGate) but does not call requirePermission on the page or in the API would be bypassable by URL. **Recommendation:** Every sensitive page and API must enforce permission server-side.

### 6.3 Mutate records outside their role

- **createActivity:** Previously used payload.org_id; RLS would block cross-org insert. **Fixed:** Now uses server org_id only.
- **completeActivity:** Previously update by id only; RLS blocks other orgs. **Fixed:** Added .eq('org_id', org.org_id) for defense in depth.
- **Org switch:** Only sets cookie after membership check. **Mitigated.**
- **Admin APIs (tenants, users):** Platform admin or tenant admin with same org checked. **Mitigated.**

### 6.4 Bypass frontend-only permission checks

- **PermissionGate:** Hides UI only. If a user hits a URL directly (e.g. /app/admin/users), the page or layout must call requirePermission or equivalent; many admin pages use requirePermission. **Recommendation:** Audit every admin and ops URL to ensure server-side check; add E2E that asserts 403 when role is insufficient.

---

## PART 7 — Missing Tests

| Gap | Description |
|-----|-------------|
| **Tenant isolation E2E** | No test that user A (org 1) cannot see or mutate org 2’s data (e.g. call API with org_id=org2, or access /app with cookie for org2 if it were possible). |
| **Role-based route access** | No test that Crew (or low-permission role) receives 403 or redirect when accessing /app/ops/command-center or /app/admin/users. |
| **Cross-org API** | No test that GET /api/orgs/{other_org_id}/members returns 403 for a user who is not in other_org_id. |
| **createActivity org_id** | No test that createActivity with payload.org_id = other org still creates in current org only (now true after fix). |
| **Impersonation** | No test that only platform admin can set impersonate cookie (or that non-admin cannot access platform set-impersonate flow). |
| **Billing entitlements** | No test that GET /api/billing/entitlements?org_id=other returns 403 when user is not member of other. |

---

## PART 8 — Proposed E2E Tests for Most Dangerous Cases

1. **Tenant isolation — API**
   - Log in as user in org A. Call `GET /api/orgs/{org_b_id}/members` (org B id from fixture). Assert response is 403.
   - Call `GET /api/billing/entitlements?org_id={org_b_id}`. Assert 403.

2. **Tenant isolation — data**
   - Create lead in org A; get lead id. Log in as user in org B. Call server action (or API) that fetches that lead by id with org B context. Assert lead not found or 403 (and no data for org A returned).

3. **Role — Crew cannot access Ops**
   - Log in as user with Crew (or Cub plan) role. Navigate to `/app/ops/command-center`. Assert redirect to upgrade/forbidden or 403, or page shows upgrade/restricted content only.

4. **Role — Non-admin cannot access org members**
   - Log in as user with Sales (no org.manage_users). Request `GET /api/orgs/{own_org_id}/members`. If permission is required, assert 403; otherwise assert 200 only for allowed roles.

5. **Impersonation — only platform admin**
   - Log in as non–platform-admin. Attempt to call action or API that sets impersonate_org_id (e.g. POST to a route that sets it if such exists). Assert 403. (If no such API, test that only platform console UI can set it and that console requires platform admin.)

6. **createActivity — org fixed**
   - Log in as user in org A. Call createActivity with payload { org_id: org_b_id, type: 'call', subject: 'Test' }. Assert activity is created and row has org_id = org A (query or list activities for org A and see the new one).

---

## PART 9 — Severity-Ranked Findings List

| # | Severity | Finding | Location | Fix / status |
|---|----------|--------|----------|--------------|
| 1 | **High** | createActivity trusted client-supplied org_id for insert. RLS would block cross-org, but defense in depth required. | `src/actions/crm.ts` | **Fixed:** Use server org only in insert. |
| 2 | **Medium** | completeActivity updated crm_activities by id only; no org_id in filter. RLS blocks other orgs; add filter for defense in depth. | `src/actions/crm.ts` | **Fixed:** Added .eq('org_id', org.org_id). |
| 3 | **Medium** | No E2E for tenant isolation (cross-org API or data). Regression risk. | — | Add E2E: org B member cannot read org A via API or actions. |
| 4 | **Medium** | No E2E for role-based route access (e.g. Crew cannot open Ops). | — | Add E2E: low-role user gets 403 or upgrade when hitting ops/admin URL. |
| 5 | **Low** | Public ticket creation has no rate limit; abuse possible for known facility_ids. | `src/app/api/public/tickets/route.ts` | Add rate limit by IP or facility_id. |
| 6 | **Low** | getLeadForDrawer(orgId, leadId) and getClientDetail(org_id, client_id) take org_id from caller; caller must be server (requireOrg). If ever called with client-supplied org_id, would be IDOR. | `src/actions/leads.ts`, `src/actions/crm.ts` | Ensure all callers pass server-derived org_id. Grep call sites. |
| 7 | **Info** | PermissionGate is UI-only; documented. No change. | `src/components/auth/PermissionGate.tsx` | Keep; ensure every gated route has server check. |
| 8 | **Info** | Impersonation cookie set only by requirePlatformAdmin action. No change. | `src/actions/platform.ts` | Keep. |
| 9 | **Info** | Org switch and billing/entitlements validate membership for supplied org_id. No change. | `src/app/api/org/switch`, `src/app/api/billing/entitlements` | Keep. |

---

## Summary

- **Server-side auth:** requireOrg, requirePermission, requireOrgMember, requireOrgPermission, requireApiOrg, and requireOrgSeatAdmin are used consistently. Active org is validated against membership in getUserContext and when setting cookie in middleware/switch.
- **Middleware:** Sets active_org_id only when user is member of that org; httpOnly cookie.
- **RLS:** Second layer on org_id tables; service role not exposed.
- **Fixes applied:** createActivity uses server org_id only; completeActivity scopes update by org_id.
- **Recommended next steps:** Add E2E for tenant isolation (cross-org API and data) and for role-based route access (Crew/Cub vs Ops/Admin). Optionally add rate limit for public ticket creation. Audit call sites of getLeadForDrawer and getClientDetail to ensure org_id is always server-derived.

---

*End of audit. Findings and fixes based on codebase as of audit date.*
