# JANIBEAR Authorization Model

**Purpose:** Harden authorization so owners and admins are never incorrectly blocked while keeping tenant isolation strict. All permission checks are enforced server-side; plan/feature gating is separate from authorization.

---

## 1. Role definitions

### 1.1 Scope

| Scope | Description |
|-------|-------------|
| **Platform** | Cross-tenant; super admin only. |
| **Org** | Within a single organization. |

### 1.2 Canonical org roles

| Role key | Display (examples) | Description |
|----------|-------------------|-------------|
| **owner** | Owner (Independent), Owner (Area Franchisor), Owner (Unit Franchisee) | Full control within the org. All org-scoped permissions granted. |
| **org.owner** | Same as owner | Legacy/key alias; same as owner. |
| **admin** | Admin | Full control within the org; same permission set as owner for org scope. |
| **org.admin** | Admin | Legacy alias; same as admin. |
| **ops_manager** | Ops Manager | Operations, crews, quality, launch. |
| **sales_manager** | Sales Manager | Sales, pipeline, launch. |
| **sales_rep** | Sales Rep | Sales rep. |
| **supervisor** | Supervisor | Field supervisor. |
| **crew_member** | Crew Member | Crew member. |
| **client_viewer** | Client Viewer | Read-only client. |
| **franchisor_admin** | Franchisor Admin | Franchisor network admin (org scope). |

Stored in `org_members.role` (text) or `org_members.role_enum` when present. **Owner-equivalent roles** (for bypass rules): `owner`, `org.owner`, `admin`, `org.admin`. These receive all org-scoped permissions without enumerating each key.

### 1.3 Platform role

| Role key | Description |
|----------|-------------|
| **super_admin** | Platform super admin. Bypasses all org and platform checks. Not stored in org_members; from `profiles.is_site_admin`, `SITE_ADMIN_USER_IDS`, or platform_admins. |

---

## 2. Permission definitions

### 2.1 Canonical permission catalog (governance keys)

Single source of truth: `src/lib/auth/governance-permissions.ts` and DB `gov_permissions`. All server and RLS checks use these keys (or legacy aliases mapped to them).

**Domains:**

| Domain | Permissions (key) |
|--------|-------------------|
| **sales** | sales.dashboard.view, sales.leads.view, sales.leads.create, sales.walkthroughs.create, sales.proposals.create, sales.proposals.approve, sales.deals.close |
| **launch** | launch.queue.view, launch.queue.accept, launch.handoffs.create, launch.handoffs.update |
| **ops** | ops.dashboard.view, ops.accounts.view, ops.accounts.create, ops.accounts.update, ops.tasks.*, ops.crews.* |
| **quality** | quality.inspections.view/create/complete, quality.issues.create/resolve, quality.risk.view |
| **org** | org.users.view/invite/update_role, org.settings.view/manage, org.templates.manage, org.integrations.manage, org.ai.manage |
| **billing** | billing.view, billing.subscription.manage, billing.payment_methods.manage, billing.invoices.view, billing.addons.manage |
| **reports** | reports.view, reports.export |
| **financials** | financials.view, financials.manage |
| **franchise** | franchise.network.view, franchise.network.audit, franchise.franchisees.manage |
| **platform** | platform.orgs.view/manage, platform.users.impersonate, platform.billing.adjust, platform.settings.manage, platform.audit.view |

**Settings entry point:** Broad access to `/app/settings` (any org member can open Settings). Section-level restrictions:

- **Profile:** Everyone (settings.view / settings.profile.edit).
- **Organization / Branding:** org.settings.view, org.settings.manage.
- **Team / Users:** org.users.view, org.users.invite, org.users.update_role.
- **Billing:** billing.view, billing.subscription.manage, etc.
- **AI Control Center:** org.ai.manage (or settings.ai legacy).

---

## 3. Role–permission matrix

