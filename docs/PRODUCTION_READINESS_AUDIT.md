# JANIBEAR — Full Production Readiness Audit

**Date:** 2025-03-03  
**Role:** Principal staff engineer, SaaS platform architect, security lead, release manager  
**Scope:** Full application; real code and architecture; brutally honest assessment.

---

## PART 1 — SYSTEM DISCOVERY (Architecture Map)

### 1. App directory structure

- **Root:** `src/app/layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`
- **Marketing:** `src/app/(marketing)/layout.tsx` — `page.tsx`, about, contact, demo, pricing, privacy, survey, terms, why-janibear
- **App (authenticated):** `src/app/app/layout.tsx` — all `/app/*` routes; billing lock + platform-admin bypass; org/shell resolution
- **Platform (admin):** `src/app/platform/*` — forbidden, (console): overview, orgs, users, system-health, audit-log, ai
- **Franchisor / Operator / Launcher:** `src/app/franchisor/*`, `operator/*`, `launcher/*`
- **Onboarding:** `src/app/onboarding/*` — import, wizard, success
- **Auth:** `src/app/auth/*` — login, landing, continue, callback, forgot-password, reset-password
- **Checkout:** `src/app/checkout/success`
- **Other:** `src/app/r/[token]`, `src/app/ticket/[locationId]`, `src/app/manifest.webmanifest`

Sub-layouts under `/app`: `admin`, `ops`, `franchise`, `opportunities/network`, `pro-gear`, `pro-gear/admin`.

### 2. Module layout

| Module | Routes | Key components / libs |
|--------|--------|------------------------|
| **Sales (Grizzly)** | `app/sales/*`, `app/sales-dashboard`, `app/crm/*` | `actions/leads.ts`, `actions/crm.ts`, `lib/sales/*`, `lib/sales-dashboard-data.ts`, `lib/sales/sales-command-data.ts` |
| **Operations (Kodiak)** | `app/ops/*` | `lib/ops/getCommandCenterData.ts`, `lib/command-center-data.ts`, `actions/launch-plan.ts`, `actions/account-assignment.ts` |
| **Crew (Cub)** | `app/crews/*` | `api/app/ops/crews/route.ts` |
| **Walkthroughs / LiDAR** | `app/walkthroughs/*`, `app/sales/walkthroughs` | `api/extract-scope/route.ts`, `api/transcribe/route.ts`; storage bucket `walkthrough-scans` (RLS by org path) |
| **Proposals / Bids** | `app/bids/*`, sales scope/scope-builder | `api/extract-scope`; proposal generation via AI |
| **Accounts / Sites** | `app/accounts/*`, `app/locations/*`, `app/sites/*` | `actions/accounts.ts`, `actions/sites.ts` |
| **Inspections** | `app/inspections/*`, `app/ops/inspections` | AI: `api/ai/analyze-sds`, `api/ai/compliance-suggestions` |
| **QC / Issues** | `app/qc-assign`, `app/issues/*` | — |
| **Financial** | `app/financial-health`, `app/billing`, `app/upgrade`, `app/admin/invoices/*`, `app/contracts` | `lib/billing/*`, Stripe checkout/portal |
| **Dashboards** | `app/dashboard`, `app/executive`, `app/kpis`, `app/benchmarks`, `app/daily`, `app/alerts` | `lib/dashboard-data.ts`, `lib/overview-data.ts`, `actions/kpi-command-center.ts` |
| **Franchise** | `app/franchise/*`, `franchisor/*` | `lib/org-type.ts`, `lib/shell.ts`; RLS `is_franchisor_org` / `is_operator_org` |

### 3. Authentication system

- **Provider:** Supabase Auth (SSR). Server: `src/lib/supabase/server.ts` (`createClient()` with cookies). Browser: `src/lib/supabase/client.ts`. Middleware: `src/lib/supabase/middleware.ts` — session refresh, cookie fallback from Cookie header (Edge), org resolution from subdomain/path slug.
- **Flow:** Login form → Supabase sign-in → callback → `api/auth/after-login` → set `active_org_id` / redirect. Throttling/redirect handled in middleware; public paths: `/auth`, `/r/`, `/onboarding`, `/pricing`, `/survey`, `/checkout`, `/demo`, `/contact`, `/api`, `/launcher`.
- **Utilities:** `src/lib/auth.ts`: `getCurrentUser`, `getCurrentUserId`, `requireAuth`, `requireOrg`, `getOrgForUserId`, `getCurrentOrg` (uses `x-middleware-user-id`, impersonation cookie). `src/lib/api-auth.ts`: `requireOrgMember`, `requireOrgPermission`. `src/lib/auth/requirePermission.ts`, `permission-helpers.ts`: `requirePermission`, `hasPermission`, `getSessionUser`, `getActiveOrgIdSafe`, `getOrgMembership`; site admin bypass; `has_permission` RPC/cache.

