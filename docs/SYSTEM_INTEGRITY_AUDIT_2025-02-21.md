# JANIBEAR Full System Integrity Audit
**Date:** 2025-02-21  
**Scope:** 1–2 days of updates; routing, RBAC, DB/RLS, AI, errors.  
**Method:** Static codebase audit (no live runtime tests).

---

## 1. Critical Issues (Must Fix Immediately)

### 1.1 Broken route: Admin Invoices detail → 404
- **Where:** `src/components/admin/invoice-list.tsx` line 123: `<Link href={\`/app/admin/invoices/${invoice.id}\`}>`
- **Problem:** There is **no** `src/app/app/admin/invoices/[id]/page.tsx`. Only `[id]/edit/page.tsx` exists. Clicking an invoice in the list goes to `/app/admin/invoices/{id}` and results in **404**.
- **Fix:** Either (a) add `admin/invoices/[id]/page.tsx` that shows invoice detail and links to edit, or (b) change the list link to `href={\`/app/admin/invoices/${invoice.id}/edit\`}` so it goes to the edit page.

### 1.2 Admin edit pages missing role check (security)
- **Where:**
  - `src/app/app/admin/compliance/[id]/edit/page.tsx`
  - `src/app/app/admin/sds/[id]/edit/page.tsx`
- **Problem:** Both fetch `member` and redirect if no member, but **do not** check that `member.role` is in `['owner','admin','manager']`. Any org member (e.g. sales_rep) who knows or guesses the ID can load the edit form. RLS may limit what they can save; they still see the form and can attempt updates.
- **Fix:** After fetching `member`, add:  
  `if (!['owner','admin','manager'].includes(member.role)) redirect('/app/admin');`

---

## 2. Medium Risk Issues

### 2.1 University route duality: `course/[id]` vs `courses/[slug]`
- **Where:** Library links to `/app/university/courses/${course.slug}`; most of the app (certifications, my-training, admin, compliance-alerts, etc.) links to `/app/university/course/${id}` (singular, by id).
- **Risk:** Two different route shapes and identifiers (slug vs id). If a course is only keyed by id in one place and slug in another, links can break or show wrong course. RevalidatePath in `university-training.ts` references `course/[id]`; library uses `courses/[slug]`.
- **Recommendation:** Standardize on one pattern (e.g. `/app/university/course/[id]` everywhere) and resolve slug→id in one place, or document and test both paths.

### 2.2 Middleware auth failure is silent
- **Where:** `src/middleware.ts`: `catch { return NextResponse.next({ request }); }`
- **Problem:** If `updateSession` throws (e.g. Supabase/Edge failure), middleware returns next() and the request continues. User may reach protected content with no valid session, or get inconsistent auth state.
- **Recommendation:** In catch, at least log; consider redirecting to login or a “session error” page for `/app/*` when in production.

### 2.3 Schema vs code: `locations` and `employees` tables
- **Where:** Many components and actions still query `from('locations')` and `from('employees')` (e.g. compliance forms, invoice forms, sites, map/data, crm, schedules, inspections, admin employees).
- **Risk:** Migration 037 introduced accounts/facilities; reconciliation and history suggest some envs may have dropped or renamed `locations`. If `locations` or `employees` are missing or renamed, these queries will fail at runtime.
- **Recommendation:** Confirm on production and staging which tables exist (`locations`, `sites`, `facilities`, `employees`) and align code and migrations. Add defensive handling or feature flags if both old and new schemas exist during transition.

### 2.4 Audit log page: no server-side role check
- **Where:** `src/app/app/audit/page.tsx` only calls `requireOrg()` and renders `AuditLogViewer`.
- **Note:** `listAuditLog` in `actions/audit-log.ts` does enforce `ADMIN_ROLES` and returns “Only org admins can view audit log” for non-admins, so data is protected. Non-admins still see the Audit Log page with an empty/error state rather than being redirected.
- **Recommendation:** Add the same owner/admin/manager check in the audit page and redirect non-admins to `/app/admin` for consistent UX and one less round-trip.

---

## 3. Minor Bugs / UX Gaps

### 3.1 `role_enum` still referenced
- **Where:** `src/lib/user-context.ts`: selects `role_enum` and uses it for capabilities/context. Comment says “role_enum/capabilities added in 019”.
- **Risk:** If migrations or reconciliation dropped `role_enum` in favor of `role` only, this query could fail or return null and change behavior.
- **Recommendation:** Verify `org_members` columns in DB; if only `role` exists, remove `role_enum` from select and use `role` everywhere.

