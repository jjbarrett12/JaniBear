# JANIBEAR — Tenant Isolation & RBAC Break-Test Audit

**Date:** 2025-03-03  
**Role:** Senior security engineer, QA lead  
**Scope:** Server-side auth, middleware, route guards, RLS, server actions, API handlers. Break-test across Owner, Admin, Sales (Grizzly), Operations (Kodiak), Supervisor, Crew (Cub), Client Viewer, Independent Owner, Area Franchisor, Unit Franchisee.

---

## 1. Server-Side Auth Checks

### 1.1 What exists

- **`requireOrg()`** (`src/lib/auth.ts`): Ensures current user and active org; uses cookie `active_org_id` and optionally impersonation cookie (platform admin). Resolves org from `getOrgForUserId` (membership). **Does not validate that the cookie’s org is one the user belongs to** in this function—membership is resolved when no impersonation; cookie is set only by middleware (after membership check) or by `POST /api/org/switch` (which **does** verify membership). So in practice org is trusted only when set by those two paths.
- **`requirePermission({ orgId, userId, permission })`** (`src/lib/auth/permission-helpers.ts`): Validates membership via `requireMembership`, then `hasPermissionCached` → RPC `has_permission(p_org_id, p_permission_key)`. RPC uses `auth.uid()` (server-side). **Site admin bypass**: `isSiteAdmin(userId)` → allowed. **Org/user validation**: Throws `AuthContextError` if orgId/userId missing or invalid.
- **`requireOrgMember(orgId)`** / **`requireOrgPermission(orgId, permissionKey)`** (`src/lib/api-auth.ts`): Used by `/api/orgs/[orgId]/*`. Verify session, then membership (or membership + RPC) for **that** orgId from the route param. **Correct**: path param orgId is the one checked; user cannot substitute another org and get access.
- **`requireOrgSeatAdmin(orgId)`** (`src/lib/billing/requireOrgRole.ts`): Verifies user is member of given org and role in `SEAT_ADMIN_ROLES`. Used by Stripe portal and org token routes. **Correct**: orgId (e.g. from body) is validated for membership + role.
- **`getEffectiveAccessForCurrentUser()`** (`src/lib/access.ts`): Used by admin APIs; returns `isPlatformAdmin`, role, etc. Platform admin can act across orgs; tenant admin only with `activeOrgId === targetOrgId`.

### 1.2 Gaps / risks

| Finding | Severity | Detail |
|--------|----------|--------|
| **Org from cookie only** | Medium | App and many APIs derive org from `active_org_id` cookie. Cookie is httpOnly and set only by middleware (after membership) or org/switch (after membership). If any other code path ever set this cookie without membership check, cross-org access would be possible. **Recommendation:** Document that only middleware and org/switch may set `active_org_id`; consider a small auth module that owns all cookie writes. |
| **Admin layout uses role list, not permission** | Low | `src/app/app/admin/layout.tsx` uses `ADMIN_ROLES = ['owner', 'admin', 'manager']` and redirects others to dashboard. It does **not** call `requirePermission(..., 'org.manage_users')`. So “admin” access is role-based in layout; mutations (invite, update role) are permission-based in API/actions. If `role_permissions` were changed so manager lacked `org.manage_users`, manager would still enter admin layout but API would 403. **Recommendation:** Align layout with permission (e.g. requirePermission for org.manage_users or a dedicated “admin area” permission) so layout and API never diverge. |
| **createLead uses getCurrentOrg() not requireOrg()** | Low | `src/actions/leads.ts` createLead uses `getCurrentOrg()` which can return null; it then checks `org?.org_id`. So unauthenticated or no-org users get a soft error. No cross-org risk; only consistency with other actions that use requireOrg(). |

---

## 2. Middleware

### 2.1 What exists