### 4. Role model implementation

- **DB:** Legacy: `org_members.role`, `role_permissions` (094, 095). Governance: `gov_roles`, `gov_permissions`, `gov_role_permissions`, `gov_member_roles`, `gov_member_permissions`, `member_effective_permissions` (114).
- **App permission keys:** `src/lib/auth/permissions.ts` (e.g. `org.read`, `billing.read`, `walkthrough.*`, `proposal.*`, `inspection.*`, `task.*`, `issue.*`, `dashboard.sales`, `dashboard.ops`, `dashboard.exec`, `settings.*`, `maps.read/write`, `lead.*`). Governance: `src/lib/auth/governance-permissions.ts`.
- **Enforcement:** Server: `requirePermission()` in many `app/**/page.tsx` and API routes. RLS uses `is_org_member()`, `has_org_role()`, `has_org_permission()` (114, 094, 097, etc.). Platform admin: `platform_admins` table + `getIsPlatformAdmin`; bypass in layout (billing), `is-premium.ts` (plan/ops), sidebar, university, sales pages.

### 5. Org hierarchy model

- **Types:** `organizations.org_type`, `ownership_model` (independent, unit_franchisee, area_franchisor). Shell: `owner_operator | franchisee | franchisor` — `src/lib/shell.ts`, `src/lib/shell-constants.ts`, `src/lib/org-type.ts` (`isOperatorOrg`, `isFranchisorOrg`, `canSeeLaborData`). Migrations: `is_franchisor_org(org_id)`, `is_operator_org(org_id)`.
- **Relationships:** `franchise_relationships` / `franchise_associations` (franchisor_org_id, franchisee_org_id). Account/site ownership: `org_id` on locations, facilities, accounts; RLS and API gates by org + permission.

### 6. Supabase usage

- **Server:** `src/lib/supabase/server.ts` — async `createClient()` (Supabase URL/anon key, cookies).
- **Admin (service role):** `src/lib/supabase/admin.ts` — `createAdminClient()`; throws if `SUPABASE_SERVICE_ROLE_KEY` missing. Used by: Stripe webhook, cron routes (recurring-billing, sales-pulse, payment-reminders, missed-task-notifications, daily-operator-performance, refresh-benchmark-aggregates), internal billing/daily, internal risk/run, admin users reset/set-password, customer-surveys, marketing-automation, workflow-engine, recurring-billing, contract-renewals, benchmarking (refresh RPC).
- **Middleware:** Session refresh; org from slug; no service role.

### 7. RLS policies

- **Coverage:** 40+ migrations touch RLS. Base: `002_rls_policies.sql` (organizations, profiles, org_members, locations, crews, inspections, issues, etc.) with `is_org_member`, `get_user_org_role`, `can_write_org`. Later: 008 (sales/QC), 012 (onboarding), 016 (org_type franchisor/operator), 043 (plans/addons/entitlements), 048/049 (CRM), 051 (platform), 059 (templates), 071 (AI), 084 (audit_log), 091 (invites), 094 (RBAC v1), 097 (site admin, settings), 098 (maps, lead, ops, accounts), 104 (account risk), 114 (governance). Storage: 003, 005, 025 (walkthrough-scans: org path), 039, 074, 085.
- **Pattern:** Tables have `org_id`; policies use membership/role/permission helpers; franchisor vs operator restrictions where applicable (labor/PII).

### 8. LiDAR ingestion pipeline

- **Storage:** Bucket `walkthrough-scans`; path `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/`. RLS on `storage.objects`: INSERT/SELECT/DELETE only when path[2] in user's org_members.
- **Tables:** `walkthrough_scans` (status: uploaded, processing, ready, failed). Transcripts: `walkthrough_transcripts`; scope: `scope_models` (from extract-scope).
- **API:** `api/extract-scope` — `requireApiOrg` + feature `lidar`; validates `walkthrough_id` and `transcript.org_id === activeOrgId`. `api/transcribe` — same; writes transcript with `org_id`. No unauthenticated upload.

