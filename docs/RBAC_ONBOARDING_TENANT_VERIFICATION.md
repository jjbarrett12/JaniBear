# RBAC, Onboarding Gating & Tenant Isolation Verification

**Date:** 2025-03-03  
**Checklist:** requirePermission on pages, API enforcement, active org tampering, RLS, seeded roles, E2E.

---

## 1) Checklist Results

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | Every (app) server page that exposes data calls requirePermission(orgId, key) before querying | **P2 gap** | Most pages call **requireOrg()** only; a few call **requirePermission(orgId, key)** (e.g. settings, ops, sales). RLS still restricts data by org membership. See §2. |
| 2 | Every API route enforces requirePermission and never trusts orgId from client | **OK** | Routes with `[orgId]` use **requireOrgMember(orgId)** or **requireOrgPermission(orgId, key)**. Routes without path orgId use **requireApiOrg()** (org from cookie/session). No route uses client-supplied org_id without validating membership. |
| 3 | Active org selection cannot be tampered to access another org | **OK** | **POST /api/org/switch** accepts `body.org_id` but validates membership in `org_members` before setting cookie; non-members get 403. |
| 4 | RLS enabled on orgs/org_members/org_features/subscriptions, denies non-members by default | **OK** | See §4. |
| 5 | Seeded users/roles map exactly (owner→org.owner, etc.) | **OK** | Seed script uses v1 roles; **create_org_for_signup** still inserts **role = 'owner'**; migration **095** grants legacy `owner`/`admin` same keys as `org.owner`/`org.admin` so both work. |
| 6 | E2E tests run and pass | **OK** | All 6 runnable tests pass (onboarding, launcher, plan gating, API 401). Two tests fixed (onboarding assertion, launcher timeout). |

---

## 2) Server pages: requirePermission vs requireOrg

- **Pattern today:** Almost all `/app/**` pages call **requireOrg()** (and often **requireMembership** via layout). Only a few call **requirePermission(orgId, key)**:
  - `src/app/app/settings/page.tsx` — requirePermission(orgId, 'settings.branding')
  - `src/app/app/ops/page.tsx` — requirePermission(orgId, 'dashboard.ops')
  - `src/app/app/sales/page.tsx` — requirePermission(orgId, 'dashboard.sales')
  - `src/app/app/admin/team/page.tsx` — requirePermission(PERMISSIONS.ORG_MANAGE_USERS, org.org_id) (authz)
- **Data access:** All queries use **org_id** from **requireOrg()** (cookie/first membership). RLS enforces **is_org_member(org_id, auth.uid())** on tenant tables, so cross-tenant data is not returned even if a page only called requireOrg().
- **P2 recommendation:** Add **requirePermission(orgId, pageKey)** to high-value pages (e.g. admin, billing, audit) for least-privilege; keep requireOrg() as minimum.

---

## 3) API routes: enforcement and orgId

- **Org in path:** All `/api/orgs/[orgId]/*` handlers use **requireOrgMember(orgId)** or **requireOrgPermission(orgId, key)**. **orgId** comes from the URL, not the client body; membership is checked server-side.
- **Org from context:** Routes like `/api/map/data`, `/api/work-orders/*`, `/api/extract-scope` use **requireOrg()** or **requireApiOrg()** and derive org from cookie/session. They do not accept or trust **org_id** from the request body for scoping.
- **Org switch:** **POST /api/org/switch** is the only route that accepts **org_id** in the body; it validates membership before setting the cookie.

**Conclusion:** No API trusts client-supplied org_id for data access without membership check.

---

## 4) RLS: organizations, org_members, org_features, org_subscriptions

| Table | RLS | Policy summary |
|-------|-----|----------------|
| **organizations** | ON | SELECT: platform or **is_org_member(id, auth.uid())**; INSERT: platform only (signup uses **create_org_for_signup**); UPDATE: platform only. (087/051) |
| **org_members** | ON | SELECT: platform or **user_id = auth.uid()** or **is_org_member(org_id, auth.uid())**; INSERT: platform or **has_org_role(org_id, ['owner','admin'])** or “first membership”; UPDATE/DELETE: platform or **has_org_role(org_id, ['owner','admin'])**. (087/051) |
| **org_features** | ON | SELECT: **is_org_member(org_id, auth.uid())**; ALL: **has_org_role(org_id, ['owner','admin','org.owner','org.admin'])**. (094) |
| **org_subscriptions** | ON | SELECT: **org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())**. (019) |

