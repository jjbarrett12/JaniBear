# System Stress Audit Report

**Date:** 2025-02-21  
**Mode:** Structural, logic, performance, and security stress audit (no refactors).

---

## 🔴 Critical (must fix before production)

### Auth & RLS

1. **Middleware swallows all errors**  
   **Where:** `src/middleware.ts` (catch block).  
   **Issue:** Any throw in `updateSession` (e.g. Supabase/Edge failure, bad JWT) results in `NextResponse.next({ request })` with no log or redirect. Users can appear logged in when session is invalid, or auth can silently fail.  
   **Fix:** At minimum log the error; consider redirecting to `/auth/login` when the path is under `/app/` and the error is auth-related.

2. **Public survey POST: no input validation**  
   **Where:** `src/app/api/public/survey/[token]/route.ts` (POST), `src/lib/customer-surveys.ts` `submitSurveyResponse`.  
   **Issue:** `body.answers` is used as-is. No check that it's an array, max length, or that `question_id` values belong to the survey. Large or malformed payloads can cause DoS or bad data.  
   **Fix:** Validate `body.answers` (Array, max length e.g. 50, each item shape and `question_id` in survey's question IDs); reject invalid payloads with 400.

3. **Contract renewal PATCH: no enum validation**  
   **Where:** `src/app/api/contract-renewals/[id]/route.ts`.  
   **Issue:** `body.renewal_status` is passed to `updateRenewalStatus` with only presence check. Invalid enum values can hit the DB or cause inconsistent state.  
   **Fix:** Validate against allowed `renewal_status` values (e.g. allowlist) before calling `updateRenewalStatus`.

### API / Server

4. **Work order PATCH: no org_id in update**  
   **Where:** `src/lib/work-orders.ts` – `updateWorkOrderStatus` uses `.eq('id', id)` only; `getWorkOrder(id)` has no org filter.  
   **Issue:** RLS on `work_orders` enforces org membership, so cross-tenant updates are blocked at DB level. If RLS were ever misconfigured or bypassed, another tenant’s row could be updated.  
   **Fix:** Add `.eq('org_id', orgId)` to the update and add org_id to `getWorkOrder` (or require orgId and filter in both). Keeps behaviour correct even if RLS is relaxed.

5. **Contract renewal update: no org_id in update**  
   **Where:** `src/lib/contract-renewals.ts` – `updateRenewalStatus` updates by `id` only.  
   **Issue:** Same as above; RLS protects today, but application layer does not enforce tenant.  
   **Fix:** Add `org_id` to the update (from context) so the row is scoped by org in code.

### Security

6. **No security headers**  
   **Where:** `next.config.mjs` and `src/middleware.ts`.  
   **Issue:** No CSP, X-Frame-Options, or similar. Increases risk of clickjacking and XSS impact.  
   **Fix:** Add headers in middleware or Next config (e.g. `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and a conservative CSP).

---

## 🟡 Risk (scales poorly or edge-break risk)

### Auth & session

7. **Silent auth failure in middleware**  
   Same as Critical #1; if not treated as critical, treat as high risk: unlogged errors in auth path can make debugging and monitoring hard.

8. **Impersonation cookie only set via platform action**  
   **Where:** `src/actions/platform.ts` – `setImpersonateOrg` (platform admin only).  
   **Note:** Cookie is httpOnly and only set after `requirePlatformAdmin()`. No evidence it can be set by a non–platform-admin; keep it that way and ensure platform routes are not callable by tenant users.

### Database & query load

9. **Unbounded AR snapshot query**  
   **Where:** `src/lib/command-center-data.ts` – `getARSnapshotForOrg`.  
   **Issue:** Fetches all non-paid/non-cancelled invoices for the org with no `.limit()`. At 10k+ invoices this can be slow and memory-heavy.  
   **Fix:** Prefer an aggregated query (e.g. raw SQL or RPC) that returns totals and counts; or cap with a reasonable limit and document.

10. **Unbounded command-center queries**  
    **Where:** `src/lib/command-center-data.ts` – `getCommandCenterDataInner`.  
    **Issue:** Several selects are unbounded: e.g. `facilitiesList` (all facilities), `accountsList` (all active accounts), `inspectionsScores` (last 30 days), `invoicesAR` (all outstanding). At 50k+ facilities/accounts this will not scale.  
    **Fix:** Use counts/aggregates where only counts are needed; add limits or date ranges where full lists are required; consider materialized views or RPCs for heavy dashboards.

11. **University quiz submit: tenant isolation by RLS only**  
    **Where:** `src/actions/university-training.ts` – `submitQuiz` fetches `jb_training_quizzes` by `quizId` only (no org_id in query).  
    **Issue:** Visibility depends on RLS on `jb_training_quizzes`. If a user could guess a quiz id from another org, RLS should block; application code does not double-check org/course.  
    **Fix:** Verify RLS on `jb_training_quizzes` and related tables; optionally add application-level check (e.g. ensure enrollment belongs to current org/course) for defence in depth.

### API validation

12. **API routes without Zod/server validation**  
    **Where:**  
    - `src/app/api/contract-renewals/[id]/route.ts` – body.renewal_status, id format.  
    - `src/app/api/work-orders/[id]/route.ts` – body.status, id.  
    - `src/app/api/admin/users/enable/route.ts` – membershipId / userId / tenantId (no UUID validation).  
    - `src/app/api/admin/users/set-password/route.ts` – userId, newPassword.  
    - `src/app/api/marketing/sequences/route.ts` – body.  
    - `src/app/api/marketing/sequences/[id]/enroll/route.ts` – body.  
    **Issue:** Invalid IDs, enums, or oversized input can cause 500s or bad state.  
    **Fix:** Add Zod (or equivalent) schemas and validate body/params; return 400 with clear messages.

### UI / state

13. **Double-submit on platform create-org form**  
    **Where:** `src/components/platform/create-org-form.tsx` – submit button has no `disabled={pending}`.  
    **Issue:** Double-click can submit twice; `useActionState` does not expose pending like `useTransition`.  
    **Fix:** Use `useFormStatus` in a child submit button or track pending in state and disable the button.

14. **Other forms without submit guard**  
    Several forms correctly use `disabled={loading}` or `disabled={isLoading}` (e.g. invoice-form, walkthrough-form, client-form). A few (e.g. login-form, create-org-form) do not disable submit during request; worth auditing all primary submit buttons for loading/pending state.

### External / AI

15. **AI and external calls: error handling**  
    **Where:** AI routes under `src/app/api/ai/*` (e.g. invoice-notes, staffing-suggestions, pain-points).  
    **Issue:** If OpenAI times out or fails, responses need to be checked for proper error boundaries and user-facing fallbacks (e.g. no infinite loading, clear “AI unavailable” message).  
    **Fix:** Ensure API routes return 5xx/4xx and message; ensure callers show fallback UI and do not assume a successful completion.

16. **Cron / webhooks**  
    Cron routes use `createAdminClient` and are intended to be secured by Vercel cron secret or similar. Confirm cron endpoints are not callable without that secret and that Stripe webhook signature is verified where used.

---

## 🟢 Optimization (improvement opportunities)

### Database

17. **Indexes**  
    Many FKs and hot paths already have indexes (e.g. `087_reconcile_all_schema.sql`, `001_initial_schema.sql`). For any new high-cardinality filters (e.g. `org_id + status`, `org_id + date`), add composite indexes to match list/dashboard queries. No single missing index was identified as critical; add based on actual slow-query logs.

18. **N+1**  
    No obvious N+1 (e.g. `.map` with await inside) in the files reviewed. Command-center and dashboard use `Promise.all` for parallel fetches; keep that pattern when adding new aggregates.

### Performance

19. **Caching**  
    Command center and dashboard data are good candidates for `revalidatePath`/`revalidateTag` or short `revalidate` (e.g. 60s) where freshness allows. AI responses could be cached per idempotent key where safe.

20. **Client bundles**  
    No measurement of bundle size in this audit. Consider analyzing chunks (e.g. >250kb) and lazy-loading heavy UI (e.g. Stripe, charts) where appropriate.

21. **Waterfall fetching**  
    App layout and pages that first resolve auth/org then fetch data can exhibit waterfalls. Where possible, fetch in parallel or use server components that request auth and data together.

### Defence in depth

22. **getWorkOrder / getWorkOrderStats**  
    `getWorkOrder(id)` and the work order API GET return by id only; RLS enforces visibility. Adding an explicit `orgId` argument and filtering in the service layer would make tenant isolation obvious and resilient to RLS mistakes.

23. **Service role usage**  
    `SUPABASE_SERVICE_ROLE_KEY` and `createAdminClient()` are only used server-side (admin.ts, cron, auth admin, workflow-engine, salesPulse, marketing-automation, customer-surveys, contract-renewals, benchmarking). Not exposed to client. Keep any new admin usage server-only and never pass service role to the client.

### Error handling

24. **Error boundaries**  
    Root `src/app/error.tsx` and `src/app/app/dashboard/error.tsx` exist and provide reset/home. Consider adding route-level `error.tsx` for other heavy routes (e.g. command center, invoices, university) so failures are contained and user can retry or navigate away.

25. **Stripe / webhooks**  
    Ensure Stripe webhook handlers verify signature and respond quickly (e.g. ack then process async) to avoid timeouts and duplicate processing under load.

---

## Summary

| Severity | Count | Focus |
|----------|--------|--------|
| 🔴 Critical | 6 | Middleware auth error handling, survey input validation, renewal enum validation, work order/renewal org scoping in code, security headers |
| 🟡 Risk | 10 | Unbounded AR/command-center queries, API validation gaps, double-submit, AI/cron error handling and access |
| 🟢 Optimization | 9 | Indexes from slow-query analysis, caching, bundle size, waterfalls, defence-in-depth, error boundaries, webhook robustness |

**Suggested order of work:** Fix Critical 1 (middleware), 2 (survey validation), 3 (renewal enum), then 4–5 (org_id in work order and contract renewal updates), then 6 (security headers). Then address Risk items (unbounded queries and API validation) before production load.