| Role | Sales | Launch | Ops | Quality | Org | Billing | Reports | Financials | Franchise (if applicable) |
|------|-------|--------|-----|---------|-----|---------|---------|------------|----------------------------|
| **owner, org.owner, admin, org.admin** | All | All | All | All | All | All | All | All | All (franchisor org) |
| ops_manager | — | View/Accept | All | All | users.view, settings.view | — | view | — | — |
| sales_manager | All | All | — | — | users.view, settings.view | — | view | — | — |
| sales_rep | Limited (see gov_role_permissions) | View/Accept | — | — | — | — | — | — | — |
| supervisor | — | — | tasks, crews (limited) | inspections, issues | — | — | — | — | — |
| crew_member | — | — | assigned tasks, proof | — | — | — | — | — | — |
| client_viewer | — | — | — | score read | — | — | — | — | — |
| franchisor_admin | — | — | — | — | — | — | — | — | Network/audit |

**Implementation:** DB `gov_role_permissions` + legacy `role_permissions`; owner/admin bypass in `has_org_permission` grants all org-scoped permissions so owners/admins are never blocked even if a key is missing from the matrix.

---

## 4. Plan / feature gating separated from authorization

- **Authorization:** “Can this user perform this action in this org?” — enforced via permissions (and owner/admin bypass). No plan or feature flag.
- **Plan/feature gating:** “Does this org have this plan or add-on?” — e.g. LiDAR, HelpHub, AI. Enforced after auth:
  - User must be authenticated and have org membership.
  - User must have the required permission for the action.
  - Then check plan/feature (e.g. `requireFeature({ orgId, feature: 'addon.lidar' })` or entitlement).

Do not use plan or feature flags to deny permission; use them to hide or disable features that are not available on the current plan.

---

## 5. Super-admin bypass rules

1. **Who:** User is super admin if any of: `profiles.is_site_admin`, `SITE_ADMIN_USER_IDS` env, or platform admin (`platform_admins` / `profiles.is_platform_admin`).
2. **Effect:** For any permission check (org or platform), if the user is super admin, the result is **allowed**.
3. **Where:** Implemented in DB `has_permission` / `is_site_admin()` and in server helpers `isSiteAdmin(userId)` before calling RPC.

---

## 6. Owner-role rules

1. **Who:** Org member with role in `('owner', 'org.owner', 'admin', 'org.admin')` (case-insensitive).
2. **Effect:** Within that org, for any **org-scoped** permission (all domains except `platform`), the result is **allowed**. Platform permissions are not granted by owner role.
3. **Where:** DB `has_org_permission` checks `is_org_owner_role(org_id)` first; if true, allow for any permission whose domain is not `platform`. App layer: `isOrgOwnerRole(role)` and `requirePermission` / `hasPermissionCached` skip RPC when user is org owner for that org.

---

## 7. Middleware behavior

- **Auth:** Refresh session; redirect unauthenticated users on protected paths to login. Do not enforce permissions in middleware (no role/permission checks).
- **Org:** When path or subdomain resolves an org slug, set `x-resolved-org-id` and optionally set `active_org_id` cookie after membership check. Layout/API use this plus cookie for active org.
- **No permission checks in middleware:** Permission enforcement happens in layout, page, server actions, and API routes.

---

## 8. Layout / page guard behavior

- **App layout:** Requires authenticated user and active org (`requireOrg()`). Optionally redirects by shell (e.g. franchisor → `/app/franchise`). Does not check individual permissions.
- **Settings layout:** No layout-level permission block; anyone who can reach `/app/settings` sees the Settings shell. Section-level (e.g. Team, AI, Billing) checks permissions and shows lock UI or redirect when missing.
- **Page-level:** Before rendering sensitive content or data, call `requirePermission(orgId, userId, permissionKey)` or `getSettingsPermissions()` and gate sections/actions. Owners and admins always pass (bypass).

---

## 9. Server action / API permission enforcement

- **Pattern:** Resolve `userId` (session) and `orgId` (cookie/header, never client body for tenant). Then:
  - If `isSiteAdmin(userId)` → allow.
  - If `isOrgOwner(orgId, userId)` → allow for org-scoped action.
  - Else `requirePermission(userId, orgId, permissionKey)` (or equivalent).
- **APIs:** Use `requireOrgPermission(orgId, permissionKey)` or `requirePermission` from server-auth; both respect super-admin and owner bypass.
- **Cron/internal:** Use service role only with secret or server-to-server auth; no user context.

---

## 10. Navigation visibility rules

