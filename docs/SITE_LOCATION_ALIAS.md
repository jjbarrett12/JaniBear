# Site / Location UI Alias

**Canonical entity:** `public.locations` and `location_id` on related tables.

**UI language:** Customer-facing copy uses **"Site(s)"** (site survey, site walkthrough, site profile). The word "Location(s)" is reserved for internal/technical use where needed.

## Rules

- **Database writes** go only to `public.locations` and to FK columns named `location_id` (e.g. `walkthroughs.location_id`, `opportunities.location_id`). No new rows are created in `public.sites`.
- **Walkthrough creation** uses `walkthroughs.location_id` only (never `walkthroughs.site_id`).
- **Opportunity creation** uses `opportunities.location_id` only (never `opportunities.site_id`).
- **`public.sites`** is read-only legacy fallback: used only when loading existing data that has `site_id` set and no `location_id` (display only; no inserts/updates to `sites`).

## Route alias

- **`/app/sites`** → redirects to `/app/locations` (and thus to `/app/accounts` where that redirect applies).
- **`/app/sites/new`**, **`/app/sites/[id]`**, **`/app/sites/[id]/edit`** → redirect to the same path under `/app/locations` so resolution (facility vs account) stays in one place.

## Write-path verification (no writes to `public.sites`)

- **Checked:** No `supabase.from('sites').insert(...)` or `supabase.from('sites').update(...)` in the codebase.
- **Only use of `sites`:** `src/actions/crm.ts` reads from `sites` when an opportunity has only `site_id` set (legacy fallback for display). No other references write to `sites`.

## Type alias

- `Site` in `src/lib/types/database.ts` is an alias for `Database['public']['Tables']['locations']['Row']` for readability. All persistence still uses `locations` and `location_id`.
