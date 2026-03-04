# RBAC: Roles, Permissions, and Enforcement

JaniBear uses **role-based access control** with permissions derived from roles. Enforcement is at **database (RLS)** and **API/server** — never trust the client.

## Core concepts

- **Organizations** own all data. Every tenant-owned table has `org_id` and RLS ON.
- **Users** belong to one or more orgs via `org_members` (one row per user per org).
- **Roles** are assigned per membership: `owner`, `admin`, `manager`, `sales`, `ops`, `inspector`, `cleaner`, `client_viewer`, etc.
- **Permissions** are derived from roles via the `role_permissions` table. The app uses permission keys (e.g. `org.manage_users`) to gate UI and API.

## Roles (canonical)

| Role           | Typical use                          |
|----------------|--------------------------------------|
| Owner          | Full org access; only role that can assign Owner |
| Admin          | Manage users, invites, settings; no billing if separated |
| Manager        | Dashboards, reporting, approve workflows |
| Sales / Sales rep | Pipeline, proposals, CRM views     |
| Ops            | Operations dashboards, inspections, tasks |
| Inspector      | Inspections, tasks                   |
| Cleaner (Crew) | Mobile checklists, complete tasks    |
| Client / Client viewer | Read-only reports, inspections  |

## Permission keys

Defined in `src/lib/permissions.ts` and in DB table `role_permissions`:

- **Org:** `org.manage_users`, `org.manage_settings`
- **Billing:** `billing.manage`
- **Dashboards:** `dashboard.management.view`, `dashboard.ops.view`, `dashboard.sales.view`
- **Tasks:** `tasks.manage`, `tasks.complete`
- **Inspections:** `inspections.view`, `inspections.create`
- **Reports:** `reports.view`

## Enforcement

1. **Database (RLS)**  
   All tenant tables use RLS. Helpers:
   - `is_org_member(org_id)` — user is active member.
   - `has_org_role(org_id, roles[])` — user has one of the roles.
   - `has_permission(org_id, permission_key)` — user’s role has that permission (via `role_permissions`).

2. **API routes**  
   Every `/api/orgs/[orgId]/*` route:
   - Validates session (`requireApiAuth`).
   - Validates org membership (`requireOrgMember(orgId)`).
   - Requires the right permission (`requireOrgPermission(orgId, permissionKey)`).
   - Uses Zod for request body validation.

3. **Pages**  
   Admin and other sensitive pages call `requirePermission(orgId, permissionKey)` after `requireOrg()` so users without permission are redirected (e.g. to dashboard).

## Security constraints

- **No privilege escalation:** Only an **Owner** can assign the **Owner** role. Enforced by DB triggers on `org_members` and `org_invites`.
- **Admin cannot grant beyond themselves:** Admins can assign admin/manager/sales/ops/etc., but not owner (trigger blocks it).
- **Every query scoped by org_id:** All reads/writes filter by the current org; RLS is the final enforcement layer.

## Adding a new permission

1. **DB:** Insert rows into `role_permissions` for each role that should have the new key:
   ```sql
   INSERT INTO role_permissions (role, permission_key) VALUES
     ('owner', 'my.new.permission'),
     ('admin', 'my.new.permission');
   ```
2. **App:** Add the key to `PERMISSIONS` in `src/lib/permissions.ts` and use `requirePermission(orgId, PERMISSIONS.MY_NEW_PERMISSION)` in the relevant page/API.

## Adding a new role

1. **DB:** Add the role to `org_members.role` check constraint if you use a strict enum (current schema uses `role TEXT` with application-level validation).
2. **DB:** Insert into `role_permissions` all permission keys this role should have.
3. **App:** Add the role to `ASSIGNABLE_ROLES` in `src/lib/team-roles.ts` if admins can assign it; add labels in Admin UI where roles are shown.

## Sidebar / nav and permissions

- **Server-side:** Routes under `/app/*` are protected by `requireOrg()` and, where needed, `requirePermission()`. Hiding a link does not grant access.
- **Optional:** To hide nav items the user cannot access, the layout can pass a set of “allowed permissions” (e.g. from `has_permission` RPC per key) into the nav factory and filter items that have a `permission` field. Today, shell (owner_operator / franchisee / franchisor) and feature flags drive the sidebar; permission-based filtering can be added in `navFactory` and the sidebar consumer.

## Files reference

| Area            | Files |
|-----------------|--------|
| Permissions     | `src/lib/permissions.ts`, `src/lib/authz.ts` |
| API auth        | `src/lib/api-auth.ts` |
| API routes      | `src/app/api/orgs/` (create org, members, invites, audit, onboarding) |
| Admin UI        | `src/app/app/admin/team/` (Users, Invites, Roles, Audit tabs) |
| DB              | Migration `090_rbac_permissions_and_onboarding.sql` (role_permissions, has_permission, org_settings, triggers) |
