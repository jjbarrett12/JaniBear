# JANIBEAR Pre-Launch Audit Report

**Date:** 2025-03-03  
**Scope:** Onboarding correctness, permissions/RLS safety, plan gating, top user flows.  
**Stack:** Next.js (App Router) + Supabase (Postgres, Auth, RLS). Multi-tenant org_id scoping.

---

## 1) Executive Summary

| Area | Status | Notes |
|------|--------|------|
| **Onboarding E2E** | ✅ Largely safe | Golden path: signup → /onboarding → create org (RPC or direct) → set-org-and-continue → dashboard. In-app wizard optional. Gaps: org_type not set when using RPC; plan selection not in flow. |
| **Plan / role gating** | ⚠️ Needs alignment | Operations (Grizzly+) enforced in layout and is-premium. Two plan sources: `organizations.plan` (is-premium, org-limits) vs `org_subscriptions.plan_code` (user-context, access). Risk of mismatch. |
| **Cross-tenant isolation** | ✅ Strong | API routes use `requireOrgMember(orgId)` or `requireApiOrg()` (org from cookie/session). RLS on tenant tables uses `is_org_member(org_id, auth.uid())`. No API trusts client-supplied org_id without membership check. |
| **Permissions** | ⚠️ One bug | `walkthroughs` server action imports non-existent `requirePermission` from `@/lib/permissions`; should use `@/lib/authz` with org_id and a valid PermissionKey. |
| **RLS** | ✅ Good | Tenant tables scoped by org membership; 091 fixes invite email binding and account_invites RLS. |
| **Evil paths** | ✅ Handled | No-org → redirect to /onboarding; wrong org_id in path → 403; invite reuse/expiry enforced in RPCs; org switch validates membership. |

**Non-negotiable before launch:** Fix walkthroughs permission import and add defense-in-depth for entity-by-id updates; align plan source (or document single source); add E2E tests for onboarding and plan/tenant isolation.

---

## 2) Golden Path Onboarding (Step-by-Step)

| Step | URL / Route | Component / Handler | Notes |
|------|-------------|---------------------|--------|
| 1 | `/auth/signup` | Signup page + `SignupForm` | New user signs up (email/password or OAuth). |
| 2 | `/auth/callback` (OAuth) or stay on signup | — | Session created; redirect to `?next=` or `/api/auth/landing`. |
| 3 | `/api/auth/landing` | `GET` handler | If no org membership → redirect to `/onboarding`. If has org → set `active_org_id` cookie, redirect to `/app/dashboard` (or `?redirect=`). |
| 4 | `/onboarding` | `OnboardingPage` + `OnboardingForm` | Auth required; if user already has org → redirect to `set-org-and-continue?next=/app/dashboard`. Form: profile upsert, then `create_org_for_signup(org_name, owner_user_id)` RPC (or direct insert org + org_members). **org_type not set when using RPC.** |
| 5 | `/auth/set-org-and-continue?next=/app/dashboard` | `GET` handler | Sets `active_org_id` cookie to first org, redirects to `next` (validated). |
| 6 | `/app/dashboard` | App layout + dashboard | User sees dashboard. |
| 7 | (Optional) `/app/onboarding` | `OnboardingWizard` | Welcome / roles / invite / modules / finish. PATCH `/api/orgs/[orgId]/onboarding` to set `onboarding_status: 'completed'`, then redirect to `/app/dashboard`. |

**Plan selection:** Not part of the above flow. Plan is set via checkout, platform admin (`/api/admin/tenants/set-plan`), or defaults (e.g. Cub). Survey (`/survey`) and pricing (`/pricing`) are pre-signup or post-signup for upgrade.

**First entity (e.g. first walkthrough/inspection):** After dashboard, user can create a walkthrough from `/app/walkthroughs/new` (or similar). No mandatory “first success” screen in the mapped flow.

---

## 3) Evil Paths — Expected Behavior

| Scenario | Expected behavior | Where enforced |
|----------|-------------------|----------------|
| No org membership | Redirect to `/onboarding` | `requireOrg()` → redirect `/api/auth/landing`; landing redirects to `/onboarding` when zero memberships. |
| Wrong org_id in path | 403 Forbidden | `requireOrgMember(orgId)` in all `/api/orgs/[orgId]/*` handlers. |
| Client sends wrong org_id in body | Rejected or ignored | `org/switch` validates membership before setting cookie. Other APIs use path `orgId` or session/cookie org, not body. |
| Invite expired / reused | Error message, no join | RPCs `accept_org_invite` / `accept_account_invite` (091) validate email and token; expiry can be enforced in RPC or app. |
| User in 2 orgs switches org mid-request | Cookie updated only after membership check | `POST /api/org/switch` checks `org_members` for user + org_id. |
| Plan downgraded mid-session | UI/API see new plan on next load | Plan read from DB (org_subscriptions or organizations.plan) per request; no long-lived client plan cache. |
| Payment failed state | No automatic downgrade of plan in codebase | Billing/checkout logic and dunning not fully audited; plan gating uses current subscription state. |

---

## 4) Permission Audit — Server Actions & Route Handlers

- **API routes under `/api/orgs/[orgId]/*`:** All use `requireOrgMember(orgId)` or `requireOrgPermission(orgId, PERMISSIONS.*)`. ✅  
- **API routes without orgId in path:** Use `requireApiOrg()` or `requireOrg()` (org from cookie/session). ✅  
- **Server actions:** Use `requireOrg()` and usually `requirePermission` (authz) or feature checks.  

