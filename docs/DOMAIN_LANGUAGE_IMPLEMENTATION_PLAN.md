# JANIBEAR — Domain Language Implementation Plan

**Goal:** Simplify customer and operations language so the platform consistently uses business terms that match janitorial reality.

**Target lifecycle:** Lead → Walkthrough → Proposal → Active Account → Attrition → Past Accounts  
**Target rule:** "Account" = primary customer object; "Service Address" = physical address; Area/Zone/Floor/Space = subdivisions; avoid "site" and "location" in UX unless unavoidable.

---

## 1. Canonical Model

### 1.1 Lifecycle and Objects

| Term | Definition | DB / Notes |
|------|------------|------------|
| **Lead** | Prospect not yet an opportunity | `leads` |
| **Walkthrough** | Site visit / capture for scoping | `walkthroughs`; may link to opportunity or lead |
| **Proposal** | Quote sent to lead/opportunity | `proposals`, `bids` |
| **New account** | Customer record created (pre- or post-win) | `accounts` (status active/inactive/cancelled as needed) |
| **account_status lifecycle** | active → (cancelled | attrition) → past | `accounts.status`; extend with `cancelled`, `attrition`, `past` if not present |
| **Active Account** | Account currently in service | status = active |
| **Attrition** | Account lost / churned | status or lifecycle state |
| **Past Accounts** | No longer active (cancelled, attrition, or ended) | status in (cancelled, inactive, …) |
| **Service Address** | Physical place where service is performed | `facilities` table; one per account or many per account |
| **Area / Zone / Floor / Space** | Optional subdivision for mapping, LiDAR, inspections | `location_areas`, `spaces`, or equivalent |

### 1.2 Naming Rules

- **UI:** Prefer "Account" and "Service address"; use "Area", "Zone", "Floor", or "Space" for subdivisions.
- **Avoid in UX:** "Site", "location" (except internal/technical).
- **Sidebar:** No "Sites" item; use "Accounts" (and "Accounts (Active)" where that distinction exists).

---

## 2. Audit: Current Code Usage

### 2.1 Tables

| Table | Relevance | Notes |
|-------|------------|--------|
| `accounts` | Canonical customer | Keep name. |
| `facilities` | Service addresses | Keep name; UI label "Service address". |
| `locations` | Legacy (some DBs) | May still exist; prefer `facilities` in new code. |
| `leads`, `opportunities`, `walkthroughs`, `proposals`, `bids` | Lifecycle | Keep. |

### 2.2 Types

- `src/lib/types/database.ts` — may alias `Site` to locations row; add canonical aliases (Account, ServiceAddress) without breaking existing types.
- New: `src/types/canonical-domain.ts` (Phase 2) — Lead, Walkthrough, Proposal, Account, AccountStatus, ServiceAddress, Area/Zone/Floor/Space.

### 2.3 Services / API Routes

- APIs use `account_id`, `facility_id`, `location_id` in paths/params; no user-facing strings. Phase 1: labels only; Phase 3: optional path renames later.

### 2.4 Server Actions

- `actions/accounts.ts`, `actions/sites.ts` — internal; revalidatePath uses `/app/sites` and `/app/accounts`. Keep paths for now; change only user-visible strings in UI.

### 2.5 UI Labels (audited)

| Location | Current | Target |
|----------|---------|--------|
| app-translations: location | Site | Service address |
| app-translations: navLocations | Sites | Service addresses (or remove from nav) |
| app-translations: quickAddLocation | Add Site | Add service address |
| app-translations: quickAddLocationDesc | New service site | New service address |
| app-translations: noServicesScheduledSub | Add sites and create schedules | Add accounts and service addresses, then create schedules |
| app-translations: navCrmAndLocations | CRM & locations | CRM & accounts |
| app-translations: navSiteHandover | Site handover (keys, closets) | Service handover (keys, closets) |
| app-translations: quickNewWalkthroughDesc | Start a site assessment | Start a walkthrough |
| app-translations: statsActiveLocations | Active Accounts | (already correct) |
| navFactory: Operations item | href /app/sites, labelKey navLocations | Remove item; rely on "Accounts (Active)" |
| sites/page.tsx: h1 | Sites | Service addresses |
| sites/page.tsx: subtitle | Locations (sites) linked to… | Service addresses linked to accounts and ops |
| sites/page.tsx: button | New Site | New service address |
| sites/page.tsx: table header | Site | Service address |
| sites/page.tsx: empty | No sites found | No service addresses found |
| dashboard-copy.ts | Sites and coverage | Service addresses and coverage |

### 2.6 Nav Items

- **Operations:** Remove "Sites" (navLocations) item; keep "Accounts (Active)" → /app/accounts. Optional later: add "Service addresses" under Accounts or as sub-view.

### 2.7 Filters, Dashboards, Reporting, Mapping

- Filters that say "Site" or "Location" → change to "Service address" or "Account" in labels (component copy).
- Dashboard copy in `dashboard-copy.ts` — one occurrence updated in Phase 1.
- Mapping: EntityDrawer, SiteDrawer, MapFilters may use "site"; Phase 1 can add translation keys or literal "Service address" where visible.

---

## 3. Safe Migration Strategy

