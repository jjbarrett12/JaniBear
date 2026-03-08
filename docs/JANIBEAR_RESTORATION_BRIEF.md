# JANIBEAR Restoration Brief

**Purpose:** Re-establish project context, architecture, and next priorities after restoring development on a new machine.  
**Audience:** Build agent, onboarding engineers.  
**Date:** 2025-03-07.

---

## 1. Codebase Analysis

### 1.1 Product Modules

| Module | Routes / Entry | Key libs / actions | Notes |
|--------|----------------|--------------------|--------|
| **Sales (Grizzly)** | `/app/sales/*`, `/app/crm/*`, `/app/sales-dashboard` | `actions/leads.ts`, `actions/crm.ts`, `lib/sales/*`, `lib/sales-dashboard-data.ts`, `lib/sales/sales-command-data.ts` | Leads, conversion, pipeline, walkthroughs, proposals, launch packets |
| **Operations (Kodiak)** | `/app/ops/*` (command-center, launch-intake, schedules, crews, inspections, risk, performance, service-deployments) | `lib/ops/getCommandCenterData.ts`, `lib/command-center-data.ts`, `actions/launch-plan.ts`, `actions/account-assignment.ts`, `lib/ops-core/*` | Layout gated by `isOperationsEnabled`; platform admin bypass |
| **Crew (Cub)** | `/app/crews/*`, crew assignment in ops | `api/app/ops/crews/route.ts`, crew_assignments, crew_members | Labor data; operator-only (franchisor no access) |
| **LiDAR / Walkthroughs** | `/app/walkthroughs/*`, `/app/sales/walkthroughs` | `api/extract-scope/route.ts`, `api/transcribe/route.ts`, `lib/prop/*`, storage `walkthrough-scans` | Bucket RLS by org path; `walkthrough_scans` table; see `LIDAR_SCAN_DATA_MODEL.md` |
| **Proposals / Bids** | `/app/bids/*`, `/app/proposals/build`, `/app/sales/scope*` | Scope extraction, `scope_models`, proposal generation | Proposal engine partially traced; versioning not fully verified |
| **Launch to Ops** | `/app/ops/launch-intake`, `/app/sales/launch-packets`, `/app/sales/scope` | `launch_plans` (050), `launch_packets` (054), `actions/launch-plan.ts`, `send-to-ops` UI | Two concepts: **launch_plans** (per opportunity), **launch_packets** (per account; used by launch-intake UI) |
| **AI Onboarding / Import** | `/onboarding/import/*` (upload, review, confirm, done) | `api/onboarding/import/*` (parse, run, rollback, map, create-batch, command-center), `lib/onboarding-import/*` | Import batches (107), spreadsheet migration; audit/rollback support |
| **Inspections / QC** | `/app/inspections/*`, `/app/ops/inspections`, `/app/qc-assign`, `/app/issues/*` | `inspections`, `inspection_section_scores`, `inspection_responses`, `inspection_photos`; AI: `api/ai/analyze-sds`, `api/ai/compliance-suggestions` | Templates, sections, items; RLS in 002, 023 |
| **Dashboards / KPIs** | `/app/dashboard`, `/app/executive`, `/app/kpis`, `/app/benchmarks`, `/app/alerts`, `/app/financial-health` | `lib/dashboard-data.ts`, `lib/overview-data.ts`, `actions/kpi-command-center.ts`, `lib/widgets/registry/*` | Executive/sales/ops split; franchisee/franchisor dashboards |
| **Franchise / Multi-tenant** | `/app/franchise/*`, `/franchisor/*`, `/app/opportunities/network` | `lib/org-type.ts`, `lib/shell.ts`, `lib/nav/navFactory.ts`; RLS `is_franchisor_org`, `is_operator_org`, `org_can_see_labor_data` | Shell: owner_operator \| franchisee \| franchisor; nav and layout differ by shell |

### 1.2 App Routes (Summary)

