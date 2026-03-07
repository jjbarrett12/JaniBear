# JANIBEAR Billing Architecture — Plan & Subscription Source of Truth

## Summary

- **Canonical source:** `org_subscriptions.plan_code` + `status`. All entitlement and plan gating read from this; `organizations.plan` is a **legacy cache** kept in sync for fallback and display.
- **Writes:** Every path that sets or clears plan must update **org_subscriptions** first, then **organizations.plan**.
- **Migration:** Run `119_billing_plan_source_of_truth.sql` to backfill `org_subscriptions` from existing `organizations` and sync `organizations.plan`.

---

## Audit: Code paths (read/write)

### Read paths (plan / tier)

| Location | Source | Notes |
|----------|--------|--------|
| `src/lib/is-premium.ts` | `org_subscriptions` (active) → fallback `organizations.plan` → `'cub'` | getPlanType, isPremiumPlan, isOperationsEnabled |
| `src/lib/user-context.ts` | `org_subscriptions` join `plans` | planCode, modules |
| `src/lib/access.ts` | `org_subscriptions` join `plans` + get_effective_entitlements | plan, effectiveFeatures |
| `get_effective_entitlements` (SQL, 043) | `org_subscriptions.plan_code` where status = 'active' | Feature baseline; no fallback to organizations.plan |
| `org_has_feature` / `org_has_module` (SQL) | Via get_effective_entitlements or org_subscriptions + plans | |
| `src/app/platform/(console)/orgs/[orgId]/page.tsx` | **org_subscriptions** (active) → fallback `organizations.plan` | Display only (canonical) |
| `src/lib/org-limits.ts` | `organizations.seat_limit` only | Does not use plan for limit; plan tier is in org_subscriptions |

### Write paths (must keep in sync)

| Location | Writes org_subscriptions | Writes organizations.plan |
|----------|---------------------------|----------------------------|
| `src/app/api/stripe/webhook/route.ts` (checkout.session.completed) | ✓ upsert plan_code, status active | ✓ legacyPlan |
| `src/app/api/stripe/webhook/route.ts` (customer.subscription.deleted) | ✓ upsert plan_code cub, status canceled | ✓ plan 'cub' |
| `src/app/api/internal/billing/daily/route.ts` (cancel after past_due 14d) | ✓ upsert plan_code cub, status canceled | ✓ plan 'cub' |
| `src/app/app/onboarding/success/page.tsx` | ✓ upsert plan_code, status active | ✓ legacyPlan |
| `src/app/api/admin/tenants/set-plan/route.ts` | ✓ upsert plan_code, status active | ✓ plan |

---

## 1. Canonical source of truth

**Plan and subscription state:** `org_subscriptions` (columns `org_id`, `plan_code`, `status`).

- **plan_code**: One of `cub`, `grizzly`, `kodiak` (must exist in `plans.code`). Drives entitlements via `get_effective_entitlements(p_org_id)`.
- **status**: `active` | `canceled`. Only `status = 'active'` is used for entitlement resolution.

**Stripe linkage:** `organizations.stripe_customer_id`, `organizations.stripe_subscription_id`, `organizations.billing_status` (trial | active | past_due | canceled). These are the source of truth for *payment* state; plan tier is derived from checkout metadata or set-plan and stored in `org_subscriptions`.

**Legacy cache:** `organizations.plan` is kept in sync with `org_subscriptions.plan_code` for backward compatibility and as a fallback when `org_subscriptions` has no active row. All **writes** that set plan must update both (or at least `org_subscriptions`).

---

## 2. Read paths (single canonical behavior)