| Change type | Approach |
|-------------|----------|
| **Labels only** | Change in app-translations and inline copy; no routes or DB. |
| **Type names** | Add canonical interfaces in `canonical-domain.ts`; keep existing types; use adapters where needed. |
| **DB columns/tables** | No renames in this refactor; use compatibility shims (e.g. type alias or adapter from location_id to service_address_id in types only) if needed later. |
| **Route names** | Keep `/app/sites`, `/app/locations`; change only UI labels and nav. Redirects can be Phase 3. |
| **Breaking changes** | Avoid changing API contracts, route paths, or DB schema in Phase 1–2. |

---

## 4. Phase 1 — User-Facing Language (Implemented)

- Replace user-facing "site" and "location" with "Account" or "Service address".
- Sidebar: remove "Sites" from Operations; keep "Accounts (Active)".
- Page titles, labels, empty states, table columns, buttons: use canonical terms.
- Preserve functionality and routes.

**Files edited:**
- `src/lib/nav/navFactory.ts` — Remove Sites nav item from Operations.
- `src/lib/app-translations.ts` — location, navLocations, quickAddLocation, quickAddLocationDesc, noServicesScheduledSub, navCrmAndLocations, navSiteHandover, quickNewWalkthroughDesc (EN + ES).
- `src/app/app/sites/page.tsx` — Title, subtitle, button, table header, empty state.
- `src/app/app/sites/new/page.tsx` — Title "New service address", description.
- `src/components/crm/site-create-form.tsx` — Card title, description, label "Service address name", placeholder, button "Create service address", error message, default name "Unnamed service address".
- `src/components/crm/sites-search-filter.tsx` — Placeholder "Service address name, address, city...".
- `src/lib/dashboard-copy.ts` — "Sites and coverage" → "Service addresses and coverage".

---

## 5. Phase 2 — Canonical Types and Adapters (Implemented)

- Introduce `src/types/canonical-domain.ts`: Lead, Walkthrough, Proposal, Account, AccountStatus, ServiceAddress, ServiceAddressSubdivision (Area | Zone | Floor | Space).
- Add compatibility: type aliases or helpers that map legacy `location`/`site` to ServiceAddress where components still use old types.
- No backend or route renames.

**Files created/edited:**
- `src/types/canonical-domain.ts` — New canonical interfaces and status enum.
- Optional: small adapter in `src/lib/canonical-adapter.ts` (location/facility row → ServiceAddress) for use in components that will be migrated later.

---

## 6. Phase 3 — Deeper Cleanup (Later)

- Consider redirects: /app/sites → /app/accounts (or dedicated service-addresses view).
- Internal links: update from /app/sites/* to /app/accounts/…/facilities/… where appropriate.
- Component renames: SiteDrawer → ServiceAddressDrawer (or keep name, change only displayed labels).
- Schema: only if product requires (e.g. account_status values for attrition, past).

---

## 7. Exact Files to Edit (Summary)

| File | Changes |
|------|--------|
| `src/lib/nav/navFactory.ts` | Remove Operations item with href /app/sites and labelKey navLocations. |
| `src/lib/app-translations.ts` | EN: location, navLocations, quickAddLocation, quickAddLocationDesc, noServicesScheduledSub, navCrmAndLocations, navSiteHandover, quickNewWalkthroughDesc. ES: same keys. |
| `src/app/app/sites/page.tsx` | h1 "Service addresses"; subtitle; button "New service address"; TableHead "Service address"; empty "No service addresses found." |
| `src/app/app/sites/new/page.tsx` | Title "New service address"; description. |
| `src/components/crm/site-create-form.tsx` | Card title, description, label "Service address name", placeholder, button, error, default name. |
| `src/components/crm/sites-search-filter.tsx` | Placeholder "Service address name, address, city...". |
| `src/lib/dashboard-copy.ts` | description: "Service addresses and coverage…" |
| `src/types/canonical-domain.ts` | New file: AccountStatus, ServiceAddress, etc. |
| `src/lib/canonical-adapter.ts` | New (optional): facility/location row → ServiceAddress. |

---

## 8. Migration Notes

- **Nav:** Users will no longer see "Sites" in the sidebar; they use "Accounts (Active)" to reach the accounts list. The /app/sites route remains for direct access and is relabeled "Service addresses."
- **Translations:** Existing keys kept; only string values updated. No key renames to avoid breaking `AppTranslationKey` or t() calls.
- **Spanish:** All EN changes mirrored in esOverrides where those keys exist.

---

## 9. QA Checklist

- [ ] Sidebar: Operations section has no "Sites"; "Accounts (Active)" links to /app/accounts.
- [ ] /app/accounts: Title "Accounts", "New Account", empty state "No accounts yet" (unchanged).
- [ ] /app/sites: Title "Service addresses", button "New service address", table header "Service address", empty "No service addresses found."
- [ ] Dashboard quick actions: "Add Site" → "Add service address"; "Start a site assessment" → "Start a walkthrough."
- [ ] Schedule/QC screens: "Site" column or label → "Service address" where key `location` is used.
- [ ] No console or TypeScript errors from removed nav item (no dangling labelKey).
- [ ] Spanish: Same keys show updated ES strings.

---

## 10. Rollback Considerations

- **Nav:** Re-add one Operations item: `{ href: '/app/sites', labelKey: 'navLocations', icon: MapPin }` and set navLocations back to "Sites" in app-translations.
- **Translations:** Revert app-translations.ts EN and ES string values from git.
- **Sites page:** Revert title, subtitle, button, table header, empty state strings.
- **Dashboard copy:** Revert one line in dashboard-copy.ts.
- **Phase 2 types:** Remove or keep canonical-domain.ts and adapter; they are additive and do not break existing code.