### 9. Proposal generation system

- **Scope extraction:** `api/extract-scope` (walkthrough transcript → scope JSON); writes `scope_models`. Feature-gated (lidar).
- **Proposals:** Sales proposals in DB (`sales_proposals`, `proposals`); UI in `app/bids/*`, `app/sales/scope*`. AI used for scope/analysis; no single “generate proposal” API fully traced end-to-end in this audit.

### 10. Sales CRM pipeline

- **Data:** `leads`, `accounts`, `contacts`, `opportunities`, `sales_proposals`, `walkthroughs`, `crm_activities`. Actions: `src/actions/leads.ts` (createLead, convertLeadToOpportunity; duplicate detection on create; duplicate account check on convert). `src/actions/crm.ts` (opportunity/proposal updates). Sales Command: `src/lib/sales/sales-command-data.ts` (KPIs, action cards; links to opportunity detail).
- **Nav:** Pipeline at `app/crm/pipeline`; nav factory points Opportunities to pipeline. Launch packets: `app/sales/launch-packets`, `actions/launch-packet.ts` (createLaunchPacket, sendLaunchPacketToOps); plan-gated (Grizzly/ops).

### 11. Operations command center

- **Routes:** `app/ops/command-center`, `app/ops/launch-intake`, `app/ops/schedules`, `app/ops/performance`, `app/ops/risk`, `app/ops/service-deployments`, `app/ops/inspections`. Data: `getCommandCenterData.ts`, `command-center-data.ts`, `daily-command-data.ts`. Layout: `app/ops/layout.tsx` gates by `isOperationsEnabled(orgId, userId)` (platform admin bypass).

### 12. Inspection system

- **Routes:** `app/inspections`, `app/inspections/start`, `app/inspections/run`, `app/inspections/[id]`, `app/ops/inspections`. AI: `api/ai/analyze-sds`, `api/ai/compliance-suggestions`. Tables: inspections, inspection_section_scores, inspection_responses, inspection_photos (RLS in 002, 023).

### 13. Financial tracking

- **Routes:** `app/financial-health`, `app/billing`, `app/upgrade`, `app/admin/invoices/*`, `app/contracts`. Libs: `lib/billing/*`, `commit-seats.ts`, `catalog.ts`. Contract values and service revenue appear in dashboard/KPI data; no single “financial ledger” module fully mapped.

### 14. Stripe billing

- **Webhook:** `api/stripe/webhook/route.ts` — signature verification; `createAdminClient()`; handles `checkout.session.completed`, subscription updates; syncs `organizations` (stripe_customer_id, stripe_subscription_id, billing_status), `org_subscriptions`, `org_addons`.
- **Checkout:** `api/stripe/checkout-session`, `api/checkout` (Cub/Black Bear/Grizzly/Kodiak price ids from env). Portal: `api/stripe/portal` — `requireOrgSeatAdmin`. Seat billing: `api/org/seats/commit`, `api/org/seats/preview-total`; catalog addons (Helphub, LIDAR, AI).

### 15. AI modules

- **Service:** `src/lib/ai/openai-service.ts`; org-level config / `OPENAI_API_KEY`; model from env.
- **Routes (api/ai/):** analyze-sds, compliance-suggestions, invoice-notes, pain-points, po-recommendations, scan-schedule, split-crews, staffing-suggestions. All use `requireApiOrg()` (and some feature checks). Risk scoring: `lib/risk/*`, `api/internal/risk/run` (admin/cron), not AI.

### 16. Dashboards

- **Executive / KPIs / Daily:** `app/dashboard`, `app/executive`, `app/kpis`, `app/daily`, `app/overview`; `lib/dashboard-data.ts`, `lib/overview-data.ts`, `actions/kpi-command-center.ts`. Sales: `app/sales-dashboard`, `lib/sales-dashboard-data.ts`. Ops: command center above.

### 17. Scheduled jobs