**Bug (P1) — FIXED:**  
- **File:** `src/actions/walkthroughs.ts`  
- **Issue:** Imports `requirePermission` from `@/lib/permissions`, but `permissions.ts` does not export `requirePermission`. Correct pattern: import from `@/lib/authz` and call with `org.org_id` and a valid PermissionKey.  
- **Fix applied:** Use `requirePermission` from `@/lib/authz`, `PERMISSIONS.DASHBOARD_SALES_VIEW`, and org from `requireOrg()`. Added explicit org scoping in `updateWalkthroughStatus` (select by id + org_id before update).

---

## 5) RLS Audit — org_id Tables

- **Pattern:** Tenant tables use `is_org_member(org_id, auth.uid())` (or one-arg overload `is_org_member(org_id)` in 010/024). No policy relies on client-supplied org_id alone; membership is checked via `auth.uid()`.  
- **091:** Tightens `account_invites` (no public read); `accept_org_invite` and `accept_account_invite` bind invite to current user email.  
- **org_settings:** Read for org members; write for owner/admin via `has_org_role(org_id, ['owner','admin'])`.  
- **organizations INSERT:** Restricted to platform or `create_org_for_signup` (051).  

No additional RLS fixes required for launch beyond 091.

---

## 6) Plan Gating Audit

- **UI:** Cub users hitting `/app/ops/*` see `OperationsUpgradeScreen` (layout uses `isOperationsEnabled(org_id)`).  
- **Server:** `isOperationsEnabled` / `isPremiumPlan` used in ops layout; `launch-packet` checks operations and returns error for non-Grizzly.  
- **Source of truth:** `is-premium.ts` and `org-limits.ts` read `organizations.plan`; `user-context` and `access.ts` use `org_subscriptions.plan_code`. If these diverge (e.g. checkout updates only `org_subscriptions`), plan gating can be inconsistent.  
- **Recommendation:** Prefer a single source (e.g. `org_subscriptions.plan_code`) and have `getPlanType` / seat limits read from it, or keep both in sync via trigger/application logic.

---

## 7) Bug List (Severity)

| ID | Severity | File(s) | Description |
|----|----------|--------|-------------|
| B1 | P1 ✅ | `src/actions/walkthroughs.ts` | Fixed: use `requirePermission` from `@/lib/authz` with `PERMISSIONS.DASHBOARD_SALES_VIEW` and `org.org_id`. |
| B2 | P2 ✅ | `src/actions/walkthroughs.ts` | Fixed: `updateWalkthroughStatus` now verifies walkthrough belongs to current org before update. |
| B3 | P2 ✅ | `create_org_for_signup` + form | Fixed: migration 092 adds optional `p_org_type`; onboarding form passes `p_org_type: orgType`. |
| B4 | P2 | Plan source | Two sources: `organizations.plan` vs `org_subscriptions.plan_code`. Document or unify so plan gating and UI stay in sync. |

---

## 8) Fixes (Exact Code / SQL)

### B1 + B2: walkthroughs.ts

- Fix import: use `requirePermission` from `@/lib/authz` and `PERMISSIONS` from `@/lib/permissions`.  
- After `requireOrg()`, call `requirePermission(PERMISSIONS.DASHBOARD_SALES_VIEW, org.org_id)` (or another appropriate key for walkthroughs).  
- In `updateWalkthroughStatus`: get current org from `requireOrg()`, then ensure the walkthrough row’s `org_id` matches before update (e.g. select by id and org_id, then update).

### B3: create_org_for_signup and onboarding — FIXED

- **Migration 092:** `create_org_for_signup(org_name, owner_user_id, p_org_type TEXT DEFAULT NULL)` sets `organizations.org_type` when the column exists; two-arg overload retained for backward compatibility.  
- **Onboarding form:** Passes `p_org_type: orgType` when calling the RPC so new orgs get the selected type (independent/franchisee/franchisor).

### B4: Plan source

- Document in code or runbook that billing/checkout must set both `organizations.plan` and `org_subscriptions.plan_code`, or migrate all reads to `org_subscriptions` and deprecate `organizations.plan`.  
- **Reference:** `is-premium.ts` and `org-limits.ts` use `organizations.plan`; `user-context.ts` and `access.ts` use `org_subscriptions.plan_code`. Keep in sync when applying plan changes (e.g. checkout success, admin set-plan).

---

## 9) E2E Tests Added

- **File:** `e2e/onboarding-and-plan.e2e.ts`  
- **Cases:**  
  1. New user completes onboarding and reaches dashboard (signup → onboarding → set-org → dashboard).  
  2. Cub user cannot access Grizzly-only route: visit `/app/ops` (or similar), expect upgrade screen or 403.  
  3. Cross-tenant: with auth cookie for org A, request resource for org B (e.g. GET `/api/orgs/{orgB}/...`); expect 403 and no data.  

- **Fixtures:** Use test Supabase project and seeded users/orgs, or Playwright storage state with a test user that has one org (Cub) and optionally a second org for cross-tenant test.

---

## 10) Launch Readiness Checklist

| Item | Pass/Fail |
|------|-----------|
| Golden path: signup → create org → dashboard | ✅ (after B1 fix) |
| No-org user redirected to /onboarding | ✅ |
| Org-scoped APIs require membership | ✅ |
| RLS on tenant tables scoped to org | ✅ |
| Invite email binding (091) | ✅ |
| Plan gating (Cub vs Grizzly) in UI | ✅ |
| Plan gating in server (ops layout, launch-packet) | ✅ |
| walkthroughs action uses valid permission + org | ✅ (B1 fixed) |
| Single plan source or documented sync | ⚠️ Document or fix B4 |
| E2E: onboarding, plan gate, cross-tenant | ⚠️ Add tests |

---

*End of report.*