### 3.2 Franchisor redirect uses strict pathname check
- **Where:** `src/app/app/layout.tsx`: franchisor redirect allows `/app/settings`, `/app/kpis`, `/app/kpi`, `/app/benchmarks` and their subpaths. Any other `/app/*` (e.g. a new settings sub-route) could be blocked if not added to the allowlist.
- **Recommendation:** Document the allowlist and consider a small allowlist config array so new routes are not missed.

### 3.3 LiDAR / inspections
- **Where:** LiDAR is feature-gated on walkthroughs page and in API (`extract-scope` uses `requireFeature('lidar')`). No standalone `/app/lidar` route; LiDAR lives inside walkthroughs.
- **Status:** Matches current design. Ensure “LiDAR page” in any docs or nav is clearly “Walkthroughs (with LiDAR when enabled)”.

---

## 4. Security Concerns

### 4.1 Admin role check consistency
- **Finding:** Most admin routes (employees, invoices, purchase-orders, sds, compliance list, admin dashboard, ai-settings, phone) correctly restrict to owner/admin/manager. Two edit pages (compliance/[id]/edit, sds/[id]/edit) do not—see **1.2**.
- **Recommendation:** Add a shared helper (e.g. `requireAdminRole()`) used by every admin route and use it in the two missing edit pages.

### 4.2 Platform admin impersonation
- **Where:** `requireOrg()` in `auth.ts`: when `impersonate_org_id` cookie is set and user is platform admin, returns that org with role `'owner'`.
- **Status:** Intentional; ensure only platform admins can set that cookie (e.g. via a protected platform route).

### 4.3 API routes
- **Finding:** Sampled API routes use guards (`requireApiOrg`, `requireOperatorOrg`, `requireFeature`) and return 401/403/404/500 appropriately. `extract-scope` and `split-crews` have try/catch and return 500 on error.
- **Recommendation:** Audit remaining API routes (especially admin and webhook) for authz and error handling.

---

## 5. Suggested Hardening Improvements

1. **Invoice detail route:** Implement `admin/invoices/[id]/page.tsx` (read-only view) and keep list linking to it; or switch list to `[id]/edit` and add a “View” from edit. Resolve **1.1**.
2. **Role checks:** Add `requireAdminRole()` (or equivalent) and use it in compliance and SDS edit pages; optionally on audit page for redirect.
3. **Middleware:** Log and optionally redirect on `updateSession` failure instead of silent next().
4. **Schema alignment:** Document and verify `locations` vs `facilities` and `employees` vs any new schema; add integration tests that run against a migrated DB.
5. **University routes:** Unify on `course/[id]` or `courses/[slug]` and update all links and revalidatePath references.
6. **E2E smoke tests:** Add minimal E2E for: login → dashboard, sidebar nav to key modules, one proposal flow, one admin (e.g. invoice list) and one restricted route (e.g. direct URL as sales_rep to admin) to verify RBAC and no 404s.

---

## 6. Clean Bill of Health (What’s in Good Shape)

- **Routing:** Nav factory and mobile sidebar use single source of truth; key routes (dashboard, financial-health, kpis, map, bids, proposals/build, inspections/start, accounts/new, crm/opportunities/[id], sales/pipeline, ops/*, admin/*, settings, pro-gear, university, territory-map, helphub) have corresponding pages. Dynamic segments use `notFound()` where appropriate.
- **Redirects:** `/dashboard` → `/app/dashboard`, `/crm/*` → `/app/crm/*`, `/walkthroughs` → `/app/walkthroughs`; `/app/locations/new` → `/app/accounts/new`; franchisor and ops layout redirects behave as intended.
- **RBAC:** Admin dashboard and most admin sub-routes enforce owner/admin/manager; audit data is restricted by role in server action; pro-gear admin layout restricts to pro-gear admin; ops layout gates on premium.
- **RLS:** App relies on Supabase RLS; reconciliation migrations (087/088) added audit_log and other tables with policies. No evidence of client-side bypass of RLS.
- **AI:** AI routes check org and feature; return clear errors when AI is not configured; extract-scope validates transcript and org_id.
- **404 handling:** Global `not-found.tsx` exists; many [id] routes call `notFound()` when entity is missing.
- **Error handling:** API routes sampled return appropriate status codes and messages; extract-scope and split-crews catch and return 500.

---

**Summary:** Fix the **invoice list → 404** and the **two admin edit pages missing role check** first. Then address medium items (university routes, middleware, schema alignment) and minor/hardening items as part of normal iteration.