- **Cron (api/cron/):** daily-operator-performance, payment-reminders, contract-renewals, sequence-processor, refresh-benchmark-aggregates, missed-task-notifications, sales-pulse-daily, sales-pulse-weekly, recurring-billing. Secured by `CRON_SECRET` or job-specific (e.g. `SALES_PULSE_CRON_SECRET`, `INTERNAL_CRON_SECRET`). Internal: `api/internal/billing/daily`, `api/internal/risk/run` — header/secret check.

### 18. Logging systems

- **Authz:** `src/lib/auth/authz-log.ts` — `logAuthzError`, `logAuthzDenial` (structured JSON to console). Audit: `src/lib/audit-log.ts`, `src/lib/auth/governance-audit.ts`; DB tables (084, enterprise audit migrations). General: `console.log`/`console.error` in middleware when `NODE_ENV === 'development'` or debug env; `src/lib/activity-logger.ts`. No centralized error-tracking service (e.g. Sentry) referenced in code.

### 19. Environment variables

- **Supabase:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Server env: `src/lib/env.ts` — required URL/anon; service role optional string (empty throws in createAdminClient when used).
- **Stripe:** `STRIPE_SECRET_KEY`, `STRIPE_BILLING_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; plan price ids (`STRIPE_CUB_PRICE_ID`, etc.); addon price ids.
- **Cron:** `CRON_SECRET`, `INTERNAL_CRON_SECRET`, `SALES_PULSE_CRON_SECRET`.
- **Auth/debug:** `JANIBEAR_ADMIN_RESET_SECRET`, `NEXT_PUBLIC_AUTH_DEBUG`, `NEXT_PUBLIC_GUARD_DEBUG`, `DEBUG_AUTH`, `E2E_AUTHZ_SIMULATE_FAIL`.
- **App:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_APP_DOMAIN`. **AI:** `OPENAI_API_KEY`, `OPENAI_MODEL`. **Integrations:** QuickBooks env vars.

### 20. Deployment assumptions

- **Host:** Vercel (implied from context). Middleware runs at edge; cookie fallback for Edge. Env must set all required vars; service role only on server; no client-side Stripe secret or service role.

---

## PART 2 — CORE PLATFORM AUDIT (Scores 0–10)

| Category | Score | Notes |
|----------|-------|--------|
| **A. Authentication** | 7 | Login/session/middleware solid; cookie fallback for Edge; password reset routes exist. User provisioning via invites/org_members; no major gaps. |
| **B. RBAC / Governance** | 7 | Dual system (legacy + governance); requirePermission used widely; site admin + platform admin bypass; client viewer not fully traced in this audit. |
| **C. Tenant Isolation** | 8 | org_id on records; RLS and server checks; requireOrg/requireApiOrg on app APIs; public APIs use RPC or minimal data. |
| **D. Org Hierarchy** | 7 | org_type/shell/franchise relationships present; RLS and nav differentiate franchisor vs operator; canSeeLaborData and joint-employer rules referenced. |
| **E. Sales Engine** | 6 | Leads, conversion, walkthroughs, proposals, launch packets exist; two conversion paths (one weak, one robust unused); duplicate detection wired on create; post-convert redirect and nav fixed; contact creation on convert still weak. |
| **F. LiDAR System** | 7 | Bucket RLS by org path; extract-scope and transcribe gated and org-checked; scan status table; no unauthenticated upload. |
| **G. Proposal Engine** | 5 | Scope extraction and AI used; proposal/bid UI and DB exist; end-to-end “generate proposal” flow and versioning not fully verified. |
| **H. Launch to Ops Handoff** | 6 | Launch packets and sendLaunchPacketToOps; createLaunchPacket + UI; ops launch-intake; plan-gated; full crew/schedule setup not traced. |
| **I. Operations System** | 6 | Command center, schedules, risk, service-deployments, inspections; layout gated; crew assignment and task flows in codebase. |
| **J. Inspection / QC** | 6 | Inspection routes and AI analysis; QC/issues routes; templates and scoring in migrations. |
| **K. Financial Tracking** | 5 | Dashboards and billing; contract/revenue in KPIs; no single ledger/GL module clearly mapped. |
| **L. Billing** | 7 | Stripe webhook verified; checkout/portal; seat and addon catalog; proration via Stripe. |
| **M. AI Features** | 6 | All AI routes require org; feature/module gating where needed; no rate/usage tracking observed. |
| **N. Dashboards** | 6 | Executive, KPIs, sales, ops; data libs and nav; some redundancy (sales vs CRM pipeline). |
| **O. Database / Schema** | 6 | Many tables and migrations; indexes and constraints in place; migration safety not fully audited. |
| **P. RLS / Backend Security** | 7 | Broad RLS coverage; helpers; storage RLS; service role only in trusted server paths. |
| **Q. Route Safety** | 7 | App pages use requireOrg/requirePermission; API routes use requireApiOrg/requirePermission; admin routes check isPlatformAdmin; cron use secret. |
| **R. Observability** | 4 | Console and authz logs; audit tables; no centralized error tracking or cron job visibility in UI. |
| **S. UX Readiness** | 5 | Onboarding and empty/loading/error states exist; some disabled placeholders (Log call, Add note); first-run experience not fully verified. |
| **T. Deployment Safety** | 6 | Env validation for Supabase; service role required when used; no runtime env dump; production vs staging not explicitly separated in code. |

