# JaniBear — Build Agent Brief

**Purpose:** Single source of truth for your dedicated build agent. Update this as priorities change.

---

## What You're Building

- **Product:** JaniBear OS — multi-tenant SaaS for janitorial companies (sales, operations, QC, franchise compliance).
- **Positioning:** "Commercial janitorial software that runs like two managers — without the payroll." AI-powered bidding, proposals, inspections, and ops.
- **Scale goal:** Billion-dollar SaaS.
- **Legal constraint:** Joint-employer separation. Franchisors define standards and review outcomes only; operators control labor and execution. See `JANIBEAR_OS_SYSTEM.md` and `.cursor/rules/janibear-os-joint-employer.mdc`.

---

## Tech Stack

| Layer | Stack |
|-------|--------|
| Framework | Next.js 14 (App Router), TypeScript |
| UI | Tailwind, shadcn/ui, Lucide, Framer Motion |
| Data | Supabase (Postgres, Auth, Storage, RLS) |
| Payments | Stripe (checkout, webhooks); entitlements in DB |
| AI | OpenAI (stubs in `src/lib/ai/`); some routes use it |
| Email | Resend; Twilio available |

---

## App Structure (Protected `/app/*`)

- **Dashboard** — Role-aware: operator/franchisee/owner-operator; sales reps → Sales Dashboard.
- **Financial Health** — Cash, labor, profitability (operator).
- **KPI Dashboard** — Metrics; franchisor sees aggregated outcomes only.
- **University** — Training/library (premium).
- **Pro Gear** — Equipment/supplies e‑commerce.
- **Sales** — Command Center, leads, walkthroughs, bids, cadence, top targets.
- **Operations** — Map, accounts/facilities, crews, templates (brand standards), schedules, inspections, issues, tasks, supplies, contracts, HelpHub (QR), messages, QC assign, admin.

Franchisor users are redirected to `/franchisor` (separate layout); they never see labor/crew/PII.

---

## Data Model (Summary)

- **Multi-tenant:** `organizations` (org_type: `operator` | `franchisor`) → locations, crews, users.
- **RBAC:** `org_members.role` (owner, admin, sales, ops, inspector, cleaner, client); permissions in `src/lib/permissions.ts`.
- **Plans/entitlements:** `tenant_entitlements`, `tenant_addons`, `org_subscriptions`; billing-ready (045); Stripe can drive subscriptions later.
- **RLS:** Org-scoped; `is_franchisor_org()` / `org_can_see_labor_data()` gate labor data and features.

---

## Deferred (Until MacBook)

- **LiDAR / native scan:** Building capture and surface detection. Spec in `LIDAR_SURFACE_UX.md` and `LIDAR_AND_SURFACE_STRATEGY.md`. Migration `RUN_MANUAL_FOR_LIDAR.sql` when ready. Until then: non-LiDAR walkthroughs and manual entry remain.

---

## Built vs To Harden / Expand

| Area | Status | Notes |
|------|--------|--------|
| Auth & onboarding | Done | Email/password, magic link, reset, org onboarding |
| Landing, pricing, survey, demo | Done | |
| Stripe checkout & webhooks | Done | Success/cancel; entitlements in DB |
| Operator dashboard | Done | Stats, activity, schedule, chart; role redirects |
| Franchisor experience | Done | Separate layout; outcome-only visibility |
| Sales (Command Center, leads, bids, cadence) | Done | |
| Walkthroughs | Done | Non-LiDAR; LiDAR native when MacBook ready |
| Inspections, issues, schedules, crews | Done | |
| Accounts/facilities, contracts | Done | |
| Pro Gear, University, Supplies | Done | |
| In-app messaging | Done | |
| Demo form | TODO | "POST to API or Supabase when backend ready" in code |
| AI SDS analyze | Placeholder | pdf-parse mentioned, not implemented |
| Email/SMS notifications | Optional | Infra present; flows to expand |
| Tests | Optional | E2E/unit per NEXT_STEPS |
| Billing UI | Partial | Entitlements in DB; no full billing portal yet |

---

## Where the Agent Can Help Next

1. **Demo/lead capture** — Wire demo form to Supabase or API so leads are stored and actionable.
2. **Billing/entitlements UI** — Plans, add-ons, usage, upgrade paths using existing `tenant_entitlements` / `org_subscriptions`.
3. **AI & automation** — Flesh out AI routes (e.g. SDS analyze, scope extraction, proposals) beyond stubs.
4. **Notifications** — Email/SMS flows for key events (e.g. proposal signed, inspection due).
5. **Franchisor polish** — Copy, UX, and feature gating so all franchisor touchpoints stay "recommended/optional/outcome review" only.
6. **Performance & DX** — Loading states, error boundaries, logging, and any tests you want added.
7. **New modules or flows** — Scoped to operator vs franchisor and RLS.

---

## Key Paths

- **Landing:** `src/app/page.tsx`
- **App layout:** `src/app/app/layout.tsx`
- **Sidebar nav:** `src/components/app/app-sidebar-nav.tsx`
- **Auth:** `src/lib/auth.ts`, `src/lib/supabase/server.ts`, middleware
- **Permissions:** `src/lib/permissions.ts`
- **User/org context:** `src/lib/user-context.ts`
- **Migrations:** `supabase/migrations/*.sql` (run in order)

---

*Last updated: March 2025. LiDAR native capability deferred until MacBook available.*