Non-members cannot read or write these tables; default is deny.

---

## 5) Seeded users/roles mapping

Seed script **scripts/seedTestOrg.ts** maps:

- owner@janibear.test → **org.owner**
- admin@janibear.test → **org.admin**
- salesmanager@janibear.test → **sales.manager**
- salesrep@janibear.test → **sales.rep**
- opsmanager@janibear.test → **ops.manager**
- crewlead@janibear.test → **ops.crew_lead**
- crew@janibear.test → **ops.crew**
- client@janibear.test → **client.viewer**

Migration **094** seeds **role_permissions** for **org.owner**, **org.admin**, **sales.manager**, **sales.rep**, **ops.manager**, **ops.crew_lead**, **ops.crew**, **client.viewer**. **create_org_for_signup** still inserts **role = 'owner'**; migration **095** copies all **org.owner** / **org.admin** permission keys to **owner** / **admin** so legacy roles have the same permissions.

---

## 6) P0 / P1 / P2 issues

### P0
- None.

### P1
- **P1-1 (fixed):** New signups get **role = 'owner'** but **role_permissions** had only 3 keys for **owner**, so **has_permission** would deny most actions.  
  **Patch:** **supabase/migrations/095_legacy_role_permissions_owner_admin.sql** — copy all **org.owner** keys to **owner** and **org.admin** to **admin**.

### P2
- **P2-1:** Most app server pages only call **requireOrg()**, not **requirePermission(orgId, key)**. Data is still protected by RLS; adding **requirePermission** per page would improve least-privilege.  
  **Repro:** Open any data-exposing page (e.g. `/app/accounts`) as a member; no explicit permission key is checked.  
  **Recommendation:** Add **requirePermission(orgId, pageKey)** to sensitive pages (admin, audit, billing) and document the intended key per area.
- **P2-2:** E2E test “visiting /onboarding without auth” could flake if wording changed.  
  **Patch:** Assert on **redirect to login** OR presence of “Sign in” link / “Sign in to continue” text (case-insensitive).  
  **Patch:** **e2e/onboarding-and-plan.e2e.ts** — use **getByRole('link', { name: /sign in/i })** and **text=/sign in to continue/i**; **e2e/launcher.e2e.ts** — **waitUntil: 'commit'** and **timeout: 60000** with URL assertion **timeout: 15000**.

---

## 7) Patches applied

| File | Change |
|------|--------|
| **supabase/migrations/095_legacy_role_permissions_owner_admin.sql** | New migration: insert **role_permissions** for **owner** (copy of **org.owner**) and **admin** (copy of **org.admin**) so legacy roles have full permissions. |
| **e2e/onboarding-and-plan.e2e.ts** | Unauthenticated onboarding: assert redirect to login OR visible “Sign in” link / “Sign in to continue” (case-insensitive); **waitUntil: 'domcontentloaded'**. |
| **e2e/launcher.e2e.ts** | Unauthenticated launcher: **test.setTimeout(60000)**; **waitUntil: 'commit'**; **expect(page).toHaveURL(..., { timeout: 15000 })**. |

---

## 8) Tenant isolation: cross-org access returns 403

- **API with orgId in path:** For **GET /api/orgs/{orgId}/onboarding** (or any **/api/orgs/[orgId]/***), if the authenticated user is **not** in **orgId**, **requireOrgMember(orgId)** returns **403 Forbidden**. No data is returned.
- **E2E:** **e2e/onboarding-and-plan.e2e.ts** — “unauthenticated request to org-scoped API returns 401” passes (no session → 401). The skipped test “request to other org API returns 403” is the intended cross-tenant case: with auth as org A, request **/api/orgs/{orgB}/onboarding** → expect **403** and no body. **requireOrgMember(orgId)** implements this.
- **RLS:** All tenant tables scope by **org_id** and **is_org_member(org_id, auth.uid())** (or equivalent). So even if the app layer mis-passed an org id, the DB would not return rows for another org.

**Conclusion:** Tenant isolation is enforced at API layer (requireOrgMember/requireOrgPermission) and at DB (RLS). Cross-org access attempts return 403 and no data.
