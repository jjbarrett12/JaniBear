# Multi-Org / Modules / Tiers – Implementation Summary

This doc tracks what was implemented from the Cursor spec (multi-org, modules, tiers, LiDAR, QuickBooks).

## Done

### 1. Schema (migration 019)

- **Org type**: Extended `organizations.org_type` to `franchisor` | `franchisee` | `independent` (migrated `operator` → `independent`). No new `orgs` table; extended existing `organizations`.
- **Membership roles**: New enum `membership_role` (fr_* and op_*). Extended `org_members` with `role_enum`, `capabilities` jsonb. Trigger enforces fr_* only for franchisor orgs, op_* only for franchisee/independent.
- **Franchise associations**: New table `franchise_associations` (franchisor ↔ franchisee, optional). Trigger enforces org types; unique active association per franchisee.
- **Org profiles**: New table `org_profiles` (logo_path, brand_colors). Existing `organizations` keeps logo_url etc.
- **Profiles**: Extended `profiles` with display_name, photo_path, title (no separate `user_profiles` table).
- **Compliance**: New table `compliance_documents` (insurance, workers_comp, w9, sds, etc.). New `org_sharing_settings` for operator→franchisor sharing.
- **Plans & subscriptions**: New tables `plans`, `org_subscriptions`, `org_addons`. Seed rows for tier 1/2/3 per org type. Helper `org_has_module(org_id, module_key)`.
- **Orders**: New tables `orders`, `order_items` (supplies). Extended `products` with `global`. Existing `purchase_orders` / `purchase_order_items` kept.
- **Walkthrough scans**: New table `walkthrough_scans` (LiDAR/RoomPlan uploads; links to existing `walkthroughs`).
- **Integrations**: New tables `integrations`, `integration_tokens` (QuickBooks OAuth scaffolding).
- **RLS**: Enabled on all new tables; policies restrict by org membership.

### 2. Next.js

- **User context**: `getUserContext()` in `src/lib/user-context.ts` returns userId, activeOrgId (from cookie), orgType, role, roleEnum, capabilities, planCode, modules. Helpers: `hasModule()`, `hasCap()`, `isFranchisor()`, `isOperator()`.
- **Active org cookie**: `active_org_id` httpOnly cookie. `POST /api/org/switch` sets it (body: `{ org_id }`).
- **Route groups**:
  - `/franchisor` – layout requires org type franchisor; stub dashboard + sales, brand-ops, franchisees, finance.
  - `/operator` – layout requires org type franchisee or independent; stub dashboard + sales, ops, finance, compliance, supplies.
- **QuickBooks API scaffold**: `GET /api/integrations/quickbooks/connect` (entitlement + capability gated), `GET /api/integrations/quickbooks/callback`, `GET /api/integrations/quickbooks/status`, `POST /api/integrations/quickbooks/sync/invoices` (stub). No real OAuth yet (TODOs in code).

### 3. Existing app

- `/app/*` (current dashboard, sales, walkthroughs, etc.) is unchanged. It still uses `requireOrg()` and first membership. To use active-org cookie and org-type routing, either redirect from `/app` to `/operator` or `/franchisor` by org type, or gradually move pages under the new route trees.

## Not done (spec items)

- **iOS LiDAR app**: SwiftUI + RoomPlan app under `apps/ios-scan/` that logs in, fetches walkthroughs, captures scan, uploads to Storage and writes `walkthrough_scans`. Not started.
- **QuickBooks OAuth**: Real client_id, redirect_uri, token exchange, and storing tokens in `integration_tokens`. Only scaffolding and status/connect/callback/sync stubs exist.
- **Billing UI**: Settings → Billing → choose tier by org type, show enabled modules. Tables exist; UI not built.
- **Org onboarding**: Flow to choose org type (franchisor / franchisee / independent) and plan selection. Onboarding page exists but not updated for org type.
- **Association invite/accept**: UI for franchisor to invite franchisee (invite_code) and franchisee to accept. Table and RLS exist.
- **Default dashboards by role**: Sales → Sales dashboard, Ops → Ops dashboard, etc. Stub dashboards exist; role-based redirect not wired.

## Conventions

- No duplicate tables/enums: existing `organizations`, `org_members`, `profiles`, `locations`/`sites`, `walkthroughs`, `products`, `purchase_orders` were extended or left as-is; new tables only where no equivalent existed.
- Joint-employer rule: franchisors do not control labor; operators (franchisee + independent) do. RLS and helpers (`org_can_see_labor_data`, `is_franchisor_org`) already support this; new code should keep that separation.