| Consumer | Source | Behavior |
|----------|--------|----------|
| **get_effective_entitlements** (SQL) | `org_subscriptions.plan_code` where `status = 'active'` | Plan baseline for feature flags. |
| **getPlanType** / **isPremiumPlan** / **isOperationsEnabled** (`src/lib/is-premium.ts`) | `org_subscriptions` (active) first; fallback `organizations.plan`; then `'cub'`. | Used for ops/sales gating, sidebar, university. |
| **getEffectiveAccess** (`src/lib/access.ts`) | `org_subscriptions` join `plans` | Plan info in access object. |
| **getUserContext** (`src/lib/user-context.ts`) | `org_subscriptions` join `plans` | `planCode`, `modules`. |
| **Billing UI** | `organizations` (billing_status, stripe_*, past_due_since, locked_since) + entitlements API | Payment state and feature toggles. |

---

## 3. Write paths (keep one source, prevent drift)

| Event | Updates |
|-------|--------|
| **Stripe webhook: checkout.session.completed** | `organizations`: stripe_*, billing_status, **plan** (from metadata). `org_subscriptions`: upsert **plan_code** (from seat counts), status `active`. |
| **Stripe webhook: customer.subscription.deleted** | `organizations`: billing_status `canceled`, stripe_subscription_id null, **plan** `cub`. `org_subscriptions`: upsert plan_code `cub`, status `canceled`. |
| **Onboarding success page** (after Stripe checkout) | Same as checkout.session.completed: organizations (stripe_*, billing_status, **plan**), **org_subscriptions** upsert from session metadata. |
| **Platform admin: POST /api/admin/tenants/set-plan** | `org_subscriptions` upsert; **organizations.plan** set to same value. |

Plan is derived from seat counts (checkout/success) via `planCodeFromSeatCounts()`: highest tier with count > 0 → kodiak | grizzly | cub.

---

## 4. Feature gating

- **Ops (Grizzly+):** `isOperationsEnabled(orgId, userId)` → `getPlanType` → org_subscriptions then organizations.plan then cub.
- **University / premium:** `isPremiumPlan(orgId, userId)` → same.
- **Entitlements API / get_effective_entitlements:** Plan baseline from `org_subscriptions.plan_code` (active only); addons from `org_addons`; overrides from `tenant_feature_overrides`.

**Feature-gating updates (all use canonical source):**

- **Ops / University / premium:** `isOperationsEnabled`, `isPremiumPlan` → `getPlanType()` → org_subscriptions then organizations.plan.
- **Entitlements API / get_effective_entitlements:** Plan baseline from `org_subscriptions.plan_code` (active only); addons from `org_addons`; overrides from `tenant_feature_overrides`.
- **Access / user context:** `getEffectiveAccess`, `getUserContext` → org_subscriptions join plans (no fallback to organizations.plan for plan/modules).
- **Platform org display:** Plan label from org_subscriptions (active) with fallback to organizations.plan.

No feature-gating logic should read plan from a different source; all go through `getPlanType` or `get_effective_entitlements` or org_subscriptions.

---

## 5. Schema and backfill

- **Migration 119:** Ensures `plans` has cub/grizzly/kodiak; backfills `org_subscriptions` from `organizations` (plan or stripe_subscription_id) where no active subscription exists; syncs `organizations.plan` from `org_subscriptions` where plan is null.
- **organizations.plan:** Retained for legacy and fallback; always updated when plan is set (webhook, success page, set-plan). Can be deprecated later by making `getPlanType` use only `org_subscriptions` and dropping the column after a transition period.

---

## 6. Risks if not fixed

- **Drift:** If only one of `organizations.plan` or `org_subscriptions` is updated (e.g. billing daily canceled subscription but did not update org_subscriptions), entitlement checks (get_effective_entitlements, is-premium) and UI can disagree: e.g. ops still see Grizzly features while billing shows canceled.
- **No plan after checkout:** If org_subscriptions was never written on checkout, new customers would have no active row and get cub behavior or null plan (webhook and onboarding success now both write org_subscriptions).
- **Double source:** Code reading only `organizations.plan` (e.g. platform org detail page) could show a different tier than gating that uses `org_subscriptions` (e.g. ops access vs upgrade screen). Platform org page now reads from org_subscriptions first.
- **Cron cancel:** Billing daily cron canceled Stripe and cleared stripe_subscription_id but did not set plan to cub or update org_subscriptions, leaving entitlement and plan state inconsistent. Fixed: cron now updates both org_subscriptions and organizations.plan.