- **Primary driver:** Shell (org type) from `organizations.shell` → Executive, Sales, Launch, Operations, System (or Franchisor sections). Not permission-based at section level so owners always see full nav.
- **Optional refinement:** Hide specific items by permission when not owner (e.g. “Admin” only if org.users.view or owner). Prefer showing nav and enforcing on page/API so owners are never blocked.

---

## 11. Files to create or edit

| File | Purpose |
|------|---------|
| `docs/AUTHORIZATION_MODEL.md` | This document. |
| `src/lib/auth/canonical.ts` | Canonical roles, permission list, `isOrgOwnerRole()`, `ORG_SCOPED_DOMAINS`, etc. |
| `src/lib/auth/permission-helpers.ts` | Use canonical owner bypass before RPC. |
| `src/lib/auth/server-auth.ts` | Use canonical owner check for requirePermission. |
| `supabase/migrations/124_owner_admin_org_permission_bypass.sql` | `has_org_permission`: if `is_org_owner_role(org_id)` then allow for non-platform permissions. |
| `src/lib/auth/permissions.ts` | Add `settings.ai` to SETTINGS_PERMISSION_KEYS. |
| `src/app/app/settings/ai/page.tsx` | Gate with `settings.ai` (or org.ai.manage) with fallback to org.settings.manage. |

---

## 12. Migration plan from old checks to new

1. **DB:** Apply migration 124 so `has_org_permission` (and thus `has_permission`) implements owner/admin bypass for org-scoped permissions. No change to role_permissions or gov_role_permissions required for owners.
2. **App:** Introduce `canonical.ts` with `ORG_OWNER_ROLES`, `isOrgOwnerRole(role)`, and optional `getOrgScopedPermissionKeys()`. In `permission-helpers.ts` and `server-auth.ts`, before calling `hasPermissionCached` or RPC, if user is org owner for that org, return allow for org-scoped permissions.
3. **Replace ad-hoc role checks:** Where code checks `role === 'owner' || role === 'admin'`, replace with `isOrgOwnerRole(role)` or keep and add a comment that it aligns with canonical.
4. **Settings:** Add `settings.ai` to SETTINGS_PERMISSION_KEYS; ensure AI page and other settings sections use permission keys (and owner bypass handles them).
5. **Nav:** No change required; nav is shell-based. Optionally add permission-based hiding for non-owners later.

---

## 13. Examples by area

| Area | Permission (examples) | Owner/Admin | Others |
|------|----------------------|-------------|--------|
| **Operations** | ops.dashboard.view, ops.accounts.view, ops.crews.view, ops.crews.assign | All allowed (bypass) | By role_permissions / gov_role_permissions |
| **Mapping** | maps.read, maps.write (or ops.* for ops map) | All allowed | By role |
| **Settings** | org.settings.view, org.settings.manage, org.users.view, org.ai.manage | All allowed | By role; settings entry point visible to all members |
| **Inspections** | quality.inspections.view, quality.inspections.create, quality.inspections.complete | All allowed | By role |
| **Sales** | sales.dashboard.view, sales.leads.view, sales.proposals.create, sales.deals.close | All allowed | By role |
| **Financials** | financials.view, financials.manage | All allowed | By role |

---

## 14. QA matrix (by owner/admin role)

| Role | Independent Owner | Area Franchisor Owner | Unit Franchisee Owner | Admin (any org type) |
|------|-------------------|------------------------|------------------------|----------------------|
| **Settings** | Full access to all sections | Full access | Full access | Full access |
| **Operations** | Full (accounts, crews, schedules, inspections, risk) | N/A (franchisor shell) | Full | Full (if ops shell) |
| **Maps** | View + write | View (franchisor) | View + write | Same as owner for that shell |
| **Sales** | Full (leads, pipeline, proposals) | Full (network) | Full | Full |
| **Launch** | View + accept + create/update handoffs | View (if visible) | View + accept + create/update | By role |
| **Billing** | View + manage | View + manage | View + manage | View + manage |
| **Financials** | View + manage | View + manage | View + manage | View + manage |
| **Inspections** | View + create + complete | — | View + create + complete | By role |
| **Team/Users** | View + invite + update role | Same | Same | Same |
| **AI Control** | Manage | Manage | Manage | Manage |

**Test:** For each role above, log in as that role and verify no 403 or lock screen on the listed areas; tenant isolation (other org’s data not visible) unchanged.
