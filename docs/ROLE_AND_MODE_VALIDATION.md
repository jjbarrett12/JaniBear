# Role Gating, Toggle Persistence & Mode Switching — Validation

**Date:** 2025-02-20  
**Scope:** Role gating (owner/admin), toggle persistence, no broken routes when switching org or shell.

---

## 1. Role gating (only owner/admin)

| Area | Implementation | Status |
|------|----------------|--------|
| **Admin routes** (`/app/admin/*`) | Server check: `org_members.role` in `['owner', 'admin', 'manager']`; else `redirect('/app/dashboard')`. (Note: `org_members` has no `admin` today; effectively owner or manager.) | **PASS** — Non-admins cannot reach admin pages. |
| **Benchmarking settings (write)** | `updateBenchmarkSettings` (actions/benchmarking.ts): `ADMIN_ROLES = ['owner', 'admin', 'manager']`; returns error "Only org admins can update benchmarking settings" if role not in list. | **PASS** — Server rejects non-admin updates. |
| **Benchmarking settings (UI)** | Settings page: Benchmarking card only rendered when `canManageBenchmarking` (role in owner/admin/manager). Non-admins do not see the opt-in toggle. | **PASS** — UI gating added so only owner/manager see the card. |

**Summary:** Admin routes and benchmarking are gated to owner/manager (and future admin role). Server-side enforcement on all writes; UI hides benchmarking card for non-admins.

---

## 2. Toggle persistence

| Toggle | Load | Save | Status |
|--------|------|------|--------|
| **Benchmarking opt-in** | `getBenchmarkSettings(orgId)` on mount (BenchmarkingSettings); reads `organizations.benchmarking_opt_in`, `company_size_bucket`, `vertical`. | `updateBenchmarkSettings(orgId, payload)` on Save; updates `organizations`. | **PASS** — Persists to DB; reload shows saved state. |
| **Layout mode** (My / Recommended / Org Template) | `getActiveLayoutMode(supabase, userId, orgId, moduleKey)` in WidgetGrid; reads `user_ui_prefs.active_layout_mode`. | `setActiveLayoutMode(supabase, userId, orgId, moduleKey, mode)` on mode change and "Replace my layout"; upserts `user_ui_prefs`. | **PASS** — Persists per (user, org, module). |
| **Executive mode** (dashboard) | `getExecutiveMode` from `user_ui_prefs` (module_key = dashboard). | `setExecutiveMode` upserts `user_ui_prefs`. | **PASS** — Same pattern. |

**Summary:** All toggles load from DB and save via server actions or Supabase; persistence works across reloads.

---

## 3. No broken routes from switching modes

| Switch | Behavior | Status |
|--------|----------|--------|
| **Org switch** (Settings → Active organization) | POST `/api/org/switch` sets `active_org_id` cookie; `window.location.reload()`. Layout runs with new org; `requireOrg()` reads new cookie. If new org is franchisor and current path is e.g. `/app/dashboard`, layout redirects to `/app/franchise`. | **PASS** — Reload + layout redirects prevent stuck or broken routes. |
| **Shell** (franchisor vs operator) | Layout: when `shell === 'franchisor'` and path is `/app/*` but not `/app/franchise`, `/app/settings`, `/app/kpis`, `/app/benchmarks`, redirect to `/app/franchise`. ShellGuard (client): same allowlist; redirects franchisor from other `/app/*` to `/app/franchise`. | **PASS** — Server and client allowlist aligned; `/app/kpis` and `/app/benchmarks` added to ShellGuard so franchisor can stay on those routes. |
| **Franchisee / Owner-operator** | Dashboard pages redirect by `context.orgType` (e.g. franchisee → `/app/dashboard/franchisee`, independent → `/app/dashboard/owner-operator`). No shell-based redirect for these. | **PASS** — No broken routes. |

**Summary:** Org switch causes reload; layout and ShellGuard enforce shell-appropriate routes. Allowlist for franchisor: `/app/franchise`, `/app/settings`, `/app/kpis`, `/app/benchmarks`. All other `/app/*` redirect to `/app/franchise`.

---

## Changes made this run

- **Settings page:** Benchmarking card is only rendered when user role is owner, admin, or manager (`canManageBenchmarking`). Non-admins no longer see the benchmarking toggle.
- **ShellGuard:** Added `/app/kpis` and `/app/benchmarks` to the franchisor allowlist so client-side navigation does not redirect franchisors away from those paths (matches layout allowlist).
