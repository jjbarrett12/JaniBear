# JANIBEAR — System Debug Audit & Super Admin Setup

**Date:** 2025-03-03  
**Scope:** Full system debug, super-admin unlock (zero restrictions), and site-wide issues/fixes/recommendations.

---

## 1) What Was Fixed This Session

### Super admin (platform admin) and zero restrictions

- **Seed script by email:** Added `scripts/seed-super-admin-by-email.ts`. Run once to add a user as platform admin by email (resolves user id via Supabase Auth Admin API, then inserts into `platform_admins`).
- **Billing lock bypass:** In `src/app/app/layout.tsx`, when the current user is a platform admin (`getIsPlatformAdmin(userId)`), the billing lock redirect is skipped. Super admins can use the app even if the org is past_due/canceled/locked.
- **Plan/premium bypass:** Platform admins are treated as having full access everywhere:
  - **`src/lib/is-premium.ts`:** `getPlanType(orgId, userId)` and `isPremiumPlan(orgId, userId)` / `isOperationsEnabled(orgId, userId)` accept an optional `userId`; when the user is a platform admin, they return `'kodiak'` / `true`.
  - **App sidebar:** Passes current user id into `isPremiumPlan` and `getPlanType` so Operations is not shown as locked for platform admins.
  - **Ops layout:** Passes `getCurrentUserId()` into `isOperationsEnabled` so `/app/ops/*` renders content (no upgrade screen) for platform admins.
  - **University (library, catalog, course [id], courses [slug]):** Pass `getCurrentUserId()` into `isPremiumPlan` so premium courses and catalog are unlocked.
  - **Sales (proposals, launch-packets list/detail):** Pass `getCurrentUserId()` into `getPlanType` / `isOperationsEnabled`.
  - **Launch packet action:** `sendLaunchPacketToOps` uses `isOperationsEnabled(org.org_id, userId)` so platform admins can use the action.

**How to make yourself super admin (one-time):**

1. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (e.g. in `.env.local`).
2. Run:
   ```bash
   SUPER_ADMIN_EMAIL=your@email.com npx tsx scripts/seed-super-admin-by-email.ts
   ```
   Or: `npx tsx scripts/seed-super-admin-by-email.ts your@email.com`
3. Log in with that account; you will have no billing lock, no Grizzly/Kodiak plan restrictions, and full access to Operations, University, and all plan-gated features.

---

## 2) Issues Found and Fixed (Summary)

| Issue | Location | Fix |
|-------|----------|-----|
| No way to add super admin by email | — | Added `scripts/seed-super-admin-by-email.ts` |
| Billing lock applied to platform admins | `src/app/app/layout.tsx` | Check `getIsPlatformAdmin(userId)` and skip redirect when true |
| Grizzly/Kodiak gating blocked platform admins | `src/lib/is-premium.ts`, ops layout, sidebar, university, sales, launch-packet | Optional `userId` in plan helpers; when platform admin, return kodiak/premium/ops enabled |
| University/sales/ops pages didn’t pass userId to plan helpers | Multiple pages + `launch-packet.ts` | Pass `getCurrentUserId()` into `getPlanType` / `isPremiumPlan` / `isOperationsEnabled` |

---

## 3) Known Remaining Issues (From Pre-Launch Audit and Codebase)

| ID | Severity | Description | Where |
|----|----------|-------------|--------|
| B4 | P2 | **Plan source duality:** `organizations.plan` (is-premium, org-limits) vs `org_subscriptions.plan_code` (user-context, access). If checkout/admin only updates one, UI and gating can diverge. | See `docs/PRE_LAUNCH_AUDIT.md` §6, §7 |
| — | P2 | **organizations.plan column:** `getPlanType` in `is-premium.ts` reads `organizations.plan`. If that column is missing or not set, plan may default to `'cub'`. | `src/lib/is-premium.ts` |
| — | P2 | **Walkthroughs permission:** PRE_LAUNCH_AUDIT notes walkthroughs action was fixed to use `requirePermission` from authz; confirm no other actions import from `@/lib/permissions` for `requirePermission`. | Grep `requirePermission` / `@/lib/permissions` |
| — | P3 | **E2E tests:** Onboarding E2E, plan-gate (Cub vs Grizzly), and cross-tenant tests recommended; not all may be present or green. | `e2e/` |

