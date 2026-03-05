# Route Inventory and Canonical Dashboard Plan

## Step 1: ROUTE INVENTORY

### URL → Source file paths

| URL pattern | Source path(s) | Collision? |
|-------------|----------------|------------|
| `/` | `src/app/(marketing)/page.tsx` | No |
| `/pricing` | `src/app/(marketing)/pricing/page.tsx` | No |
| `/demo` | `src/app/(marketing)/demo/page.tsx` | No |
| `/contact` | `src/app/(marketing)/contact/page.tsx` | No |
| `/about` | `src/app/(marketing)/about/page.tsx` | No |
| `/privacy` | `src/app/(marketing)/privacy/page.tsx` | No |
| `/terms` | `src/app/(marketing)/terms/page.tsx` | No |
| `/survey` | `src/app/(marketing)/survey/page.tsx` | No |
| `/why-janibear` | `src/app/(marketing)/why-janibear/page.tsx` | No |
| **`/app/*`** | **`src/app/(app)/app/**/*` only** | **No duplicate** |

### Finding

- **`src/app/app/**`** (canonical desired location): **does not exist** (0 files).
- **`src/app/(app)/app/**`**: **only** tree that serves `/app/*` (199+ page.tsx + layouts + supporting files).
- **No two file paths resolve to the same URL.** The only “duplicate” is that the dashboard lives under a route group `(app)` instead of at the canonical path `src/app/app/`.

---

## Step 2: KEEP/DELETE PLAN

| Action | Path | Reason |
|--------|------|--------|
| **MOVE** | `src/app/(app)/app/*` → `src/app/app/*` | Establish canonical dashboard at `src/app/app/`. |
| **DELETE** | `src/app/(app)/app/` (after move) | Remove shadow tree. |
| **DELETE** | `src/app/(app)/` (after app removed) | Remove empty route group. |
| **KEEP** | `src/app/(marketing)/*` | Marketing routes; no change. |
| **KEEP** | `src/app/layout.tsx` | Root layout; no change. |

No **merge** required: there is no second implementation; we are only relocating the single dashboard tree.

**Redirects:** None. URLs stay `/app/*`; only the file system location changes.

---

## Step 3: NAV + LINK AUDIT

- **Nav config:** `src/lib/nav/navFactory.ts` and `src/lib/nav/shellNav.ts` use **canonical `/app/...`** hrefs. No file paths; no change needed.
- **Sidebar / bottom nav:** Use `AppLink` and hrefs like `/app/dashboard`, `/app/helphub`, etc. No change after move.
- **Route builders:** `src/lib/routes.ts` already uses `/app/...`; no change.

No `<a href>`, `window.location`, or missing `/app` fixes required for this move.

---

## Step 4: LAYOUT SANITY CHECK

| Layout | Location | Contains |
|--------|----------|----------|
| Root | `src/app/layout.tsx` | Providers, Toaster, PWA; **no** marketing footer. |
| Marketing | `src/app/(marketing)/layout.tsx` | **Footer** (marketing CTA). |
| Dashboard shell | `src/app/(app)/app/layout.tsx` today → **`src/app/app/layout.tsx`** after move | Sidebar, AppMainWithHeader, BottomNav, ThemeProvider. |

After move:

- **Only** `src/app/(marketing)/layout.tsx` contains the marketing footer.
- **Only** `src/app/app/layout.tsx` contains the dashboard shell.
- **No** `src/app/(app)/` remains, so no duplicate route group for `/app`.

---

## Step 5: FILES TO MOVE (exact list)

All files under `src/app/(app)/app/` move to `src/app/app/` preserving structure. Example (full list from discovery):

- `layout.tsx` → `src/app/app/layout.tsx`
- `dashboard/page.tsx`, `dashboard/error.tsx`, `dashboard/loading.tsx`, … → `src/app/app/dashboard/...`
- `admin/`, `alerts/`, `benchmarks/`, `billing/`, `contracts/`, `crews/`, `crm/`, `executive/`, `franchise/`, `helphub/`, `inspections/`, `issues/`, `kpis/`, `messages/`, `onboarding/`, `ops/`, `pro-gear/`, `sales/`, `schedules/`, `settings/`, `sites/`, `supplies/`, `university/`, … (all subdirs) → `src/app/app/<segment>/...`

**Files deleted (completed):** entire directory tree `src/app/(app)/` (removed after moving its contents to `src/app/app/`).

**Exact files merged:** None (single tree; only move was performed).

---

## Implementation status

- [x] **Commit A:** Route inventory + plan documented (this file); nav already used canonical `/app/*` hrefs.
- [x] **Move:** All files from `src/app/(app)/app/` copied to `src/app/app/`; canonical dashboard at `src/app/app/*`.
- [x] **Delete:** `src/app/(app)/` removed.
- [x] **Tests:** `e2e/route-crawl.e2e.ts` added (no 404 for nav links); `e2e/dashboard-no-marketing-flash.e2e.ts` already covers click-nav and no marketing footer.

---

## Confirmation commands (after changes)

```bash
# Dev: ensure app and marketing routes load
npm run dev
# Visit /app/dashboard, /app/helphub, /, /pricing

# Build: no 404s for app routes
npm run build

# Route audit (if script exists)
npm run audit:sidebar-routes

# E2E: route crawl (no 404 for sidebar routes)
npx playwright test e2e/route-crawl.e2e.ts

# E2E: nav and no marketing flash (requires credentials)
E2E_LOGIN_EMAIL=... E2E_LOGIN_PASSWORD=... npx playwright test e2e/dashboard-no-marketing-flash.e2e.ts
```
