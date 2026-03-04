# Platform Owner Console

SaaS operator dashboard at **/platform/** (Stripe/HubSpot-level clarity). Not the customer admin UI.

## Access

- **Guard:** `profiles.is_platform_admin === true`. Otherwise redirect to `/platform/forbidden` (403).
- **Layout:** Route group `(console)` wraps all console routes with `PlatformShell` (left nav + top bar). `/platform/forbidden` has no shell.

## Information architecture

**Left nav (Platform):**
- Overview
- Orgs
- Users
- AI Control Center
- Pro Gear Shop
- System Health
- Audit Log

**Top bar:**
- Global search (org/user) — placeholder
- Impersonation banner when active + Exit (clears cookie, redirects to /platform/overview)
- Notifications — placeholder
- Link to App

## Pages and components

| Route | Purpose |
|-------|--------|
| `/platform` | Redirects to `/platform/overview` |
| `/platform/overview` | KPI row (Total/Active Orgs, Trials, Total Users, WAU, MAU), Top 10 Orgs table, Health panel |
| `/platform/orgs` | Orgs table with filters; Create Org CTA |
| `/platform/orgs/new` | Create org form (name, owner email, plan, trial); success → View org / Back to list |
| `/platform/orgs/[orgId]` | Org header + status pill + tabs (Overview, Users, AI Settings, Pro Gear, Activity); Impersonate, Resend invite, Disable |
| `/platform/users` | Global user search + memberships (placeholder) |
| `/platform/ai` | Global defaults, per-org overrides, usage (placeholder) |
| `/platform/pro-gear` | Import CSV wizard, Product list (placeholder) |
| `/platform/system-health` | Errors, job failures, latency (placeholder) |
| `/platform/audit-log` | Audit table (placeholder) |
| `/platform/forbidden` | 403 — owner-only guard UI |

## Layout and spacing

- **Shell:** 8px grid; section padding 24–32px; card padding 24px; `rounded-2xl` cards; `border border-border`; subtle shadow.
- **Left nav:** 224px (`w-56`); active state `bg-primary/10 text-primary`.
- **Main content:** `p-6 lg:p-8`, `max-w-[1600px] mx-auto`.

## Status pill system

`StatusPill` in `@/components/platform/status-pill.tsx`:

| Status | Label | Style |
|--------|--------|--------|
| `trial` | Trial | amber |
| `active` | Active | emerald |
| `past_due` | Past due | red |
| `canceled` | Canceled | zinc |
| `suspended` | Suspended | red |

## Loading strategy

- Use `LoadingSkeleton` / `KpiRowSkeleton` from `@/components/enterprise` for section load.
- Tables can show a skeleton row set or “Loading…” until data is ready.

## Components

- **PlatformShell** — Left nav + top bar + optional impersonation banner; wraps main content.
- **StatusPill** — Org status (trial/active/past_due/canceled/suspended).
- **ImpersonationBanner** — Shown when `impersonate_org_id` cookie is set; Exit runs `clearImpersonation`.
- **PlatformCreateOrgForm** — Create org (uses `createOrg` server action); success state with “View org” / “Back to list”.
- **ImpersonateButton** — Sets impersonation cookie and redirects to `/app/dashboard`.

## 403 (owner-only) guard

- `requirePlatformAdmin()` in `@/lib/platform-guard` redirects to `/auth/login` or `/platform/forbidden`.
- `/platform/forbidden` renders a standalone page (no shell): “Access restricted” + links to app and sign in.
