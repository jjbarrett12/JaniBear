# JaniBear Role Migration — Repo Audit & Migration Mapping

**Purpose:** Safe refactor from current role/pages/permissions to the new seat-role model (cub, super_cub, grizzly, super_grizzly, kodiak, super_kodiak) with no duplicate pages, no broken links, and phased rollout (authz_version v1/v2).

---

## A) REPO AUDIT OUTPUT

### A.1 Every relevant route/page (file path and purpose)

| Route | File path | Purpose |
|-------|-----------|---------|
| **Dashboards** | | |
| `/app/dashboard` | `src/app/app/dashboard/page.tsx` | Owner Command Center: widget layout, executive toggle. Redirects franchisee→franchisee dashboard, sales_rep→sales-dashboard, franchisor→franchise. |
| `/app/dashboard/franchisee` | `src/app/app/dashboard/franchisee/page.tsx` | Franchisee-specific dashboard (stats, schedule, inspections). Redirects non-franchisee to owner-operator. |
| `/app/dashboard/owner-operator` | `src/app/app/dashboard/owner-operator/page.tsx` | Owner/operator dashboard (same data as franchisee layout). Redirects franchisee to franchisee. |
| `/app/executive` | `src/app/app/executive/page.tsx` | Executive Cockpit (KPI tiles, missed tasks, AI insights). **Gated:** `dashboard.exec`. |
| `/app/sales-dashboard` | `src/app/app/sales-dashboard/page.tsx` | Sales Command Center (proposals-driven). Redirects non–sales-rep to `/app/dashboard`. |
| `/app/ops` | `src/app/app/ops/page.tsx` | Stub “Operations” page. **Gated:** `dashboard.ops`. |
| **Sales** | | |
| `/app/sales` | `src/app/app/sales/page.tsx` | Sales landing. **Gated:** `dashboard.sales`. |
| `/app/sales/leads` | `src/app/app/sales/leads/page.tsx` | Leads list. |
| `/app/sales/leads/new` | `src/app/app/sales/leads/new/page.tsx` | New lead. |
| `/app/sales/leads/[id]` | `src/app/app/sales/leads/[id]/page.tsx` | Lead detail. |
| `/app/sales/accounts` | `src/app/app/sales/accounts/page.tsx` | Sales accounts (prospects/customers). |
| `/app/sales/accounts/[accountId]` | `src/app/app/sales/accounts/[accountId]/page.tsx` | Account detail. |
| `/app/sales/pipeline` | `src/app/app/sales/pipeline/page.tsx` | **Redirect only** → `/app/kpis?tab=pipeline`. |
| `/app/sales/walkthroughs` | `src/app/app/sales/walkthroughs/page.tsx` | Walkthroughs list. |
| `/app/sales/proposals` | `src/app/app/sales/proposals/page.tsx` | Proposals list. |
| `/app/sales/scope` | `src/app/app/sales/scope/page.tsx` | Scope packet. |
| `/app/sales/scope-builder` | (scope-builder) | Scope builder. |
| `/app/sales/launch-packets` | `src/app/app/sales/launch-packets/page.tsx` | Launch packets. |
| `/app/sales/launch-packets/[id]` | `src/app/app/sales/launch-packets/[id]/page.tsx` | Launch packet detail. |
| `/app/sales/launch-packet` | `src/app/app/sales/launch-packet/page.tsx` | **Redirect** → `/app/sales/launch-packets`. |
| `/app/sales/contract-launch` | `src/app/app/sales/contract-launch/page.tsx` | Contract launch. |
| `/app/sales/contract-launch/[id]` | `src/app/app/sales/contract-launch/[id]/page.tsx` | **Redirect** → `/app/sales/launch-packets/[id]`. |
| `/app/sales/win-loss` | `src/app/app/sales/win-loss/page.tsx` | Win/loss. |
| `/app/sales/cadence` | `src/app/app/sales/cadence/page.tsx` | Cadence. |
| `/app/sales/top-targets` | `src/app/app/sales/top-targets/page.tsx` | Top targets. |
| `/app/sales/territory` | `src/app/app/sales/territory/page.tsx` | Territory. |
| `/app/sales/approvals` | `src/app/app/sales/approvals/page.tsx` | Approvals. |
| **Crew / Ops (operations)** | | |
| `/app/ops/accounts` | `src/app/app/ops/accounts/page.tsx` | Ops accounts (active). |
| `/app/ops/crews` | `src/app/app/ops/crews/page.tsx` | **Redirect only** → `/app/crews`. |
| `/app/ops/schedules` | `src/app/app/ops/schedules/page.tsx` | Service schedules. |
| `/app/ops/inspections` | `src/app/app/ops/inspections/page.tsx` | Inspections (ops). |
| `/app/ops/qc` | `src/app/app/ops/qc/page.tsx` | **Redirect only** → `/app/qc-assign`. |
| `/app/ops/issues-sla` | `src/app/app/ops/issues-sla/page.tsx` | **Redirect only** → `/app/issues`. |
| `/app/ops/tasks` | `src/app/app/ops/tasks/page.tsx` | My tasks (ops). |
| `/app/ops/supplies` | `src/app/app/ops/supplies/page.tsx` | Supplies. |
| `/app/ops/contracts` | `src/app/app/ops/contracts/page.tsx` | **Redirect only** → `/app/contracts`. |
| `/app/ops/map` | `src/app/app/ops/map/page.tsx` | **Redirect only** → `/app/map`. |
| `/app/ops/launch-intake` | `src/app/app/ops/launch-intake/page.tsx` | Launch intake queue. |
| `/app/ops/launch-intake/[id]` | `src/app/app/ops/launch-intake/[id]/page.tsx` | Launch intake detail. |
| `/app/ops/launches` | `src/app/app/ops/launches/page.tsx` | Launches. |
| `/app/crews` | `src/app/app/crews/page.tsx` (if exists) or crews under app | Crew management. |
| `/app/crews/[id]` | `src/app/app/crews/[id]/page.tsx` | Crew detail. |
| `/app/crews/new` | `src/app/app/crews/new/page.tsx` | New crew. |
| `/app/sites` | `src/app/app/sites/page.tsx` | Sites/locations list. |
| `/app/sites/new` | `src/app/app/sites/new/page.tsx` | New site. |
| `/app/sites/[id]` | `src/app/app/sites/[id]/page.tsx` | Site detail. |
| `/app/sites/[id]/edit` | `src/app/app/sites/[id]/edit/page.tsx` | Edit site. |
| `/app/locations` | `src/app/app/locations/page.tsx` | **Redirect only** → `/app/accounts`. |
| `/app/locations/new` | `src/app/app/locations/new/page.tsx` | **Redirect** → `/app/accounts/new`. |
| `/app/locations/[id]` | (locations) | Location detail. |
| `/app/accounts` | `src/app/app/accounts/page.tsx` | Accounts (CRM). |
| `/app/accounts/new` | `src/app/app/accounts/new/page.tsx` | New account. |
| `/app/accounts/[id]` | `src/app/app/accounts/[id]/page.tsx` | Account detail. |
| `/app/accounts/[id]/edit` | `src/app/app/accounts/[id]/edit/page.tsx` | Edit account. |
| `/app/accounts/[id]/facilities/...` | (facilities) | Facility pages. |
| `/app/inspections` | `src/app/app/inspections/page.tsx` | Inspections list. |
| `/app/inspections/start` | `src/app/app/inspections/start/page.tsx` | Start inspection. |
| `/app/inspections/run` | `src/app/app/inspections/run/page.tsx` | Redirect → start. |
| `/app/inspections/[id]` | `src/app/app/inspections/[id]/page.tsx` | Inspection detail. |
| `/app/issues` | `src/app/app/issues/page.tsx` | Issues list. |
| `/app/issues/[id]` | `src/app/app/issues/[id]/page.tsx` | Issue detail. |
| `/app/tasks` | `src/app/app/tasks/page.tsx` | Tasks. |
| `/app/qc-assign` | `src/app/app/qc-assign/page.tsx` | QC assign. |
| `/app/contracts` | `src/app/app/contracts/page.tsx` | Contracts. |
| `/app/map` | `src/app/app/map/page.tsx` | Map. |
| **CRM** | | |
| `/app/crm` | `src/app/app/crm/page.tsx` | CRM hub. |
| `/app/crm/clients` | `src/app/app/crm/clients/page.tsx` | Clients. |
| `/app/crm/clients/new` | `src/app/app/crm/clients/new/page.tsx` | New client. |
| `/app/crm/clients/[id]` | `src/app/app/crm/clients/[id]/page.tsx` | Client detail. |
| `/app/crm/contacts` | `src/app/app/crm/contacts/page.tsx` | Contacts. |
| `/app/crm/pipeline` | `src/app/app/crm/pipeline/page.tsx` | Pipeline. |
| `/app/crm/opportunities/[id]` | `src/app/app/crm/opportunities/[id]/page.tsx` | Opportunity detail. |
| `/app/crm/activities` | `src/app/app/crm/activities/page.tsx` | Activities. |
| **Admin** | | |
| `/app/admin` | `src/app/app/admin/page.tsx` | Admin dashboard (cards to team, employees, compliance, SDS, POs, invoices, phone, AI, audit). **Role check:** owner, admin, manager. |
| `/app/admin/team` | `src/app/app/admin/team/page.tsx` | Team (users, invites, roles, audit tabs). **Role:** owner, admin, manager. |
| `/app/admin/users` | `src/app/app/admin/users/page.tsx` | Users. |
| `/app/admin/invites` | `src/app/app/admin/invites/page.tsx` | Invites. |
| `/app/admin/roles` | `src/app/app/admin/roles/page.tsx` | Roles. |
| `/app/admin/audit` | `src/app/app/admin/audit/page.tsx` | Audit log. |
| `/app/admin/employees` | `src/app/app/admin/employees/page.tsx` | Employees. **Role:** owner, admin, manager. |
| `/app/admin/employees/new` | `src/app/app/admin/employees/new/page.tsx` | New employee. |
| `/app/admin/employees/[id]` | `src/app/app/admin/employees/[id]/page.tsx` | Employee detail. |
| `/app/admin/employees/[id]/edit` | `src/app/app/admin/employees/[id]/edit/page.tsx` | Edit employee. |
| `/app/admin/compliance` | `src/app/app/admin/compliance/page.tsx` | Compliance. **Role:** owner, admin, manager. |
| `/app/admin/compliance/new` | `src/app/app/admin/compliance/new/page.tsx` | New compliance. |
| `/app/admin/compliance/[id]` | `src/app/app/admin/compliance/[id]/page.tsx` | Compliance detail. |
| `/app/admin/compliance/[id]/edit` | `src/app/app/admin/compliance/[id]/edit/page.tsx` | Edit compliance. |
| `/app/admin/sds` | `src/app/app/admin/sds/page.tsx` | SDS. **Role:** owner, admin, manager. |
| `/app/admin/sds/new` | `src/app/app/admin/sds/new/page.tsx` | New SDS. |
| `/app/admin/sds/[id]` | `src/app/app/admin/sds/[id]/page.tsx` | SDS detail. |
| `/app/admin/sds/[id]/edit` | `src/app/app/admin/sds/[id]/edit/page.tsx` | Edit SDS. |
| `/app/admin/purchase-orders` | `src/app/app/admin/purchase-orders/page.tsx` | POs. **Role:** owner, admin, manager. |
| `/app/admin/purchase-orders/new` | `src/app/app/admin/purchase-orders/new/page.tsx` | New PO. |
| `/app/admin/purchase-orders/[id]` | `src/app/app/admin/purchase-orders/[id]/page.tsx` | PO detail. |
| `/app/admin/purchase-orders/[id]/edit` | `src/app/app/admin/purchase-orders/[id]/edit/page.tsx` | Edit PO. |
| `/app/admin/invoices` | `src/app/app/admin/invoices/page.tsx` | Invoices. **Role:** owner, admin, manager. |
| `/app/admin/invoices/new` | `src/app/app/admin/invoices/new/page.tsx` | New invoice. |
| `/app/admin/invoices/[id]` | `src/app/app/admin/invoices/[id]/page.tsx` | Invoice detail. |
| `/app/admin/invoices/[id]/edit` | `src/app/app/admin/invoices/[id]/edit/page.tsx` | Edit invoice. |
| `/app/admin/phone` | `src/app/app/admin/phone/page.tsx` | Phone. |
| `/app/admin/ai-settings` | `src/app/app/admin/ai-settings/page.tsx` | AI settings. **Role:** owner, admin, manager. |
| `/app/admin/platform` | `src/app/app/admin/platform/page.tsx` | Platform (superadmin). |
| **Onboarding, Billing, Team, Settings** | | |
| `/app/onboarding` | `src/app/app/onboarding/page.tsx` | In-app onboarding (org_settings onboarding_status). |
| `/app/onboarding/success` | `src/app/app/onboarding/success/page.tsx` | Post–Stripe checkout: commit seats, set cookie, redirect dashboard. |
| `/onboarding/wizard` | `src/app/onboarding/wizard/page.tsx` | Seat onboarding wizard (no org → create org, seats, Stripe). |
| `/app/billing` | `src/app/app/billing/page.tsx` | Billing status, update payment method (Stripe portal). |
| `/app/team` | `src/app/app/team/page.tsx` | Seat distribution (change plan, tokens). **Role:** kodiak, super_kodiak, owner, admin. |
| `/app/settings` | `src/app/app/settings/page.tsx` | Org settings (branding, test data, team link, AI). **Gated:** `settings.branding`. |
| `/app/settings/team` | `src/app/app/settings/team/page.tsx` | Team (invites, members table). **Role:** owner, admin, manager. |
| `/app/settings/test-data` | `src/app/app/settings/test-data/page.tsx` | Test data. |
| `/app/settings/ai` | `src/app/app/settings/ai/page.tsx` | AI Control Center. **Role:** owner, admin, manager. |
| **Other** | | |
| `/app/kpis` | `src/app/app/kpis/page.tsx` | KPIs / Reports (tabs). |
| `/app/kpi` | `src/app/app/kpi/page.tsx` | KPI (singular). |
| `/app/reports` | `src/app/app/reports/page.tsx` | Reports. |
| `/app/reports/accounts` | `src/app/app/reports/accounts/page.tsx` | Reports accounts. |
| `/app/alerts` | `src/app/app/alerts/page.tsx` | Alerts. |
| `/app/financial-health` | `src/app/app/financial-health/page.tsx` | Financial health. Redirect franchisor → /franchisor/finance. |
| `/app/benchmarks` | `src/app/app/benchmarks/page.tsx` | Benchmarks. |
| `/app/helphub` | `src/app/app/helphub/page.tsx` | HelpHub QR. |
| `/app/helphub/setup` | `src/app/app/helphub/setup/page.tsx` | HelpHub setup. |
| `/app/walkthroughs` | `src/app/app/walkthroughs/page.tsx` | Walkthroughs. |
| `/app/walkthroughs/new` | `src/app/app/walkthroughs/new/page.tsx` | New walkthrough. |
| `/app/walkthroughs/[id]` | `src/app/app/walkthroughs/[id]/page.tsx` | Walkthrough detail. |
| `/app/proposals/build` | `src/app/app/proposals/build/page.tsx` | Proposals build. |
| `/app/templates` | `src/app/app/templates/page.tsx` | Templates. |
| `/app/templates/new` | `src/app/app/templates/new/page.tsx` | New template. |
| `/app/templates/[id]/edit` | `src/app/app/templates/[id]/edit/page.tsx` | Edit template. |
| `/app/bids` | `src/app/app/bids/page.tsx` | Bids. |
| `/app/bids/new` | `src/app/app/bids/new/page.tsx` | New bid. |
| `/app/bids/[id]` | `src/app/app/bids/[id]/page.tsx` | Bid detail. |
| `/app/tickets` | `src/app/app/tickets/page.tsx` | Tickets. |
| `/app/tickets/new` | `src/app/app/tickets/new/page.tsx` | New ticket. |
| `/app/tickets/[id]` | `src/app/app/tickets/[id]/page.tsx` | Ticket detail. |
| `/app/messages` | `src/app/app/messages/page.tsx` | Messages. |
| `/app/messages/[id]` | `src/app/app/messages/[id]/page.tsx` | Message detail. |
| `/app/draft-review` | `src/app/app/draft-review/page.tsx` | Draft review. |
| `/app/supplies` | `src/app/app/supplies/page.tsx` | Supplies hub. |
| `/app/supplies/...` | (vendors, products, customers, orders) | Supplies sub-routes. |
| `/app/pro-gear` | `src/app/app/pro-gear/page.tsx` | Pro Gear. |
| `/app/pro-gear/...` | (admin, cart, checkout, orders, etc.) | Pro Gear sub-routes. |
| `/app/university` | `src/app/app/university/page.tsx` | University/training. |
| `/app/university/...` | (admin, manage, library, courses, etc.) | University sub-routes. |
| `/app/franchise` | `src/app/app/franchise/page.tsx` | Franchise (franchisor). |
| `/app/franchise/...` | (listings, awards, etc.) | Franchise sub-routes. |
| `/app/forbidden` | `src/app/app/forbidden/page.tsx` | 403 stub. |
| `/app/entry` | `src/app/app/entry/page.tsx` | Entry. |
| `/app/join-org` | `src/app/app/join-org/page.tsx` | Join org. |
| `/app/accounts/join` | `src/app/app/accounts/join/page.tsx` | Account join (token). |

