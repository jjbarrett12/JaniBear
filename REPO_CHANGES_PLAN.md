# JaniBear Multi-Tenant Plans, Add-ons & Access — Repo Changes Plan

## Summary
Single codebase with **layers**: plans (Cub / Grizzly / Kodiak), add-ons (HelpHubQR, LiDAR), per-tenant overrides, role-based permissions, and feature flags. All multi-tenant safe with Supabase RLS; no separate deployments per plan.

## Existing Repo Mapping
- **Tenant** = `organizations` (org_id everywhere). No new "tenants" table.
- **Users** = `auth.users` + `profiles` (id = auth.users.id).
- **Memberships** = `org_members` (org_id, user_id, role, status, role_enum, capabilities).
- **Plans / subscriptions** = `plans` (code PK), `org_subscriptions` (org_id, plan_code).
- **Add-ons** = `org_addons` (org_id, addon_code, status).
- **Auth** = `src/lib/auth.ts` (getCurrentUser, requireOrg, getCurrentOrg), `src/lib/supabase/middleware.ts`.
- **Context** = `src/lib/user-context.ts` (getUserContext, hasModule, hasCap, isOperator).
- **Guards** = `src/lib/api-guard.ts` (requireApiAuth, requireApiOrg, requireApiModule).
- **Permissions** = `src/lib/permissions.ts` (hasPermission, requirePermission).

---

## Phase 1 — Data Model (Supabase)

### New / Updated Files
| Path | Purpose |
|------|---------|
| `supabase/migrations/043_plans_addons_entitlements_rls.sql` | Features, plan_features, addons, addon_features, tenant_feature_overrides, role_permissions; RLS; get_effective_entitlements; Cub/Grizzly/Kodiak + HelpHubQR/LiDAR seed |
| `supabase/migrations/044_tenant_status_platform_admin.sql` | organizations.status, profiles.is_platform_admin, org_members status 'disabled' |

### Schema Additions (Phase 1)
- **features** — id, code, name (e.g. lidar, helphub_qr, sales_crm, ops_qc).
- **plan_features** — plan_code → feature_id, enabled (plan baseline).
- **addons** — id, code, name (HelpHubQR, LiDAR).
- **addon_features** — addon_id → feature_id, enabled.
- **tenant_feature_overrides** — org_id, feature_id, enabled, reason (per-tenant override).
- **role_permissions** — role (text), feature_id, can_read, can_write.
- **organizations** — add `status` (active, suspended).
- **profiles** — add `is_platform_admin`.
- **org_members** — allow status `disabled` (customer access off).

### RLS
- All new tables: RLS enabled; policies scoped to `is_org_member(org_id, auth.uid())` or platform-admin where needed. `plans`, `features`, `addons`, `role_permissions` readable by authenticated.

### Effective Entitlements
- Function or view: **get_effective_entitlements(p_org_id)** returns (feature_code, enabled). Logic: (plan_features OR addon_features) merged, then tenant_feature_overrides applied.

---

## Phase 2 — Entitlement Resolution (Server)

### New / Updated Files
| Path | Purpose |
|------|---------|
| `src/lib/access.ts` | getEffectiveAccess(tenantId, userId): plan, addons, effective_features, role_permissions; uses RPC or minimal queries |

---

## Phase 3 — Route / Page Gating

### New / Updated Files
| Path | Purpose |
|------|---------|
| `src/components/access/feature-gate.tsx` | `<FeatureGate feature="helphub_qr">` — client-safe hide + server guard |
| `src/lib/access.ts` | requireTenantMember, requireFeature, requirePermission (server) |
| `src/app/app/layout.tsx` | Optional layout guard using requireTenantMember + tenant status |
| Example: LiDAR module page + API | Wrap with FeatureGate + requireFeature('lidar') in API |
| Example: HelpHubQR module page + API | Wrap with FeatureGate + requireFeature('helphub_qr') in API |

---

## Phase 4 — Tenant Admin & Password Control

### New / Updated Files
| Path | Purpose |
|------|---------|
| `src/app/api/admin/users/disable/route.ts` | POST — disable membership (status = disabled) |
| `src/app/api/admin/users/enable/route.ts` | POST — re-enable membership |
| `src/app/api/admin/users/reset-password/route.ts` | POST — send password reset email (Supabase auth) |
| `src/app/api/admin/users/set-password/route.ts` | POST — service role; platform superadmin only |
| `src/app/api/admin/tenants/set-plan/route.ts` | POST — set org plan |
| `src/app/api/admin/tenants/toggle-addon/route.ts` | POST — enable/disable addon |
| `src/app/api/admin/tenants/override-feature/route.ts` | POST — set tenant feature override |
| `src/app/app/admin/page.tsx` | Platform admin only (redirect if !is_platform_admin) |
| `src/app/app/settings/team/page.tsx` | Tenant admin: invites, roles, disable user, force reset (reuse/extend existing if any) |

---

## Phase 5 — Billing Ready (No Stripe Yet)

### New / Updated Files
| Path | Purpose |
|------|---------|
| `org_subscriptions` / `tenant_entitlements` | Keep source in org_subscriptions; optional `source_of_truth` or audit column in migration |
| `supabase/migrations/045_billing_ready_entitlements.sql` | updated_at, source_of_truth on org_subscriptions |
| `supabase/scripts/seed_plans_entitlements.sql` | One tenant, superadmin, tenant admin, staff, customer; Cub plan + LiDAR addon |

---

## File Path Summary (Exact)

```
supabase/migrations/043_plans_addons_entitlements_rls.sql   (new)
supabase/migrations/044_tenant_status_platform_admin.sql    (new)
supabase/migrations/045_billing_ready_entitlements.sql       (new)
src/lib/access.ts                                           (new)
src/components/access/feature-gate.tsx                       (new)
src/app/app/layout.tsx                                      (update guard)
src/app/api/admin/users/disable/route.ts                     (new)
src/app/api/admin/users/enable/route.ts                     (new)
src/app/api/admin/users/reset-password/route.ts             (new)
src/app/api/admin/users/set-password/route.ts               (new)
src/app/api/admin/tenants/set-plan/route.ts                 (new)
src/app/api/admin/tenants/toggle-addon/route.ts              (new)
src/app/api/admin/tenants/override-feature/route.ts         (new)
src/app/app/admin/page.tsx                                  (update — platform admin card when is_platform_admin)
src/app/app/admin/platform/page.tsx                         (new — platform admin stub)
src/app/app/settings/page.tsx                               (update — Team card + link)
src/app/app/settings/team/page.tsx                         (new — tenant admin team stub)
supabase/scripts/seed_plans_entitlements.sql                 (new)
```

---

## Rules Respected
- No separate builds per plan; conditional UI and API checks only.
- No client-only checks; APIs enforce membership, feature, and permission.
- RLS on every new table; is_org_member / platform admin where appropriate.
- Aligns with existing folder structure and auth (org_id, requireOrg, getUserContext).