---

## 7. Files affected (refactor + audit)

| File | Change |
|------|--------|
| `src/lib/billing/plan-source.ts` | `planCodeFromSeatCounts`, `planCodeToLegacyPlan`; used by webhook and onboarding. |
| `src/lib/is-premium.ts` | `getPlanType`: org_subscriptions first; fallback organizations.plan then cub. |
| `src/app/api/stripe/webhook/route.ts` | checkout.session.completed + subscription.deleted: update both org_subscriptions and organizations.plan. |
| `src/app/app/onboarding/success/page.tsx` | After checkout: upsert org_subscriptions; update organizations (stripe_*, billing_status, plan). |
| `src/app/api/admin/tenants/set-plan/route.ts` | Upsert org_subscriptions; then update organizations.plan. |
| `src/app/api/internal/billing/daily/route.ts` | **When canceling subscription (past_due 14d):** update org_subscriptions (plan_code cub, status canceled) and organizations.plan = 'cub'. |
| `src/app/platform/(console)/orgs/[orgId]/page.tsx` | **Display plan from org_subscriptions** (active) with fallback to organizations.plan. |
| `src/lib/org-limits.ts` | Uses only organizations.seat_limit; comment that plan tier is in org_subscriptions. |
| `src/lib/billing/plan-source.ts` | **syncPlanState(supabase, orgId, planCode, status)** — single helper to update org_subscriptions + organizations.plan. |
| `supabase/migrations/119_billing_plan_source_of_truth.sql` | Backfill org_subscriptions; sync organizations.plan. |
| `supabase/migrations/043_plans_addons_entitlements_rls.sql` | get_effective_entitlements reads plan from org_subscriptions only. |

---

## 8. Migration and backfill strategy

1. **Already applied:** Migration `119_billing_plan_source_of_truth.sql`
   - Ensures `plans` has cub, grizzly, kodiak.
   - Backfills `org_subscriptions` from `organizations` (plan or stripe_subscription_id) where no active subscription exists.
   - Syncs `organizations.plan` from `org_subscriptions` where plan is null/empty.

2. **Compatibility:** Keep writing to both `org_subscriptions` and `organizations.plan` on every plan change. Do not remove `organizations.plan` until all readers are updated and a deprecation period has passed.

3. **Schema cleanup (future):**
   - Option A: Add a DB trigger so that `organizations.plan` is updated whenever `org_subscriptions` is updated (single write to org_subscriptions only). Then deprecate direct writes to organizations.plan.
   - Option B: Remove fallback in `getPlanType` to read only from `org_subscriptions`; backfill any orgs with no row. Then drop `organizations.plan` in a later migration.

4. **Backfill verification:** After 119, run:
   - `SELECT id, plan FROM organizations o WHERE (plan IS NOT NULL OR stripe_subscription_id IS NOT NULL) AND NOT EXISTS (SELECT 1 FROM org_subscriptions s WHERE s.org_id = o.id AND s.status = 'active');`  
   Should return no rows for orgs that have a plan or Stripe subscription (or only orgs that are canceled).

---

## 9. Preventing drift

- **Rule:** Every code path that sets or clears plan **must** update `org_subscriptions` first (upsert plan_code + status), then set `organizations.plan` to the same value (or 'cub' on cancel).
- **Billing daily:** When the cron cancels a subscription (past_due > 14 days), it now updates both `org_subscriptions` (plan_code cub, status canceled) and `organizations.plan = 'cub'`.
- **New code:** Do not add writes to `organizations.plan` without also writing to `org_subscriptions`. Use the shared helper **`syncPlanState(supabase, orgId, planCode, status)`** from `@/lib/billing/plan-source` so both tables are updated in one place. Used by: set-plan API, billing daily cron; webhook and onboarding success do their own sync (they also set stripe_*, billing_status).
