# JANIBEAR Governance & Authorization

Production-grade permission-based authorization for multi-tenant SaaS with three ownership models: **independent**, **unit_franchisee**, **area_franchisor**.

## Principles

- **Authorization uses permissions, not role names.** Never branch on `role === 'owner'`; use `requirePermission(userId, orgId, 'org.settings.manage')` (or equivalent).
- **Multi-tenant:** All access is org-scoped; RLS and server helpers enforce tenant isolation.
- **Multiple roles per member:** `gov_member_roles` allows assigning several roles to one org member.
- **Direct overrides:** `gov_member_permissions` grants or revokes specific permissions per member.
- **Franchise visibility:** Franchisors with `franchise.network.view` can read franchisee data via `is_franchisor_of()` in RLS.

## Organization structure

- **ownership_model** (organizations): `independent` | `unit_franchisee` | `area_franchisor`
- **franchise_relationships:** Links `franchisor_org_id` (area_franchisor) to `franchisee_org_id` (unit_franchisee)

## RBAC (database)

- **gov_roles** — Role definitions (owner, ops_manager, sales_manager, sales_rep, supervisor, crew_member, client_viewer, franchisor_admin, super_admin).
- **gov_permissions** — Permission keys by domain (sales.\*, launch.\*, ops.\*, crews.\*, quality.\*, org.\*, billing.\*, reports.\*, financials.\*, franchise.\*, platform.\*).
- **gov_role_permissions** — Role → permission mapping.
- **gov_member_roles** — org_member_id → role_id (multiple roles per member).
- **gov_member_permissions** — org_member_id → permission_id, granted (true/false) for overrides.

**member_effective_permissions** (view): Effective (org_id, user_id, permission_key) from roles plus direct grants; direct revokes exclude a permission.

Legacy **role_permissions** (role text, permission_key text) and **org_members.role** remain; `has_org_permission` / `has_permission` check both the new gov view and legacy table.

## SQL helpers (for RLS)

- **is_org_member(target_org_id)** — Current user is in org (active or null status).
- **has_org_permission(target_org_id, required_permission)** — Current user has permission in org (gov or legacy).
- **is_franchisor_of(target_franchisee_org)** — Current user’s org is a franchisor of the given franchisee org.
- **get_franchisor_org_for_franchisee(franchisee_org_id)** — Returns current user’s franchisor org id when viewing that franchisee (for permission check).
- **get_my_permissions_for_org(org_id)** — Returns set of permission keys for current user in org (RPC, used by server).

## Server auth (TypeScript)

Use in **server actions**, **route handlers**, and **API endpoints**:

- **getCurrentUser()** — Current session user.
- **getOrgMembership(userId, orgId)** — Membership row or null.
- **getUserPermissionsForOrg(userId, orgId)** — Set of permission keys (gov + legacy).
- **requireOrgMember(userId, orgId)** — Throws if not a member.
- **requirePermission(userId, orgId, permissionKey)** — Throws if missing permission.
- **requireAnyPermission(userId, orgId, permissionKeys)** — Throws if missing all.

Import from `@/lib/auth/server-auth` and/or `@/lib/auth/permission-helpers`.

## Route guards / UI

- **PermissionGate** — Server component: `<PermissionGate permission="ops.crews.assign">{children}</PermissionGate>`. Hides children when the user lacks the permission. **UI hiding is never the only security;** always enforce in server actions and API.

## Audit

- **audit_logs** — event_type, target_table, target_id, metadata, actor_user_id.
- Use **logGovernanceAudit** from `@/lib/auth/governance-audit` for: user_invited, role_changed, crew_assignment, crew_replacement, proposal_approval, settings_changes, billing_changes.

## Code standards

- Never use logic like `if (role === 'owner')`; always use permission checks.
- Keep auth logic modular (permission-helpers, server-auth, RLS).
- Comment permission flow where non-obvious.
- Design for expansion (new permissions/roles) without refactoring.