### A.2 Duplicates by functionality

| Functionality | Current routes | Note |
|---------------|----------------|------|
| **Main dashboard** | `/app/dashboard`, `/app/dashboard/franchisee`, `/app/dashboard/owner-operator` | Three entry points by org_type; same widget/data pattern for franchisee vs owner-operator. **Not** two “Ops Dashboard” variants—executive is separate. |
| **Sales dashboard** | `/app/sales-dashboard` | Single; redirect from `/app/dashboard` for sales_rep. |
| **Ops “landing”** | `/app/ops` | Stub only; real ops content is under ops/*, crews, sites, inspections, issues, tasks, qc-assign, contracts, map. |
| **Pipeline** | `/app/sales/pipeline` | Redirects to `/app/kpis?tab=pipeline`. Canonical: KPI reports with tab. |
| **Crews** | `/app/ops/crews` | Redirects to `/app/crews`. Canonical: `/app/crews`. |
| **QC** | `/app/ops/qc` | Redirects to `/app/qc-assign`. Canonical: `/app/qc-assign`. |
| **Issues/SLA** | `/app/ops/issues-sla` | Redirects to `/app/issues`. Canonical: `/app/issues`. |
| **Contracts** | `/app/ops/contracts` | Redirects to `/app/contracts`. Canonical: `/app/contracts`. |
| **Map** | `/app/ops/map` | Redirects to `/app/map`. Canonical: `/app/map`. |
| **Locations** | `/app/locations`, `/app/locations/new` | Redirect to `/app/accounts`, `/app/accounts/new`. Canonical: accounts. |
| **Launch packet** | `/app/sales/launch-packet`, `/app/sales/contract-launch/[id]` | Redirect to launch-packets. |
| **Team / seats** | `/app/team`, `/app/settings/team` | **Two pages:** `/app/team` = seat tokens & change plan (v2). `/app/settings/team` = invites + members table (legacy). Both needed; link from settings to team for seats in v2. |

### A.3 Dead / unused links

- Nav points to `/app/sales/pipeline` (redirects to kpis) — no dead link.
- Nav points to `/app/ops/crews`, `/app/ops/qc`, `/app/ops/issues-sla`, `/app/ops/contracts`, `/app/ops/map` — all redirect; no dead link.
- `/app/admin` links to `/app/admin/team`, employees, compliance, SDS, POs, invoices, phone, AI, audit — all exist.
- No evidence of links to removed or non-existent app routes; any “dead” links would be from legacy bookmarks (handled by redirects below).

### A.4 Where permissions are enforced

| Layer | Location | How |
|-------|----------|-----|
| **Middleware** | `src/lib/supabase/middleware.ts` | Session refresh, org resolution, public paths. **No** permission checks; layout/guards do. |
| **App layout** | `src/app/app/layout.tsx` | requireOrg(), billing lock (billing_status + locked_since), shell redirect (franchisor → franchise), onboarding_status → /app/onboarding. No per-route permission. |
| **Page-level guards** | Multiple `page.tsx` | **Role arrays:** `['owner','admin','manager']` on admin/*, settings/team, purchase-orders, invoices, compliance, SDS, ai-settings, audit, benchmarking. **requirePermission(orgId, userId, permission):** executive (`dashboard.exec`), sales (`dashboard.sales`), ops (`dashboard.ops`), settings (`settings.branding`). |
| **Server actions** | `src/actions/*.ts` | Benchmarking: ADMIN_ROLES. Audit: ADMIN_ROLES. Walkthroughs: requirePermission(DASHBOARD_SALES_VIEW). Launch-plan: LAUNCH_PLAN_WRITE/READ_ROLES. Pro-gear: owner/admin/manager. |
| **API routes** | `src/app/api/orgs/[orgId]/members/[memberId]/route.ts` | Owner-only for assigning owner. |
| **API auth** | `src/lib/api-auth.ts` | requireOrgMember(orgId), requireOrgPermission(orgId, permissionKey) using `has_permission` RPC. |
| **Client components** | Various | No permission checks; server decides what to render or redirect. Some “admin” UI (e.g. layout selector copy) is copy-only. |

### A.5 Current roles and permission keys

**Roles (org_members.role):**

- Legacy: `owner`, `admin`, `manager`, `inspector`, `client_viewer`, `sales_rep`, `sales`, `ops`, `cleaner`, plus `org.owner`, `org.admin`, and seat roles from 096: `cub`, `super_cub`, `grizzly`, `super_grizzly`, `kodiak`, `super_kodiak`.

**Permission keys (DB `role_permissions` + app usage):**

- **lib/auth/permissions.ts (used by requirePermission in auth):**  
  `org.read`, `org.update`, `org.members.*`, `billing.*`, `walkthrough.*`, `proposal.*`, `contract.*`, `inspection.*`, `task.*`, `issue.*`, `dashboard.sales`, `dashboard.ops`, `dashboard.exec`, `settings.branding`, `settings.integrations`, `settings.ai`.
- **lib/auth/roleMap.ts:** Maps org.owner, org.admin, sales.manager, sales.rep, ops.manager, ops.crew_lead, ops.crew, client.viewer to permission arrays.
- **lib/permissions.ts (older/different):** PERMISSIONS like `org.manage_users`, `dashboard.management.view`, `dashboard.ops.view`, `dashboard.sales.view` (used in authz.ts can/requirePermission with PermissionKey from this file). **Note:** Two permission systems exist; 090 seeds `dashboard.ops.view` etc.; 094 seeds `dashboard.sales`, `dashboard.ops` for org.owner/org.admin.

**RLS:** Policies use `is_org_member(org_id)`, `has_org_role(org_id, ['owner','admin'])`; seat tables use kodiak/super_kodiak (and owner/admin) for manage.

---

## B) TARGET IA (Information Architecture)

Canonical pages and permission keys for the new model (v2). Leadership scope: super_cub = crew only; super_grizzly = sales only; super_kodiak = ops + org (billing, seats, security, audit); cross-domain only with explicit permission keys.

| Domain | Canonical route | Required permission key(s) | Roles that typically have it |
|--------|------------------|----------------------------|------------------------------|
| **Crew** | | | |
| My Tasks | `/app/tasks` | `task.read.assigned`, `task.complete` | cub, super_cub, grizzly, super_grizzly, kodiak, super_kodiak |
| Team Tasks (crew lead) | `/app/ops/tasks` or same with filter | `task.read.all`, `task.assign` | super_cub, kodiak, super_kodiak |
| Inspections (crew) | `/app/inspections` | `inspection.read`, `inspection.complete` | cub, super_cub, kodiak, super_kodiak |
| Issues | `/app/issues` | `issue.read`, `issue.create` | cub, super_cub, kodiak, super_kodiak |
| Crew Performance | `/app/crews` (or reports) | `task.read.all` or `reports.crew` | super_cub, kodiak, super_kodiak |
| **Sales** | | | |
| My Deals | `/app/sales/leads`, `/app/sales/proposals`, pipeline tab | `dashboard.sales`, `walkthrough.read`, `proposal.read` | grizzly, super_grizzly, kodiak, super_kodiak |
| Team Pipeline | `/app/kpis?tab=pipeline` | `dashboard.sales`, `reports.view` or `sales.team_view` | super_grizzly, kodiak, super_kodiak |
| Walkthroughs | `/app/sales/walkthroughs`, `/app/walkthroughs` | `walkthrough.read` | grizzly, super_grizzly, kodiak, super_kodiak |
| Proposals | `/app/sales/proposals`, `/app/proposals/build` | `proposal.read`, `proposal.generate` | grizzly, super_grizzly, kodiak, super_kodiak |
| Templates | `/app/templates` | `template.read` (or sales) | super_grizzly, kodiak, super_kodiak |
| **Ops** | | | |
| Ops Dashboard | `/app/dashboard` (unified; content by permission) or `/app/executive` for exec | `dashboard.ops` or `dashboard.exec` | kodiak, super_kodiak |
| Missed Tasks | Executive panel + deep link `/app/ops/missed-tasks` or under executive | `dashboard.ops` or `missed_tasks.view` | kodiak, super_kodiak |
| SLA / Alerts | `/app/issues`, `/app/alerts` | `issue.read`, `issue.assign` | kodiak, super_kodiak |
| Inspections Overview | `/app/inspections`, `/app/ops/inspections` (one canonical) | `inspection.read` | super_cub, kodiak, super_kodiak |
| Buildings | `/app/sites` | `location.read` or org member | kodiak, super_kodiak |
| Crews | `/app/crews` | `crew.read`, `crew.manage` | super_cub, kodiak, super_kodiak |
| **Owner** | | | |
| Billing | `/app/billing` | `billing.read`, `billing.update` | super_kodiak (and legacy owner, admin) |
| Seats & Invites | `/app/team` | `org.members.invite`, `org.members.role.assign`, seats | super_kodiak |
| Security | `/app/admin/audit` + settings | `org.manage_settings`, audit | super_kodiak |
| Audit | `/app/admin/audit` | Audit permission | super_kodiak |
| Org Settings | `/app/settings` | `settings.branding`, `org.update` | super_kodiak, kodiak (limited) |

Single canonical route per feature: one Ops Dashboard (dashboard or executive by role), one Team/Seats page (`/app/team`), one Billing (`/app/billing`), one Inspections list (`/app/inspections`), one Issues (`/app/issues`), one Crews (`/app/crews`).

---

## C) MIGRATION MAPPING TABLE

Existing Route/Page → Canonical Route/Page (keep / merge / rename / delete-with-redirect).

| Existing route | Action | Canonical route | Notes |
|----------------|--------|-----------------|--------|
| `/app/dashboard` | **Keep** | `/app/dashboard` | Unified entry; content/redirect by shell + authz_version. v2: show by permission (exec vs ops vs sales). |
| `/app/dashboard/franchisee` | **Keep + redirect** | `/app/dashboard` | v2: if franchisee shell and no exec, same content as today. Add redirect: franchisee → dashboard with ?view=franchisee or resolve by shell in layout. |
| `/app/dashboard/owner-operator` | **Keep + redirect** | `/app/dashboard` | Same as above; canonical is `/app/dashboard`. |
| `/app/executive` | **Keep** | `/app/executive` | Canonical “Cockpit”. Gate: `dashboard.exec` (v1) or v2 equivalent. |
| `/app/sales-dashboard` | **Keep** | `/app/sales-dashboard` | Canonical sales command center. No duplicate. |
| `/app/ops` | **Keep** | `/app/ops` | Stub or repurpose as “Ops hub” with links to tasks, inspections, issues, crews. No new “Ops Dashboard v2” page. |
| `/app/sales/pipeline` | **Redirect** | `/app/kpis?tab=pipeline` | Already redirects. Keep. |
| `/app/ops/crews` | **Redirect** | `/app/crews` | Already redirects. Keep. |
| `/app/ops/qc` | **Redirect** | `/app/qc-assign` | Already redirects. Keep. |
| `/app/ops/issues-sla` | **Redirect** | `/app/issues` | Already redirects. Keep. |
| `/app/ops/contracts` | **Redirect** | `/app/contracts` | Already redirects. Keep. |
| `/app/ops/map` | **Redirect** | `/app/map` | Already redirects. Keep. |
| `/app/locations` | **Redirect** | `/app/accounts` | Already redirects. Keep. |
| `/app/locations/new` | **Redirect** | `/app/accounts/new` | Already redirects. Keep. |
| `/app/sales/launch-packet` | **Redirect** | `/app/sales/launch-packets` | Already redirects. Keep. |
| `/app/sales/contract-launch/[id]` | **Redirect** | `/app/sales/launch-packets/[id]` | Already redirects. Keep. |
| `/app/team` | **Keep** | `/app/team` | Canonical seat distribution (v2). No duplicate. |
| `/app/settings/team` | **Keep** | `/app/settings/team` | Legacy team (invites, members). v1 and v2: keep; link “Seats & plans” to `/app/team` when v2. |
| `/app/billing` | **Keep** | `/app/billing` | Canonical billing. No duplicate. |
| `/app/onboarding` | **Keep** | `/app/onboarding` | In-app onboarding. No duplicate. |
| `/app/onboarding/success` | **Keep** | `/app/onboarding/success` | Post-checkout. No duplicate. |
| `/onboarding/wizard` | **Keep** | `/onboarding/wizard` | Seat onboarding (no org). No duplicate. |
| **Admin** | **Keep** | Same | All admin routes stay. Gate by permission key in v2 (e.g. `org.manage_users`, `admin.audit`). Replace role array with requirePermission(orgId, key). |
| **Inspections** | **Merge** | `/app/inspections` | Single list: `/app/inspections`. `/app/ops/inspections` can redirect to `/app/inspections` or stay as alias (same component). Prefer one canonical. |
| **Tasks** | **Keep** | `/app/tasks`, `/app/ops/tasks` | My tasks vs team tasks: keep both routes; gate by task.read.assigned vs task.read.all. |

**Components to reuse (no new parallel dashboards):**

- Dashboard: `DashboardWithExecutiveToggle`, `CommandCenterSection`, `getCommandCenterData` — reuse on `/app/dashboard`; vary content by permission/shell.
- Franchisee/Owner-operator: same data (`getOperatorDashboardData`); render same components from `/app/dashboard` when shell is franchisee/owner_operator.
- Executive: keep `ExecutiveDashboard` on `/app/executive`.
- Sales: keep `SalesCommandCenter` on `/app/sales-dashboard`.
- Ops: keep stub or add links; do **not** add “/app/ops/dashboard” or “/app/ops-dashboard”.

**Redirect rules (exact):**

- `/app/dashboard/franchisee` → `/app/dashboard` (layout or page can set shell so content matches).
- `/app/dashboard/owner-operator` → `/app/dashboard`.
- All other redirects already in place (pipeline, ops/crews, qc, issues-sla, contracts, map, locations, launch-packet, contract-launch/[id]).
- Optional: `/app/ops/inspections` → `/app/inspections` if we make inspections canonical at `/app/inspections`.

---

## D) Next steps (implementation plan)

1. **Permissions registry** — `src/lib/authz/permissions.ts`: all v2 permission keys, domains, role→permissions for v2.
2. **Server guard** — `requirePermission(orgId, key)` (or extend existing) to respect `authz_version` and v2 role map.
3. **Route guard** — `withOrgAccess(page, key)` wrapper for page components.
4. **Nav** — single nav config keyed by permission; filter by permission keys (v2) or shell/role (v1).
5. **Redirects** — add any missing in `next.config.js` or middleware for renamed/merged routes.
6. **Link validation** — CI test: crawl nav links, expect 200 or redirect, no 404.
7. **Permission tests** — per-role snapshot of nav items and 403 on forbidden routes.
8. **DB** — add `organizations.authz_version` enum default `'v1'`; new orgs default `'v2'`; backfill org_members to closest seat role for v2; support both v1 and v2 in has_permission/role_permissions.
9. **Onboarding / seats** — v2 onboarding creates v2 roles and seat tokens; team and billing use canonical `/app/team` and `/app/billing`.

This document is the single source for the current-state map (A), target IA (B), and migration mapping (C). Implementation will follow in small commits as specified in your step-by-step execution.