---

## PART 3 — WORKFLOW WALKTHROUGH (Where Flows Break)

1. **Lead created** — `actions/leads.ts` createLead; duplicate detection runs after insert. **Break:** None critical; optional duplicate flag.
2. **Walkthrough scheduled** — Walkthrough form at `app/walkthroughs/new`; `?leadId=` pre-fills from lead. **Break:** None; link from lead detail present.
3. **LiDAR scan uploaded** — Client uploads to storage; path must be `org/{org_id}/...`. **Break:** Client must enforce path; RLS blocks wrong org.
4. **Proposal generated** — Extract-scope from transcript; proposal creation in UI/bids. **Break:** No single “generate from scope” API traced; possible manual steps.
5. **Proposal accepted** — DB status updates; no automated “accepted” → contract event fully traced.
6. **Account launched to ops** — createLaunchPacket → sendLaunchPacketToOps; ops launch-intake. **Break:** Crew/schedule setup after handoff not fully traced.
7. **Crew assigned** — Ops flows and account-assignment; **Break:** Not traced step-by-step.
8. **Service schedule created** — Schedules routes and data; **Break:** Not traced end-to-end.
9. **Inspection performed** — Start/run inspection; **Break:** Submission and persistence assumed.
10. **QC score recorded** — Inspection scores in DB; **Break:** Not traced.
11. **Account health updated** — Risk engine and ops risk routes; **Break:** Dependency on cron/internal risk run.
12. **Revenue tracked** — KPIs and financial-health; **Break:** No dedicated revenue ledger; depends on contract/opportunity data.

**Summary:** Sales lead → walkthrough → proposal path is partially hardened; conversion still does not create contact. Launch to ops exists but full ops chain (crew, schedule, inspection, revenue) is not fully traced and may have gaps.

---

## PART 4 — SECURITY / FAILURE RISKS

| Risk | Finding | Severity |
|------|--------|----------|
| **Cross-org data leaks** | RLS and server checks in place; API routes that use createClient() with requireOrg/requirePermission are gated. Public location RPC returns only name/org_name. | Low |
| **Broken role restrictions** | Admin routes use isPlatformAdmin or requireOrgPermission; ops/sales use requirePermission. Possible inconsistency if a page or API is added without a check. | Medium |
| **RLS gaps** | New tables must add RLS; 114 and others extend governance. No audit of every table in this pass. | Medium |
| **Insecure APIs** | extract-scope, transcribe, map/data, org/list require auth/org. Stripe webhook verifies signature. Cron use secret. | Low |
| **Proposal data leaks** | Proposal APIs gated by org; RLS on proposals/sales_proposals assumed from CRM migrations. | Low |
| **Customer data exposure** | PII behind org membership and permission; franchisor rules limit labor data. | Low |
| **LiDAR file exposure** | Storage RLS by org path; no public read. | Low |
| **Stripe duplication risks** | Webhook idempotency (e.g. subscription update) not fully verified; metadata org_id used. | Medium |
| **AI endpoint abuse** | All require org; no per-org or per-user rate limiting seen. | Medium |
| **Admin route exposure** | Platform console and admin APIs check isPlatformAdmin or getEffectiveAccessForCurrentUser. | Low |

---

## PART 5 — FILE-LEVEL FINDINGS