- **`src/middleware.ts`**: Calls `updateSession(request)` (Supabase session refresh), applies security headers. On error, redirects `/app/*` to `/auth/login`. **Does not** block by role or permission.
- **`src/lib/supabase/middleware.ts`** (`updateSession`):
  - Refreshes Supabase session; sets cookies via `setAll`.
  - Resolves org from subdomain/path slug via `get_org_id_by_slug`; **verifies user is member** before setting `active_org_id` cookie.
  - For `/app/*` without user, **does not** redirect; lets request through so layout can redirect (avoids Edge cookie issues).
  - Sets `x-middleware-user-id` for layout when user present.
  - **Public paths**: `/auth`, `/r/`, `/onboarding`, `/pricing`, `/survey`, `/checkout`, `/demo`, `/contact`, **`/api`**, `/launcher`. So **all /api routes are “public” at middleware level**; each route must enforce auth.

### 2.2 Gaps / risks

| Finding | Severity | Detail |
|--------|----------|--------|
| **/api is public at middleware** | Medium | Any new API route under `/api` that forgets to call requireAuth/requireOrg/requirePermission is **reachable unauthenticated**. **Recommendation:** Add a convention (e.g. all `/api/app/*` and `/api/orgs/*` require auth in a shared wrapper) or a middleware rule that at least requires a session for `/api/app/*` and `/api/orgs/*` (still need per-route org/permission checks). |
| **Prefetch bypass** | Low | When `Next-Router-Prefetch === '1'` or `purpose === 'prefetch'`, middleware returns without redirecting. Prefetch requests typically don’t include sensitive data; if any prefetched route returned PII without auth, that would be a bug in the route. No evidence of that. |

---

## 3. Route Guards (App Pages)

### 3.1 What exists

- **App layout** (`src/app/app/layout.tsx`): Calls `requireOrg()`; enforces billing lock (with platform-admin bypass). All `/app/*` pages run under this layout, so they all get requireOrg.
- **Admin layout** (`src/app/app/admin/layout.tsx`): After requireOrg, checks `org_members.role` in `ADMIN_ROLES`; else redirects to `/app/dashboard`. **No** permission RPC.
- **Ops layout** (`src/app/app/ops/layout.tsx`): Uses `isOperationsEnabled(orgId, userId)` (plan + platform-admin bypass); shows upgrade screen if not enabled.
- **Franchise layout** (`src/app/app/franchise/layout.tsx`): requireOrg only.
- **Individual pages**: Many use `requireOrg()` only; some use `requirePermission()` (e.g. executive, map). Detail pages (e.g. account `[id]`) use `requireOrg()` then query with `.eq('org_id', org.org_id)` so **entity is scoped to current org**.

### 3.2 Gaps / risks

| Finding | Severity | Detail |
|--------|----------|--------|
| **Pages that only requireOrg** | Low | Any page that only calls requireOrg and then runs a query with `org_id` from requireOrg is safe for tenant isolation **if** all queries use that org. **Risk:** New or modified pages that take an id from the URL and query without `.eq('org_id', org.org_id)` could leak another org’s data. Current account/detail pages correctly scope by org. |
| **Client Viewer / Crew** | Low | Admin layout excludes them (not in ADMIN_ROLES). Ops/Sales visibility is controlled by nav and by plan; role_permissions restricts client_viewer to e.g. reports.view. So Client Viewer cannot open admin; Crew cannot open admin. E2E (role-access.e2e.ts) partially covers this. |

---

## 4. Supabase RLS

### 4.1 What exists

- **Core helpers**: `is_org_member(p_org_id, p_user_id)` and `is_org_member(p_org_id)` (uses auth.uid()). SECURITY DEFINER, used in policies.
- **Accounts / facilities**: Policies “Org members can read/insert/update/delete” with `is_org_member(org_id, auth.uid())`. Account_users: “Org members can manage account_users for their accounts” (via account in org).
- **has_permission**: RPC uses `auth.uid()` and org_members + role_permissions. **Not spoofable** by client.
- **Franchisor/operator**: `is_franchisor_org(org_id)`, `is_operator_org(org_id)` exist; used in some policies and in JANIBEAR OS rules. Labor/crew data should be restricted for franchisor orgs; need to ensure all labor tables use these where required.

### 4.2 Gaps / risks

