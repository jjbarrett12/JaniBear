# Platform Ownership Audit — Deliverable

## 1. Exact files touched

| File | Change |
|------|--------|
| `src/app/platform/layout.tsx` | **NEW** — Layout for `/platform/*`; calls `requirePlatformAdmin()`. |
| `src/app/platform/forbidden/page.tsx` | **NEW** — 403-style page when authenticated but not platform admin. |
| `src/app/platform/overview/page.tsx` | **NEW** — Platform console overview (tenant/user API links). |
| `src/lib/platform-guard.ts` | **UPDATED** — `getIsPlatformAdmin(userId)` with RPC + profiles fallback; `requirePlatformAdmin()` uses it. |
| `src/lib/access.ts` | **UPDATED** — `isPlatformAdmin` from `getIsPlatformAdmin(userId)` instead of profiles only. |
| `src/app/app/admin/platform/page.tsx` | **UPDATED** — Uses `getIsPlatformAdmin(userId)`; redirects to `/platform/forbidden` if not platform admin. |
| `src/components/onboarding/onboarding-form.tsx` | **UPDATED** — Tries `create_org_for_signup` RPC first; fallback to direct org/members insert; redirect to set-org-and-continue. |
| `supabase/migrations/052_profiles_platform_admin_readonly.sql` | **NEW** — Trigger blocks non–platform-admins from setting `profiles.is_platform_admin = true`. |
| `supabase/scripts/platform_ownership_audit.sql` | **NEW** — RLS policy list and test instructions for three user types. |

---

## 2. Final route guards

| Route / area | Guard | Behavior |
|--------------|--------|----------|
| `/platform/*` | Layout: `requirePlatformAdmin()` | No user → redirect `/auth/login`. User but not platform admin → redirect `/platform/forbidden`. |
| `/platform/forbidden` | None (layout still runs) | Layout runs first; if not platform admin, redirect to this page. |
| `/app/admin/platform` | Page: `requireOrg()` then `getIsPlatformAdmin(userId)` | Not platform admin → redirect `/platform/forbidden`. |
| `/api/admin/tenants/*` | `getEffectiveAccessForCurrentUser()`; require `isPlatformAdmin` | 403 if not platform admin. |
| `/api/admin/users/set-password` | Same | Platform admin only. |
| `/api/admin/users/disable` | `getEffectiveAccessForCurrentUser()` | Platform admin OR org admin for that org. |
| `/api/admin/users/enable` | Same | Same. |
| `/api/admin/users/reset-password` | Same | Same. |
| All other `/app/*` | Layout: `requireOrg()` | Org-scoped; no cross-org visibility in UI/API when filters applied. |

**Middleware:** `/platform` is not in `PUBLIC_PATHS`; unauthenticated requests to `/platform/*` hit the app and layout redirects to login.

---

## 3. Final SQL policy list (relevant to platform ownership)

**After 051 + 052:**

- **organizations**
  - SELECT: `is_platform_admin() OR is_org_member(id, auth.uid())`
  - INSERT: `is_platform_admin()` only (signup uses `create_org_for_signup`).
  - UPDATE: `is_platform_admin()` only.

- **org_members**
  - SELECT: `is_platform_admin() OR user_id = auth.uid() OR is_org_member(org_id, auth.uid())`
  - INSERT: `is_platform_admin() OR has_org_role(org_id, ['owner','admin'])` OR “Users can add own first membership” (first signup only).
  - UPDATE/DELETE: `is_platform_admin() OR has_org_role(org_id, ['owner','admin'])`.

- **platform_admins**
  - ALL: `is_platform_admin()` USING and WITH CHECK (only existing platform admins can read/write).

- **profiles**
  - SELECT: `auth.uid() = id` (+ same-org read in 022).
  - INSERT: `auth.uid() = id`.
  - UPDATE: `auth.uid() = id` + trigger 052: non–platform-admin cannot set `is_platform_admin = true`.

- **user_activity, platform_audit_log, org_invites (platform)**  
  - Various: `is_platform_admin()` for platform-wide access; org-scoped where applicable.

---

## 4. Test script (three user types)

Use `supabase/scripts/platform_ownership_audit.sql` to list policies. Manual checks:

**A) Normal user (authenticated, one org, not platform admin)**

1. Open `/platform/overview` → must redirect to `/platform/forbidden` (or login if not logged in).
2. In DB (as that user): `SELECT * FROM organizations` → only orgs where `is_org_member(id, auth.uid())`.
3. `SELECT * FROM platform_admins` → 0 rows (RLS).

**B) Org admin (owner/admin of one org, not platform admin)**

1. Can manage users only in own org (e.g. disable membership for same org).
2. Cannot create organizations (INSERT organizations blocked by RLS unless 051 not applied).
3. `/platform/overview` → redirect to `/platform/forbidden`.

**C) Platform admin (in `platform_admins` or `profiles.is_platform_admin = true`)**

1. `/platform/overview` and `/app/admin/platform` load.
2. Can list all orgs; can call `/api/admin/tenants/set-plan`, `/api/admin/users/set-password`, etc.
3. RLS: `SELECT * FROM organizations` returns all; `SELECT * FROM platform_admins` returns all.

**Signup**

- New user signs up → onboarding creates profile, then org via `create_org_for_signup` (if 051 applied) or direct insert.
- New user is never added to `platform_admins` and does not get `profiles.is_platform_admin = true` by signup.
- Trigger 052 prevents self-update of `is_platform_admin` to `true`.

---

## 5. Summary

- **Only whitelisted platform admins** can access `/platform/*`; guard is `requirePlatformAdmin()` in layout (RPC `is_platform_admin` + profiles fallback).
- **No org user** gets cross-org visibility: org-scoped tables use `is_org_member` / `has_org_role`; `organizations` SELECT is platform or member.
- **No broad authenticated policy:** 051 removes `USING (true)` from organizations; platform_admins and orgs INSERT/UPDATE are restricted.
- **Signup does not grant platform admin:** onboarding only creates profile + org + first membership; platform_admins is writeable only by existing platform admins; trigger 052 blocks self-assign of `is_platform_admin`.