| File | What it does | Risk | Severity | Recommended fix |
|------|--------------|------|----------|-----------------|
| `src/lib/env.ts` | Server env: SERVICE_ROLE optional string | If cron/webhook run without key, createAdminClient throws (fail-safe). Empty string same. | Low | Document that service role is required in prod for cron/webhook. |
| `src/app/api/public/locations/[id]/route.ts` | Returns location display via RPC | RPC `get_public_location_display` returns only name, org_name; SECURITY DEFINER. | Low | Ensure RPC stays minimal; no PII. |
| `src/app/api/onboarding/import/run/route.ts` | Import run | Uses `requireImportPermission()` for userId/orgId; then validates batch.org_id === orgId. | Low | None. |
| `src/actions/leads.ts` | createLead, convertLeadToOpportunity | convertLeadToOpportunity does not create contact; duplicate account check added. | High | Create contact on convert; set primary_contact_id if schema supports. |
| `src/lib/sales/convertLead.ts` | Full conversion (unused) | Not used; richer logic exists here. | Medium | Either use this path from modal or merge logic into actions/leads. |
| `src/app/app/ops/layout.tsx` | Gates ops content | isOperationsEnabled(orgId, userId); platform admin bypass. | Low | None. |
| `src/app/app/layout.tsx` | Billing lock redirect | Skips for platform admin. | Low | None. |
| `src/app/api/stripe/webhook/route.ts` | Stripe events | Signature verification; admin client. | Low | Add idempotency for subscription.updated if not present. |
| `src/app/api/cron/*/route.ts` | Cron handlers | CRON_SECRET or job secret. | Low | Ensure Vercel cron env set in prod. |
| `src/app/api/admin/tenants/set-plan/route.ts` | Set org plan | isPlatformAdmin check. | Low | None. |
| `src/lib/supabase/middleware.ts` | Session + org resolution | Cookie fallback for Edge. | Low | None. |
| `src/lib/auth/permission-helpers.ts` | requirePermission, hasPermission | Site admin bypass; membership + RPC. | Low | None. |
| `supabase/migrations/038_public_ticket_facility.sql` | get_public_location_display | Uses `facilities`; returns name, org_name only. | Low | None. |
| `supabase/migrations/025_walkthrough_scans_bucket_and_status.sql` | Storage RLS | Org path enforcement. | Low | None. |

---

## PART 6 — TESTING GAP ANALYSIS

| Gap | Missing | Recommendation |
|-----|--------|----------------|
| **Permission tests** | E2E for “Cub user cannot access Grizzly route” (e.g. 403 or paywall). | Add Playwright: login as Cub, visit /app/ops, expect upgrade or 403. |
| **Tenant isolation tests** | E2E or integration: request with org A cookie must not return org B data. | Add test that switches org and asserts data change; or API test with two orgs. |
| **Sales workflow tests** | E2E for create lead → schedule walkthrough → convert → opportunity. | Add flow: create lead, open walkthrough with leadId, convert, assert opportunity exists. |
| **Inspection tests** | E2E for start inspection → submit → score. | Add minimal flow if inspections are critical path. |
| **Billing tests** | No Stripe webhook or checkout E2E in repo. | Add webhook signature test (mock); or staged checkout E2E with test key. |
| **LiDAR ingestion tests** | No test for upload → RLS block for wrong org. | Add integration test: upload with path for org B as org A member, expect 403. |
| **Cron tests** | No test that cron returns 401 without secret. | Add API test: POST without CRON_SECRET, expect 401. |
| **Auth redirect tests** | auth-redirect, dashboard-no-marketing-flash, forbidden-no-flash exist. | Keep; add onboarding completion E2E if not present. |

---

## PART 7 — SCORECARD (0–10)

| Dimension | Score | Note |
|-----------|-------|------|
| Authentication | 7 | Solid; Edge cookie handling and throttling addressed. |
| RBAC | 7 | Dual model; enforced on server and in RLS. |
| Tenant isolation | 8 | org_id + RLS + server checks. |
| Org hierarchy | 7 | Franchisor/operator and shell in place. |
| Sales engine | 6 | Conversion and nav improved; contact on convert weak. |
| Operations engine | 6 | Present and gated; full chain not traced. |
| Inspection/QC | 6 | Routes and AI; no E2E. |
| Financial tracking | 5 | KPIs and billing; no single ledger. |
| Billing safety | 7 | Stripe verified; webhook and portal. |
| AI reliability | 6 | Gated; no rate/usage tracking. |
| Database integrity | 6 | Schema and RLS broad; migration discipline assumed. |
| RLS security | 7 | Strong; service role confined. |
| Observability | 4 | Logs and audit; no Sentry/cron UI. |
| UX readiness | 5 | Onboarding and states; some TODOs. |
| Deployment safety | 6 | Env and secrets; no staging flag in code. |

