# JaniBear Permissions Model (Simplified)

## Single source of truth: **effective role**

- **Effective role** = `role_enum` when set, otherwise `role` (legacy text).
- Use **one** of these for all permission checks in the app and API:
  - **DB:** view `org_members_effective` exposes `effective_role` (and `capabilities`).
  - **App:** `user-context.ts` exposes `roleEnum ?? role` as the single role to check.

## Role sets by org type

| Org type        | Allowed roles (prefix) | Examples |
|-----------------|------------------------|----------|
| Franchisor      | `fr_*`                 | fr_admin, fr_sales, fr_ops, fr_finance, fr_auditor |
| Franchisee / Independent | `op_*` | op_admin, op_sales, op_ops_manager, op_supervisor, op_crew, op_finance |

The DB trigger on `org_members` enforces: franchisor → only `fr_*`, operator → only `op_*`.

## Capabilities (optional overrides)

`capabilities` is a JSONB map of **override flags**. Use sparingly; prefer role for most behavior.

Suggested keys (all optional):

- `can_view_financials` / `can_edit_financials`
- `can_manage_users` / `can_manage_crews`
- `can_run_qc` / `can_order_supplies` / `can_connect_quickbooks`

**Rule:** If a capability is not set, derive from role (e.g. admin → all, crew → minimal). Only set capabilities when you need to grant an exception (e.g. op_sales can_edit_financials).

## Module access (entitlements)

Module access comes from **plan + addons**, not from role:

- `org_has_module(org_id, module_key)` — e.g. `sales`, `ops`, `finance`, `compliance`, `supplies`, `franchisor_brand_ops`.
- In the app, use `hasModule(context, 'ops')` etc. for route/UI gating.

## Summary

1. **Role:** Use **effective role** (role_enum ?? role) for “who can do what” within an org.
2. **Capabilities:** Optional overrides; don’t duplicate role logic.
3. **Modules:** From subscription/plan; use for feature flags and route groups.