- **Marketing:** `(marketing)/` — page, about, contact, demo, pricing, privacy, survey, terms, why-janibear.
- **Auth:** `auth/` — login, signup, callback, continue, forgot-password, reset-password, admin.
- **Onboarding:** `onboarding/`, `onboarding/import/*` — wizard, import upload/review/confirm/done.
- **App (authenticated):** `app/` — dashboard, financial-health, kpis, map, benchmarks, helphub; sales/*; crm/*; ops/*; accounts, sites, locations; walkthroughs, bids, proposals; inspections, issues, tickets; contracts, billing, upgrade; admin/*; settings; university; pro-gear; franchise; opportunities/network.
- **Platform:** `platform/` — (console): overview, orgs, orgs/new, orgs/[orgId]; forbidden.
- **Franchisor:** `franchisor/` — page, brand-ops, finance, franchisees.
- **Operator:** `operator/` — page (landing).

### 1.3 Database Schema Structure

- **Core:** `organizations` (org_type, ownership_model, shell), `profiles`, `org_members` (role: owner, admin, manager, sales, ops, inspector, client_viewer, etc.).
- **CRM spine:** `clients` → `locations` (canonical facility; some code still uses “sites”/accounts) → `opportunities` → `walkthroughs` → `bids`; `crm_activities`, `crm_contacts`.
- **Sales:** `leads`, `opportunities`, `sales_proposals`, `proposals`; Grizzly migrations 113, 112 (revenue, capacity).
- **Launch:** `launch_plans` (050, opportunity_id), `launch_packets` (054, account_id, payload_jsonb).
- **Ops:** `locations`, `crews`, `crew_members`, `crew_assignments`, `schedules`, `task_assignments`, `task_completions`; `service_deployments` (111), ops-core (115, 116).
- **Inspections:** `templates`, `template_sections`, `template_items`, `inspections`, `inspection_section_scores`, `inspection_responses`, `inspection_photos`.
- **LiDAR:** `walkthrough_scans` (status, roomplan_raw_path, preview_images, extracted); storage bucket `walkthrough-scans` with org path.
- **RBAC:** Legacy: `role_permissions` (094). Governance: `gov_roles`, `gov_permissions`, `gov_role_permissions`, `gov_member_roles`, `gov_member_permissions`, `member_effective_permissions` (114).
- **Feature gating:** `org_features` (094, per-org addon flags); `features`, `plans`, `plan_features` (046, 043).
- **Franchise:** `franchise_relationships` (114) and **`franchise_associations`** (019, with status). **Risk:** Two tables; app code uses `franchise_associations` (shell.ts, territory-map, performance); 114 uses `franchise_relationships`. Needs reconciliation.
- **Import:** `import_batches`, `import_batch_items` (107).
- **Billing:** `org_subscriptions`, `org_addons`, Stripe webhook; seat billing (096), plan source (119).

All tenant tables are **org-scoped** (`org_id`); RLS uses `is_org_member`, `has_org_role`, `has_org_permission`.

### 1.4 Role / Permission Model

- **Legacy:** `org_members.role` (owner, manager, admin, inspector, sales, ops, client_viewer, etc.) → `role_permissions` (permission_key). Policies use `role IN ('owner','manager','admin', ...)`.
- **Governance (114):** `gov_roles` (owner, ops_manager, sales_manager, sales_rep, supervisor, crew_member, client_viewer, franchisor_admin, super_admin) → `gov_role_permissions` → `gov_permissions`. `gov_member_roles` links org_member to gov role; `gov_member_permissions` for direct grant/revoke. **member_effective_permissions** view = role permissions minus revokes plus direct grants.
- **Helpers:** `has_org_permission(org_id, permission_key)` checks both gov and legacy; `has_permission` RPC delegates to it. `is_franchisor_of(franchisee_org_id)` for franchise access.
- **App:** `src/lib/auth/governance-permissions.ts` — permission keys; `requirePermission` (authz), `requireOrgMember`, `requireApiOrg` in routes/actions.

### 1.5 Plan / Feature Gating

- **Plans/tiers:** `plans`, `plan_features` (046); `org_subscriptions`, `org_addons`; Stripe price ids (Cub, Black Bear, Grizzly, Kodiak).
- **Per-org addons:** `org_features` (org_id, feature_key, enabled) — e.g. addon.lidar, addon.ai_proposals.
- **Enforcement:** `isOperationsEnabled`, `is-premium`, layout/route guards; feature-gate component; catalog in `lib/billing/catalog.ts`.

### 1.6 Sales vs Ops Split

- **Nav:** `navFactory.ts` — Executive, Sales, Launch, Operations, System. Sales: command, leads, accounts, contacts, pipeline, walkthroughs, proposals, map. Ops: accounts (active), sites, crews, schedules, inspections, QC, issues, tasks, supplies, contracts, command center, service-deployments, performance, risk.
- **Layout:** Dashboard redirects sales rep to `/app/sales-dashboard`; franchisor to `/app/franchise`. Ops layout (`app/ops/layout.tsx`) gated by `isOperationsEnabled(orgId, userId)` (plan + platform admin bypass).
- **Data:** Sales: leads, opportunities, walkthroughs, proposals, launch packets. Ops: locations, crews, schedules, inspections, issues, tasks; launch-intake consumes launch_packets.

### 1.7 Launch to Ops Flow

- **Doc:** `SALES_OPS_HANDOFF.md` — opportunity won → site_id, ops_handoff_status (pending → acknowledged → scheduled); launch packets and send-to-ops UI.
- **Tables:** `launch_plans` (opportunity_id, status: draft → sales_ready → ops_ready → launched); `launch_packets` (account_id, status, payload_jsonb with scope, schedule_draft, supplies, contacts).
- **UI:** Sales: `/app/sales/launch-packets`, create/send launch packet. Ops: `/app/ops/launch-intake` lists packets (ready, sent_to_ops), then intake flow.

### 1.8 AI Onboarding / Import Flow

- **Routes:** `/onboarding/import` (upload → review → confirm → done); APIs: parse, run, rollback, map, create-batch, command-center, audit.
- **Schema:** `import_batches` (status: uploaded → mapped → importing → done/failed/rolled_back), `import_batch_items` (entity_type, entity_id for rollback); storage for uploaded file.
- **Lib:** `lib/onboarding-import/` (normalize, schemas, ai-map); `ImportReviewClient`, `ImportUploadClient`, `ImportConfirmClient`, `ImportDoneClient`.

### 1.9 LiDAR-Related Code and Dependencies

- **Docs:** `LIDAR_SCAN_DATA_MODEL.md`, `LIDAR_AND_SURFACE_STRATEGY.md`, `WALKTHROUGH_CAMERA_LIDAR_IMPLEMENTATION.md`, `MOBILE_LIDAR_ARCHITECTURE.md`.
- **Schema:** `walkthrough_scans` (org_id, walkthrough_id, status, roomplan_raw_path, preview_images, extracted); bucket `walkthrough-scans` path `org/{org_id}/walkthroughs/{walkthrough_id}/scans/{scan_id}/`.
- **API:** `api/extract-scope`, `api/transcribe` — org and feature gated; scope → `scope_models`.
- **Mobile:** `apps/janibear-scan` (separate app for scan capture).

### 1.10 Dashboards / KPIs

- **Routes:** `/app/dashboard` (executive command center), `/app/kpis`, `/app/benchmarks`, `/app/financial-health`, `/app/alerts`, `/app/executive`; dashboard by shell: owner-operator, franchisee, franchisor.
- **Data:** `getCommandCenterData`, `lib/dashboard-data.ts`, `lib/overview-data.ts`, `actions/kpi-command-center.ts`; KPI summary view (073); widgets registry (kpi-widgets, sales-widgets).
- **Financial health:** Operator and franchisor dashboards; leaderboard; filters.

### 1.11 Inspection / QC Flows

- **Tables:** inspections → template, location, schedule, inspector; section_scores, responses, photos (RLS 023).
- **Routes:** `/app/inspections/run`, `/app/ops/inspections`; QC assign, issues list/detail.
- **AI:** analyze-sds, compliance-suggestions.

### 1.12 Franchise / Multi-Tenant Support

- **Org types:** `org_type`: operator | franchisor (016). `ownership_model`: independent | unit_franchisee | area_franchisor (114). **Shell:** owner_operator | franchisee | franchisor (052) — **source of truth for UX** (`organizations.shell`).
- **Mapping:** owner_operator ↔ Independent; franchisee ↔ Unit franchisee; franchisor ↔ Area franchisor. Nav and layout use shell (shellNav → navFactory).
- **Franchise links:** Two tables exist: `franchise_associations` (019, status), `franchise_relationships` (114). Code references: shell.ts, territory-map, performance use **franchise_associations**; 114 RLS and `is_franchisor_of` use **franchise_relationships**. Must align or migrate to one.
- **RLS:** Franchisor read-only to franchisee data where `is_franchisor_of(org_id)` and permission `franchise.network.view`; labor/PII never to franchisor. JANIBEAR_OS_SYSTEM.md and `.cursor/rules/janibear-os-joint-employer.mdc` enforce this.

---

## 2. Restoration Brief — Structured Summary

### 2.1 Current Architecture Summary

- **Stack:** Next.js 14+ App Router, TypeScript, Tailwind, shadcn/ui, Supabase (Auth, Postgres, Storage, RLS). Stripe for billing. OpenAI for AI routes.
- **Tenancy:** Org-scoped tables; RLS with `is_org_member`, `has_org_role`, `has_org_permission`; server-side `requireOrg`, `requireOrgMember`, `requirePermission`, `requireApiOrg`.
- **Identity:** Shell (owner_operator | franchisee | franchisor) drives nav and dashboard experience; org_type + ownership_model used for RLS and franchise rules.
- **CRM spine:** clients → locations → opportunities → walkthroughs → bids; launch_plans (per opportunity) and launch_packets (per account) for handoff.
- **Dual RBAC:** Legacy role_permissions + governance (gov_roles, gov_permissions, member_effective_permissions); has_org_permission unifies both.

### 2.2 What Appears Complete

- Auth, session, middleware, cookie fallback for Edge; invite/org_members; password reset.
- Org-scoped RLS on core tables; requireOrg/requireApiOrg on app APIs.
- Sales: leads, conversion, pipeline, walkthroughs (non-LiDAR), launch packets UI, send-to-ops.
- Ops: command center, launch-intake (launch_packets), schedules, crews, inspections, risk, performance, service-deployments.
- Dashboards: executive, KPIs, financial-health, alerts, benchmarks; shell-aware redirects.
- Franchisor layout and nav; outcome-only visibility rules in RLS (is_franchisor_of, franchise.network.view).
- Stripe webhook, checkout, portal; seat billing; plan/addon catalog.
- Onboarding: signup → onboarding → create org → set-org-and-continue; import wizard (upload → review → confirm → done) and import APIs.
- LiDAR: storage bucket, walkthrough_scans table, path convention, extract-scope/transcribe gated; mobile scan app exists.

### 2.3 What Appears Partially Built

- **Proposal engine:** Scope extraction and AI used; full “generate proposal” E2E and versioning not fully verified (audit score 5).
- **Launch to Ops:** Two models (launch_plans vs launch_packets); full crew/schedule setup from handoff not fully traced.
- **Gov RBAC:** Gov roles/permissions seeded; not all app code uses permission keys from gov; legacy role strings still in many RLS policies.
- **Plan gating:** Two sources (organizations.plan vs org_subscriptions.plan_code); alignment or single source not finalized.
- **Franchise tables:** franchise_associations vs franchise_relationships; shell.ts uses associations; 114 uses relationships — partial split.
- **Financial ledger:** Contract/revenue in KPIs; no single GL/ledger module.
- **Billing UI:** Entitlements in DB; no full billing portal yet (per BUILD_AGENT_BRIEF).

### 2.4 What Appears Broken or Risky

- **Franchise table duality:** `franchise_associations` (019) vs `franchise_relationships` (114). Shell and territory-map query **franchise_associations**; governance and `is_franchisor_of` use **franchise_relationships**. Risk: franchisee enrollment and franchisor visibility may be inconsistent. **Action:** Unify on one table (or sync both) and update all reads.
- **Walkthroughs permission import:** PRE_LAUNCH_AUDIT notes fix applied (requirePermission from authz); verify no other actions import from wrong auth module.
- **org_members.role vs gov_roles:** RLS and app mix legacy role names (owner, admin, manager, sales, ops) and gov keys (owner, ops_manager, sales_manager). Gov member_roles may not be populated for all members — permission checks fall back to legacy; ensure backfill or migration for gov_member_roles where needed.
- **Sites vs locations vs accounts:** Canonical facility is `locations` (048); some code and docs still say “sites” or “accounts”; ensure all references use locations for CRM spine and RLS.

### 2.5 Missing Production-Readiness Items

- Single **plan source of truth** (org_subscriptions vs organizations.plan) and consistent gating.
- **E2E tests** for onboarding, plan gating, tenant isolation (audit recommendation).
- **Error tracking** (e.g. Sentry) not referenced in codebase.
- **Rate/usage tracking** for AI routes not observed in audit.
- **Franchise table reconciliation** and full path using one model.
- **Gov RBAC rollout:** Ensure all RLS and API guards can run on gov permissions; legacy as fallback during transition.
- **Demo form:** “POST to API or Supabase when backend ready” — wire or remove.

### 2.6 Top 10 Next Implementation Priorities

1. **Franchise table reconciliation** — Use a single franchise link table (or sync both); update shell.ts, territory-map, performance, and all RLS to one source; document which is canonical.
2. **Plan source of truth** — Decide and implement: org_subscriptions.plan_code (or similar) vs organizations.plan; use it everywhere for gating and UI.
3. **Launch handoff E2E** — From “mark won” / “send launch packet” through ops intake to first schedule/crew; fix any gaps in launch_plans vs launch_packets usage.
4. **Gov RBAC consistency** — Backfill gov_member_roles for existing org_members (role → gov role mapping); optionally migrate RLS to has_org_permission only; deprecate legacy role checks where safe.
5. **Proposal generation E2E** — One documented path: scope → proposal create → versioning and send; tests and error handling.
6. **LiDAR native flow** — End-to-end from mobile scan upload to walkthrough_scans and extract; ensure bucket RLS and extract-scope use same org/walkthrough.
7. **Onboarding org_type/shell** — Set org_type and shell when creating org (e.g. in create_org_for_signup or equivalent); align with ownership_model.
8. **Franchisor labor guard** — Audit all labor/crew/PII endpoints and RLS for is_operator_org / org_can_see_labor_data; ensure no franchisor path.
9. **E2E test suite** — Onboarding, plan gating, tenant isolation, critical sales and ops flows.
10. **Observability** — Centralized error tracking (e.g. Sentry); optional rate/usage for AI; cron observability (118) used in monitoring.

---

## 3. Phased Roadmap for Finishing JANIBEAR

### Phase 1 — Security and Governance

- Unify franchise relationship model (one table or sync) and update all consumers.
- Enforce single plan source for gating and billing UI.
- Gov RBAC: backfill gov_member_roles; migrate high-value RLS to has_org_permission; document permission keys.
- Franchisor labor guard: audit and fix any RLS/API that could expose labor/PII to franchisor.
- Audit server actions and API routes for correct requirePermission/requireOrg usage; fix any broken imports.

### Phase 2 — Core Workflows

- Launch to Ops: single clear path (launch_plans vs launch_packets); ops intake → first schedule/crew assignment.
- Proposal E2E: scope → proposal create → send; versioning and error handling.
- LiDAR: mobile → upload → walkthrough_scans → extract-scope → scope_models; tests.
- Onboarding: set org_type/shell/ownership_model on org creation; plan selection in flow if needed.
- Import: validate rollback and audit paths; document limits and supported formats.

### Phase 3 — Polish and Dashboards

- Dashboard parity: owner-operator, franchisee, franchisor; consistent KPIs and copy (franchisor: “Suggested”, “Outcome Review” only).
- Financial health and reporting: clarify data source; optional GL/ledger if required.
- Billing portal: self-serve plan/addon and payment method management.
- UI/UX pass: design tokens, accessibility, mobile; per design rules (billion-dollar SaaS, black/gold).

### Phase 4 — Launch Hardening

- E2E: onboarding, plan gating, tenant isolation, sales and ops critical paths.
- Error tracking and alerting; cron health (118).
- Performance: indexes, N+1 checks, caching where appropriate.
- Runbooks: deployment, rollback, incident response; env and secrets checklist.
- Final security pass: RLS, API guards, no client-only enforcement.

---

## 4. Owner Types — Explicit Mapping

| Owner type (product) | DB / model | Shell | Notes |
|----------------------|------------|--------|--------|
| **Owner - Independent** | `ownership_model = 'independent'`, `org_type = 'operator'` | `shell = 'owner_operator'` | Full control; no franchise link. Nav: Executive, Sales, Launch, Operations, System. |
| **Owner - Area Franchisor** | `ownership_model = 'area_franchisor'`, `org_type = 'franchisor'` | `shell = 'franchisor'` | Standards and outcomes only; no labor control. Nav: Franchise (placement, listings, interests, awards, memberships), KPI dashboard, benchmarks, alerts; optional network opportunities if feature flag. Redirect from /app/dashboard to /app/franchise. |
| **Owner - Unit Franchisee** | `ownership_model = 'unit_franchisee'`, `org_type = 'operator'` | `shell = 'franchisee'` | Operates locations; may be linked to franchisor via franchise_relationships/franchise_associations. Nav: same as independent + “View suggested brand standards” and optional Network Opportunities if enrolled. Labor data visible; franchisor sees only aggregated/delayed outcomes. |

**Enrollment:** “Franchisee enrolled” = has active row in franchise_associations (or franchise_relationships once unified) with franchisee_org_id = current org. Used for nav (e.g. Network Opportunities) and territory-map.

**RLS:** Labor/crew/PII tables must restrict by `org_can_see_labor_data(org_id)` (i.e. operator only). Franchisor read-only access to franchisee data only via `is_franchisor_of(org_id)` and `franchise.network.view`, and only to non-labor, outcome-level data.

---

## 5. Implementation-Ready Conventions

- **Schema:** Additive migrations only; no duplicate concepts (e.g. one facility table: locations). All tables org-scoped unless global by design.
- **Permissions:** Prefer permission keys (governance-permissions.ts) over role names in new code; use has_org_permission in RLS where possible.
- **APIs:** requireOrg or requireApiOrg; requirePermission for sensitive actions; never trust client-supplied org_id without membership check.
- **Nav:** Single source: `src/lib/nav/navFactory.ts`; add items there and translation keys in app-translations; no duplicate arrays in sidebar components.
- **Franchisor copy:** Use “Recommended”, “Optional”, “Suggested Standard”, “Self-Reported”, “Outcome Review” — never “Required”, “Must”, “Assign”, “Enforce”, “Discipline”.
- **AI:** Analyze outcomes/patterns only; never recommend staffing, discipline, or individual worker performance (JANIBEAR_OS_SYSTEM.md).

---

## 6. Key File Reference

| Concern | Primary files |
|--------|----------------|
| Shell / org type | `src/lib/shell.ts`, `src/lib/shell-constants.ts`, `src/lib/org-type.ts` |
| Nav | `src/lib/nav/navFactory.ts`, `src/lib/nav/shellNav.ts` |
| Permissions | `src/lib/auth/governance-permissions.ts`, `src/lib/auth/requirePermission.ts`, `src/lib/api-guard.ts` |
| Launch | `src/app/app/ops/launch-intake/page.tsx`, `src/components/launch/*`, `src/actions/launch-plan.ts` |
| Onboarding import | `src/app/onboarding/import/*`, `src/lib/onboarding-import/*`, `src/app/api/onboarding/import/*` |
| LiDAR / scans | `LIDAR_SCAN_DATA_MODEL.md`, `src/lib/prop/*`, `api/extract-scope`, `api/transcribe` |
| Dashboards | `src/lib/dashboard-data.ts`, `src/lib/command-center-data.ts`, `src/app/app/dashboard/page.tsx` |
| Franchise | `supabase/migrations/019_*`, `supabase/migrations/114_*`, `src/lib/shell.ts` (isFranchiseeEnrolled) |
| RBAC | `supabase/migrations/094_*`, `supabase/migrations/114_*`, `member_effective_permissions` |

---

*End of Restoration Brief. Update this doc as architecture or priorities change.*