**Overall average:** ~6.2

---

## PART 8 — FINAL VERDICT

**Verdict: Close but dangerous**

**Why not “Not close to production”:** Auth, tenant isolation, RLS, and billing are implemented. Sales and ops modules exist; platform admin and plan gating work. Critical paths (login, org resolution, Stripe, LiDAR storage) are secured.

**Why not “Ready for controlled beta”:** (1) Conversion still does not create a contact, which hurts proposal and handoff quality. (2) Observability is weak—no centralized errors or cron visibility—so production incidents will be hard to diagnose. (3) Testing gaps: no tenant isolation E2E, no sales workflow E2E, no billing/LiDAR tests. (4) Plan source duality (organizations.plan vs org_subscriptions.plan_code) can cause UI/gating drift. (5) Some flows (proposal acceptance → contract, full ops chain) are not fully traced and may have gaps.

**Why not “Ready for paying customers”:** Same as above, plus: no rate limiting on AI; no formal incident/rollback playbook referenced; and first-run experience for a new tenant is not fully validated.

**Summary:** With 2–4 weeks of focused work on contact-on-convert, observability, and critical E2E tests, the app can be “Ready for controlled beta.” For paying customers, add rate limiting, plan-source alignment, and full workflow verification.

---

## PART 9 — PRIORITIES

### Top 10 production blockers

1. **Contact not created on lead conversion** — Proposals and handoff need a contact; opportunity has no primary contact. Fix in `convertLeadToOpportunity`.
2. **No centralized error tracking** — Production errors only in console/logs. Add Sentry (or equivalent) and error boundaries.
3. **No tenant isolation E2E test** — Risk of cross-org data leak in new code. Add Playwright test.
4. **Plan source duality** — organizations.plan vs org_subscriptions.plan_code; checkout/admin must keep in sync or use one source.
5. **Cron job visibility** — No UI or alerting if cron fails. At least log failures and consider health dashboard.
6. **Stripe webhook idempotency** — subscription.updated and other events; ensure duplicate events do not double-apply.
7. **AI routes without rate limiting** — Abuse or cost spike. Add per-org or per-user limits.
8. **Conversion path fragmentation** — Two implementations; consolidate or document which is canonical.
9. **Observability for authz failures** — Authz logs exist but no aggregation; hard to see denial patterns.
10. **Missing E2E for sales critical path** — Create lead → walkthrough → convert → opportunity; add test.

### Top 10 highest-value fixes

1. Create contact on lead conversion and link to opportunity/account.
2. Add Sentry (or similar) and error boundaries for app and API.
3. Add tenant isolation E2E test.
4. Unify or document plan source (org_subscriptions.plan_code vs organizations.plan).
5. Add sales critical-path E2E (lead → walkthrough → convert → opportunity).
6. Add cron failure logging and optional health endpoint for cron last-run.
7. Rate limit AI routes by org or user.
8. Use or merge `convertLeadToSalesObjects` into the live conversion flow.
9. Add Stripe webhook idempotency (e.g. event id or idempotency key).
10. Add “last run” or status for critical crons in platform console or admin.

### Fastest path to beta

1. Fix contact creation in `convertLeadToOpportunity` (1–2 days).
2. Add Sentry and one global error boundary (1 day).
3. Add one tenant isolation E2E and one sales flow E2E (2–3 days).
4. Document plan source and ensure checkout/webhook set both plan sources (1 day).
5. Add cron failure logging and a simple health check for cron (1 day).

**Total:** ~1–2 weeks.

### Fastest path to production (paying customers)

1. Complete “path to beta” above.
2. Add AI rate limiting and usage tracking (2–3 days).
3. Add billing E2E (checkout or webhook mock) (1–2 days).
4. Full workflow verification: proposal acceptance → contract → launch → ops (3–5 days).
5. Rollback and incident runbook; env checklist for prod (1 day).
6. Staging vs production env separation and smoke test (1–2 days).

**Total:** ~3–4 weeks after beta-ready.

---

*End of audit. All findings are based on real code and migrations in the repository as of the audit date.*