| Finding | Severity | Detail |
|--------|----------|--------|
| **RLS as second layer** | Info | Server actions and API routes that correctly filter by `org_id` from requireOrg are still safe if RLS is missing on a table, **as long as** the app never uses a raw client or service role for that table in a way that could leak. **Defense in depth:** Ensure every table with `org_id` has RLS so that any future bug or new code path cannot bypass app-level checks. |
| **New tables** | Medium | Any new table with tenant data must get RLS policies before going to production. Add to checklist. |

---

## 5. Server Actions and API Handlers

### 5.1 Safe patterns observed

- **org/switch** (`POST /api/org/switch`): Validates membership before setting cookie. **Correct.**
- **orgs/[orgId]/***: All use `requireOrgMember(orgId)` or `requireOrgPermission(orgId, ...)`. Path param orgId is the one checked. **Correct.**
- **billing/entitlements**: Validates membership for requested `org_id` (query or cookie). **Correct.**
- **app/risk/accounts/[accountId]**: requirePermission(ops.read), then queries with `.eq('org_id', orgId).eq('account_id', accountId)`. **Correct.**
- **account-users** (actions): requireOrg then `.eq('account_id', accountId).eq('org_id', org.org_id)` before using accountId. **Correct.**
- **launch-packet** (actions): requireOrg; createLaunchPacket and sendLaunchPacketToOps validate packet/account belong to org. **Correct.**
- **admin/users/disable, enable**: Platform admin or tenant admin with `activeOrgId === targetOrgId`. **Correct.**

### 5.2 Gaps / risks

| Finding | Severity | Detail |
|--------|----------|--------|
| **org/tokens/assign and change-plan** | Low | Body contains `org_id`. `requireOrgSeatAdmin(parsed.data.org_id)` validates membership and role for **that** org_id. So user cannot pass another org’s id and get success. **Correct.** |
| **Server actions that take only id** | Medium | Any action that takes e.g. `leadId`, `accountId`, `opportunityId` and does **not** re-verify that the entity belongs to current org (via `.eq('org_id', org.org_id)` or RLS) could be abused if RLS were missing. **Current state:** account-users, crm, leads, invoices, etc. either add `.eq('org_id', org.org_id)` or use Supabase client (RLS applies). **Recommendation:** Audit every server action that accepts an entity id and ensure it either filters by org in the same request or that RLS is in place. |
| **launch-plan.ts getLaunchPlanReadiness** | Low | Uses `opportunity.org_id` from DB for some queries; opportunity was fetched with `.eq('org_id', org.org_id)` in caller. Safe. |

---

## 6. Ways a User Could Fail Security (Break-Test Summary)

### 6.1 See another org’s data

- **Direct API with other org id:** `GET /api/orgs/{other_org_id}/members` → requireOrgPermission(other_org_id, ...) → user is not member → **403**. **Blocked.**
- **Entitlements with other org id:** `GET /api/billing/entitlements?org_id={other}` → membership check for that org → **403**. **Blocked.**
- **Org list:** `GET /api/org/list` returns only orgs where user is member (query by user_id). **Blocked.**
- **Account/lead/opportunity by id:** Pages and actions use requireOrg() then `.eq('org_id', org.org_id)`. So even if attacker guessed another org’s account id, the query returns no row (or RLS would hide it if they used a client that bypassed app filter). **Blocked** (with RLS as backup).
- **Cookie tampering:** `active_org_id` is httpOnly; set only by middleware (after membership) or org/switch (after membership). **Cannot** set to another org from browser. **Blocked.**

### 6.2 Access routes they should not see

- **Admin:** Admin layout checks role in ADMIN_ROLES; Crew and Client Viewer are not in it → redirect to dashboard. **Blocked.**
- **Ops (plan-gated):** Ops layout shows upgrade screen for non–ops-enabled plans. **Blocked.**
- **Direct URL to /app/admin/users as Crew:** Layout runs first; redirect. **Blocked.**
- **API without permission:** e.g. GET /api/orgs/{own_org}/members requires ORG_MANAGE_USERS; Crew lacks it → **403**. **Blocked.**

### 6.3 Mutate records outside their role

- **Update member role (e.g. to owner):** updateMemberRole calls requirePermission(..., 'settings.users.manage'). Only roles with that permission (owner, admin in role_permissions) succeed. **Blocked.**
- **Invite to org:** POST /api/orgs/[orgId]/invites uses requireOrgPermission(orgId, ORG_MANAGE_USERS). **Blocked** for Crew/Sales/Client Viewer.
- **Disable user in another org:** admin/users/disable checks activeOrgId === targetOrgId for tenant admin. **Blocked.**

### 6.4 Bypass frontend-only permission checks

- **If a page only hid a button** but the underlying action or API did not check permission, user could call the action or API directly. **Observed:** Mutations (invite, update role, disable user) are gated by requirePermission or requireOrgPermission in API/actions. **No bypass** for the tested flows.
- **PermissionGate (client):** Used for conditional UI. Server actions and APIs that perform the same operation must enforce permission; they do. **No bypass** identified.

---

## 7. Missing Tests

| Gap | Current state | Risk |
|-----|----------------|------|
| **Tenant isolation – entity by id** | tenant-isolation.e2e.ts hits orgs/[other]/members and billing/entitlements?org_id=other; org list. | No test that e.g. GET /api/app/risk/accounts/{other_org_account_id} returns 403 or empty when account belongs to another org. |
| **Role-based API (Crew vs Sales)** | role-access.e2e.ts checks admin page and Cub/ops upgrade; Client Viewer admin; Crew sales. | No explicit API test that Crew gets 403 on a Sales-only or Ops-only API (e.g. a pipeline or risk endpoint). |
| **Franchisor vs operator** | No E2E found. | No test that franchisor org cannot access labor/crew APIs or that operator can. |
| **Org switch then cross-org request** | No test. | No test that after switching to org A, user cannot access org B’s data by id (e.g. account id from org B). |
| **Admin layout vs permission** | role-access checks final URL. | No test that a user with manager role but without org.manage_users gets 403 when calling invite API. |
| **Platform admin cross-org** | No test. | No test that platform admin can access another org’s data (e.g. members) when intended. |

---

## 8. Proposed E2E Tests (Most Dangerous Cases)

### 8.1 High priority

1. **Cross-org entity access (by id)**  
   - Log in as user in org A.  
   - Obtain an account id (or lead id, opportunity id) that belongs to org B (e.g. from seed or fixture).  
   - GET /api/app/risk/accounts/{org_b_account_id} (or equivalent detail API that takes entity id).  
   - **Assert:** 403 or 200 with null/empty data (no org B data returned).

2. **Crew cannot call Ops/Sales mutation APIs**  
   - Log in as Crew.  
   - POST (or PATCH) to an endpoint that requires ops.write or sales permission (e.g. risk intervention, or invite).  
   - **Assert:** 403.

3. **Client Viewer cannot call org.manage_users API**  
   - Log in as Client Viewer.  
   - GET /api/orgs/{own_org_id}/members.  
   - **Assert:** 403.

### 8.2 Medium priority

4. **Org switch then isolation**  
   - Log in as user in org A; switch to org A via org/switch.  
   - Call an API that returns org-scoped list (e.g. accounts or leads).  
   - **Assert:** Only org A data. Then use an account id that belongs to org B and call a detail API; **assert:** 403 or not found.

5. **Tenant isolation – billing entitlements**  
   - Already in tenant-isolation.e2e.ts (GET billing/entitlements?org_id=other → 403). Keep and extend to ensure response does not leak other org’s module names.

6. **Sales role cannot access Ops-only API**  
   - Log in as Sales (Grizzly).  
   - GET /api/app/ops/crews or GET /api/app/ops/service-deployments.  
   - **Assert:** 200 with own org data only, or 403 if permission is ops.read and Sales does not have it (align with role_permissions).

### 8.3 Lower priority

7. **Franchisor cannot access labor data** (if applicable)  
   - Log in as user in a franchisor org.  
   - Call an API that returns crew or labor details.  
   - **Assert:** 403 or empty, per JANIBEAR OS.

8. **Platform admin can access other org** (positive test)  
   - Log in as platform admin; set impersonation or call an API with another org’s id where platform admin is allowed.  
   - **Assert:** 200 and data for that org (no cross-tenant leak to wrong org).

---

## 9. Severity-Ranked Findings List

| # | Severity | Finding | Location | Fix / recommendation |
|---|----------|--------|----------|------------------------|
| 1 | **High** | New API routes under /api are not protected by middleware; any new route that omits auth allows unauthenticated access. | middleware.ts, PUBLIC_PATHS | Add convention or middleware so `/api/app/*` and `/api/orgs/*` require session; document that every new API must enforce auth + org/permission as needed. |
| 2 | **High** | Server actions that accept entity ids (leadId, accountId, etc.) must always scope by org or rely on RLS. A single missing `.eq('org_id', org.org_id)` or new action that trusts id without RLS could leak data. | All server actions taking id args | Audit all such actions; add E2E that requests another org’s entity by id and assert 403 or empty. |
| 3 | **Medium** | active_org_id cookie is the sole source of “current org” for many paths; only middleware and org/switch set it. If any other code set this cookie without membership check, cross-org access would be possible. | auth.ts, user-context.ts, org/switch, middleware | Document that only middleware and org/switch may set active_org_id; centralize cookie writes if possible. |
| 4 | **Medium** | Admin layout gates by role list (owner, admin, manager), not by permission. If role_permissions and layout diverge, some users might see admin UI but get 403 on mutations. | admin/layout.tsx | Prefer requirePermission (e.g. org.manage_users or a dedicated “admin” permission) in layout so layout and API stay aligned. |
| 5 | **Medium** | New tables with org_id may be added without RLS. | Migrations | Checklist: every new tenant table must have RLS before production. |
| 6 | **Low** | createLead uses getCurrentOrg() instead of requireOrg(); no security bug but inconsistent. | actions/leads.ts | Use requireOrg() for consistency. |
| 7 | **Low** | Prefetch requests skip redirect in middleware; low risk if routes never return PII without auth. | middleware | No change required; note in doc. |
| 8 | **Info** | RLS is second layer; app-level org scoping is primary. Ensure all org-scoped tables have RLS for defense in depth. | Supabase migrations | Review RLS coverage for all tables with org_id. |

---

## 10. Role Matrix (Break-Test Summary)

| Role | Cross-org data | Admin routes | Ops routes (plan ok) | Sales routes | Mutate members | Mutate billing |
|------|----------------|-------------|----------------------|-------------|----------------|----------------|
| Owner | Blocked (membership + RLS) | Allowed (layout + API) | Allowed | Allowed | Allowed (permission) | Allowed (seat admin) |
| Admin | Blocked | Allowed | Allowed | Allowed | Allowed | Allowed |
| Manager | Blocked | Allowed (layout) | Allowed | Allowed | Depends on role_permissions | No (unless in seat admin) |
| Sales (Grizzly) | Blocked | Blocked (layout) | Plan-gated | Allowed | Blocked | Blocked |
| Operations (Kodiak) | Blocked | Blocked | Allowed | Allowed | Blocked | Blocked |
| Supervisor | Blocked | Blocked | Allowed | Depends | Blocked | Blocked |
| Crew (Cub) | Blocked | Blocked | Plan-gated / upgrade | Blocked (E2E) | Blocked | Blocked |
| Client Viewer | Blocked | Blocked | Blocked | Blocked | Blocked | Blocked |
| Independent Owner | Same as Owner in own org | Yes | Yes | Yes | Yes | Yes |
| Area Franchisor | Blocked to other orgs; own org only | Yes (own org) | Per plan; labor visibility per JANIBEAR OS | Yes | Yes (own org) | Yes |
| Unit Franchisee | Blocked to other orgs | Yes (own org) | Yes (own org) | Yes | Yes (own org) | Yes |

---

*Audit based on codebase as of 2025-03-03. Run the proposed E2E tests and fix any regressions.*