---

## 4) Other Potential Malfunctions / Breaks to Watch

- **Auth redirect / session:** Past work fixed redirect loops and cookie handling; if you see “stuck on throttling” or blank after login, check middleware and `/api/auth/landing` and ensure `dynamic = 'force-dynamic'` on auth gates.
- **Dashboard navigation:** Marketing flash and forbidden flash were addressed previously; sidebar/nav should use `AppLink` / `next/link` and server-side permission checks only.
- **Authz errors:** Transient permission/membership failures redirect to `/app/authz-error` (not forbidden); confirm health endpoint `/api/health/authz` if you use it for monitoring.
- **War map:** Viewport culling and bounds-based queue were added for performance; if you see missing markers or wrong list, check bounds and filters.

---

## 5) Recommendations for This Week

1. **Run the super-admin seed** for your account (email only; never commit or log passwords):
   ```bash
   SUPER_ADMIN_EMAIL=jjbarrett12@gmail.com npx tsx scripts/seed-super-admin-by-email.ts
   ```
   Then log in and confirm you can access Ops, University premium content, and that billing lock does not apply.

2. **Plan source alignment (B4):** Decide on a single source of truth for plan (e.g. `org_subscriptions.plan_code`) or document and enforce “always update both” wherever plan is set (checkout, platform admin set-plan, etc.).

3. **Confirm `organizations.plan`:** Ensure the column exists and is set when an org gets a plan (e.g. via Stripe webhook or admin set-plan). If it’s missing, `getPlanType` will fall back to `'free'` → `'cub'`.

4. **Quick smoke test:** After seeding super admin, click through: Dashboard → Ops → University (premium course) → Sales → Launch Packets. No upgrade screens or billing redirect for your user.

5. **E2E:** Run existing Playwright tests (auth redirect, dashboard no marketing flash, forbidden no flash). Add or fix tests for onboarding and plan gating if not already covered.

6. **Env:** Add `SUPER_ADMIN_EMAIL` to `.env.local.example` only as a comment (e.g. “Optional: used when running seed-super-admin-by-email.ts”). Do not add real emails or any passwords.

---

## 6) File Change Summary

| File | Change |
|------|--------|
| `scripts/seed-super-admin-by-email.ts` | **New.** Seed platform_admins by email via Auth Admin API. |
| `src/app/app/layout.tsx` | Billing lock: skip redirect when `getIsPlatformAdmin(userId)`. |
| `src/lib/is-premium.ts` | Optional `userId` in `getPlanType`, `isPremiumPlan`, `isOperationsEnabled`; platform admin → kodiak/premium/ops. |
| `src/app/app/ops/layout.tsx` | Pass `getCurrentUserId()` to `isOperationsEnabled(org.org_id, userId)`. |
| `src/components/app/app-sidebar.tsx` | Pass `userId` to `isPremiumPlan` and `getPlanType`. |
| `src/app/app/university/library/page.tsx` | Pass `getCurrentUserId()` to `isPremiumPlan`. |
| `src/app/app/university/catalog/page.tsx` | Pass `getCurrentUserId()` to `isPremiumPlan`. |
| `src/app/app/university/course/[id]/page.tsx` | Pass `getCurrentUserId()` to `isPremiumPlan`; params as Promise. |
| `src/app/app/university/courses/[slug]/page.tsx` | Pass `getCurrentUserId()` to `isPremiumPlan`. |
| `src/app/app/sales/proposals/page.tsx` | Pass `getCurrentUserId()` to `getPlanType`. |
| `src/app/app/sales/launch-packets/page.tsx` | Pass `getCurrentUserId()` to `isOperationsEnabled`. |
| `src/app/app/sales/launch-packets/[id]/page.tsx` | Pass `getCurrentUserId()` to `isOperationsEnabled`. |
| `src/app/app/crm/opportunities/[id]/page.tsx` | Pass `getCurrentUserId()` to `getPlanType`. |
| `src/actions/launch-packet.ts` | Use `isOperationsEnabled(org.org_id, userId)` with `getCurrentUserId()`. |

---

*End of audit.*
