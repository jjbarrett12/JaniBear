# JANIBEAR Design Restoration Brief

**Purpose:** Restore and unify product UI so the authenticated app feels like a premium, operator-first SaaS—not a marketing site or generic admin template. Use this brief when bringing up the product on a new machine or doing a design pass.

**Last updated:** From codebase analysis (dashboard, nav, Grizzly, Kodiak, Launch, Crews, Inspections, KPIs, Settings, Financials, onboarding).

---

## 1. Current State Audit

### 1.1 Dashboard Structure

| Layer | Location | Notes |
|-------|----------|--------|
| **App shell** | `src/app/app/layout.tsx` | Sidebar (desktop) + `AppMainWithHeader` + BottomNav (mobile). Content area: `p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4`. |
| **Dashboard home** | `src/app/app/dashboard/page.tsx` | Uses `PageLayout` → `DashboardDataProvider` → `CockpitSection` → franchisee banner (conditional) → `DashboardWithExecutiveToggle` (widget grid or Executive view). |
| **Cockpit** | `src/app/app/dashboard/components/CockpitSection.tsx` | `DashboardShell` (max-w-[1600px], py-5/6, space-y-5/6) → Header, KpiStrip, AlertRail, 2/3 + 1/3 grid: CommandPanel (route map placeholder, route+inspections list, revenue) + SideRailPanel (attention, health watchlist, crew status). Uses **mock data** for panels (`getMockDashboardData`). |
| **Widget grid** | `DashboardWithExecutiveToggle` → `WidgetGrid` | Registry-driven; Executive mode shows `ExecutiveView` (simplified). |
| **Executive view** | `src/components/executive/ExecutiveDashboard.tsx` | Own full-page layout: `min-h-screen bg-[#070B12]`, fixed gradient background (blue/violet), custom header with greeting; in-page footer "Customize dashboard" / "Back to Command Center". **Feels like a separate app**—different background and no reuse of app shell hierarchy. |

**Findings:**
- Dashboard content width is consistent (1600px) but **CockpitSection** adds its own `DashboardShell` padding; the main content wrapper in `AppMainWithHeader` already has `p-4 md:p-6 lg:p-8`, so dashboard has **double wrappers** and slightly inconsistent spacing.
- **Executive view** breaks out of the app’s visual system (hardcoded `#070B12`, blue/violet gradient, white text). Should use semantic tokens and same shell.
- **Franchisee banner** is a full-width band above the widget grid; acceptable but should use semantic tokens (no raw muted if we want it to feel intentional).

### 1.2 Navigation Structure

| Item | Location | Notes |
|------|----------|--------|
| **Nav definition** | `src/lib/nav/navFactory.ts` | Single source: sections (Executive, Sales/Grizzly, Launch, Operations/Kodiak, System, Franchisor). Items: href, labelKey, icon, optional alertKey. |
| **Shell mapping** | `src/lib/nav/shellNav.ts` | `getNavSectionsForShell(shell, franchiseeEnrolled)` → shell = owner_operator \| franchisee \| franchisor. |
| **Desktop sidebar** | `src/components/app/app-sidebar.tsx` | Fixed left `w-56`, `border-r-2 border-primary bg-primary/15 dark:bg-primary/20`; logo box; GlobalSearch; AppSidebarNav; AppPromoSlot; AppSidebarFooter; **SystemFooter** (version, Status, Privacy, Terms). |
| **Mobile** | `MobileSidebar` + **BottomNav** in layout | Same sections from shell. |
| **Top bar** | `AppContextHeader` in `AppMainWithHeader` | Sticky `bg-primary text-primary-foreground`, org name, "Active", attention count, language, dark mode, notifications, user. Risk drawer for handoffs/issues/missed tasks. |

**Findings:**
- Nav is **role/shell-aware** and single-source—good. No marketing footer inside app; only **SystemFooter** in sidebar (minimal).
- **AppContextHeader** is full primary background; on small screens the secondary "X need attention" bar can feel heavy. Consider keeping one clear CTA.

### 1.3 Visual Inconsistencies

| Issue | Where | Recommendation |
|-------|--------|----------------|
| **Indigo/purple instead of amber** | Landing: `.landing-cta`, `.landing-cta-lg` (indigo→purple gradient). Landing network lines `rgba(99,102,241)`. `design-billion-dollar-saas.mdc` specifies **black + gold/amber**. | Replace landing CTAs and decorative accents with amber/gold (`#fbbf24` spectrum). |
| **Revenue/KPI accent = indigo** | `CockpitSection.tsx`: month pacing `text-indigo-600 dark:text-indigo-400`. `KpiTile.tsx`: variant `revenue` uses `indigo-500/20`, `border-l-indigo-500`, etc. | Use primary (or amber) for revenue so it matches brand and theming. |
| **Hardcoded grays** | Inspections list: `text-gray-400`, `text-gray-600`, `text-gray-500`, `hover:bg-gray-50`, `bg-yellow-100`. Settings: `text-gray-600 dark:text-gray-400`. Many admin/forms: `text-gray-*`, `bg-gray-50`, `dark:bg-gray-800`. | Replace with semantic tokens: `text-muted-foreground`, `bg-muted`, `bg-card`, `border-border`. Use `destructive`/`amber` for status badges instead of `yellow-100`. |
| **Card and surface tokens** | Mix of `Card` (shadcn), `.elevated-card` (globals.css), `.kpi-card-elevated` (dark only, `#151A22`), and ad-hoc `bg-card/80`, `dark:bg-gray-800`. | Standardize: primary surface = `bg-card` + `border-border`; elevated = one defined class (e.g. `.elevated-card` or a shared component) with left accent optional. |
| **Executive view** | `ExecutiveDashboard.tsx`: `bg-[#070B12]`, `bg-gradient-to-br from-blue-950/10 ... to-violet-950/10`, white text. | Use `bg-background`, semantic foreground/muted, and optional subtle gradient via CSS variables so dark mode and branding stay consistent. |
| **Primary default** | `:root` has `--primary: 221 91% 60%` (blue). ThemeApplier overrides from Settings/Branding. | Design rule says amber/gold for brand; consider making default primary amber for new orgs, or document that branding override is the main path. |

### 1.4 Product Pages That Feel Like Webpages

| Page | Why | Fix |
|------|-----|-----|
| **Executive view** | Full-page custom background, greeting headline, "Customize layout" / "View reports" in-page footer. | Reframe as a dashboard mode inside the same shell: same background, same header hierarchy; remove in-page footer or make it a small link row. |
| **KPIs/Reports** | `kpis/page.tsx`: full `min-h-screen bg-background`, then a **separate** `border-b border-border bg-card/50` header block with title/description, then content. | Use the same page structure as other app pages (no extra full-screen wrapper); use `PageLayout` and a single clear page title in the content area (or rely on context header). |
| **Franchise (franchisor)** | "Content coming soon" style card. | When content exists, use standard card + empty state; avoid marketing-style copy. |
| **Auth (forgot/reset password)** | Centered card on `from-gray-50 to-gray-100` with large title. | Use semantic background (`bg-background`) and card; keep minimal and product-like. |

### 1.5 Clutter and Hierarchy

- **Cockpit**: Many panels (route map, route+inspections, revenue, attention, health watchlist, crew status) in one view; dashboard home can feel busy. **Recommendation:** Keep 2/3 + 1/3 grid but ensure one clear focal (e.g. KpiStrip + AlertRail), then command + rail; consider collapsible rail on smaller viewports.
- **Dashboard vs. page titles:** Some pages (e.g. Ops, Crews, Inspections, Settings) use a large `h1` + description inside the content area; others (e.g. KPIs) add another header strip. **Recommendation:** Standardize: one page title per route (either in context header or top of content), one short subtitle, then content. No duplicate "Reports" + "KPI Dashboard" headers.
- **Franchisee banner:** One line of copy + link is fine; ensure it doesn’t compete with the first KPI row.
- **Promo slot** in sidebar: Dismissible, role-gated—acceptable; keep it minimal so it doesn’t dominate.

### 1.6 Weak Modules (Summary)

| Module | Issue | Direction |
|--------|--------|-----------|
| **Grizzly (Sales)** | Sales command view is strong (KPI cards, action list). Sales page uses `max-w-[1400px]` (inconsistent with 1600px). | Unify max-width; ensure KPI tiles use semantic variants (no indigo for revenue). |
| **Kodiak (Ops)** | Ops home is a single table + CoverageGapsWidget. No KPI strip or quick links. | Add a compact KPI strip or summary cards (e.g. accounts at risk count, coverage gaps count, today’s inspections) and primary actions; keep table as main content. |
| **Launch to Ops** | Launch Intake list is one card with list; Launch Packets (sales) separate. Copy and structure are good. | Add a small "Launch pipeline" summary (e.g. ready vs. sent_to_ops counts) at top; ensure empty state and highlight state use tokens. |
| **Crews (Cub)** | Card grid is clear; empty state is fine. | Use consistent card style (e.g. same as other list cards); ensure icon uses `text-primary` (already does). |
| **Inspections** | List uses hardcoded grays and `bg-yellow-100` for "In Progress". | Switch to semantic tokens; use `badge` or `muted` + amber for in-progress state. |
| **KPIs/Reports** | Separate header strip and full-width layout; tabs are good. | Use shared page layout; one title; tabs below; content in same content area as rest of app. |
| **Settings** | Card list with Test data, Team, AI Control Center, Organization. Org switcher has long "How to test" block. | Keep structure; replace `text-gray-600 dark:text-gray-400` with `text-muted-foreground`; consider moving testing instructions to a collapsible or doc link. |
| **Financials** | Tabs, header filters, QuickBooks CTA—structure is good. Success/error alerts use `green-500/30`, `red-500/30`. | Prefer semantic success/destructive tokens where possible; keep alerts compact. |
| **AI onboarding / import** | Onboarding wizard and import flow live under `onboarding/` and `app/onboarding/`. | Ensure flows use same card/button tokens and spacing as app; no marketing-style footers; clear progress and one primary action per step. |

---

## 2. Unified JANIBEAR Product Design System Direction

### 2.1 Principles (from Design Agent)

- **Operator-first:** Every screen answers: what matters, what’s broken, what needs action, what drives revenue.
- **No marketing inside app:** No footer clutter; no webpage-style hero or gradient takeover.
- **Premium, not template:** Strong cards, clear hierarchy, crisp spacing, minimal noise.
- **Dark-mode-first** for premium SaaS feel (support light mode via tokens).
- **Brand:** Amber/gold as primary accent where brand is shown (landing, empty states, key CTAs). In app, `--primary` can be org-branded; defaults should align with amber when no branding is set.

### 2.2 Tokens and Theming

- **Use semantic tokens everywhere:** `background`, `foreground`, `card`, `card-foreground`, `primary`, `muted`, `muted-foreground`, `border`, `destructive`, `ring`.
- **No raw gray/indigo/purple in product UI:** Use `muted-foreground`, `muted`, `card`, `primary`, `destructive`; use amber for warning/highlight if not using primary.
- **Revenue/success:** Prefer `primary` or a dedicated success token (e.g. chart/success) so revenue isn’t indigo.
- **Cards:** One default: `bg-card border border-border rounded-lg` (or `rounded-xl`). One elevated: `.elevated-card` or component with left accent and shadow—use consistently for KPI tiles and key panels.
- **Typography:** `font-heading` (Inter Tight) for headings, `font-sans` (Source Sans 3) for body; one clear scale (e.g. `text-2xl`/`text-3xl` for h1).

### 2.3 Layout Constants

- **Content max-width:** `max-w-[1600px]` for all app content (dashboard, sales, ops, settings, etc.).
- **Content padding:** Single source: `p-4 md:p-6 lg:p-8` in `AppMainWithHeader`; avoid duplicating in page-level wrappers (e.g. don’t add another full-width padded shell inside that).
- **Page structure:** One wrapper (e.g. `PageLayout`: `space-y-8 pb-8`). Then: optional page title block (h1 + short description), then sections. No extra full-page background or header strip unless it’s the global context header.

### 2.4 Component Conventions

- **Page title:** `h1` with `font-heading text-2xl or text-3xl font-bold tracking-tight text-foreground`; subtitle `text-sm text-muted-foreground mt-1`.
- **Cards:** Prefer shadcn `Card` or shared elevated component; same radius scale (`rounded-lg` / `rounded-xl`).
- **KPI tiles:** Use shared `KpiTile` (cockpit) or Grizzly-style KPI cards with variant (neutral, success, warning, danger); **revenue** variant should use primary/amber, not indigo.
- **Empty states:** Use `AppEmptyState` with icon, title, description, action; semantic colors only.
- **Tables:** Use shadcn `Table`; header and cells use `foreground`/`muted-foreground`; avoid `text-gray-*`.
- **Badges:** Use semantic variants (e.g. destructive for critical, default/muted for status); "In progress" = muted or amber, not raw yellow.

---

## 3. Dashboard Layout Guidance

- **Single content band:** Main content lives in the same `max-w-[1600px]` and padding as every other app page. Dashboard home should not introduce a second full-width shell; `DashboardShell` can be a spacing/width wrapper that matches the rest of the app (or remove if redundant).
- **Cockpit order:** (1) Dashboard header (title + optional subtitle + data freshness), (2) KpiStrip, (3) AlertRail, (4) 2/3 + 1/3 grid. Keep KpiStrip and AlertRail as the primary "at a glance" layer.
- **Executive mode:** Render inside the same content area and same background as the rest of the app. Replace hardcoded `#070B12` and blue/violet gradient with `bg-background` and semantic tokens; optional very subtle gradient via CSS variable. Remove or minimize in-page footer; "Back to Command Center" can be a small link or use the sidebar.
- **Franchisee banner:** Keep one line + link; style with `border-border bg-muted/30` and `text-muted-foreground`; ensure it doesn’t look like a marketing CTA.
- **Widget grid:** Keep registry and Executive toggle; ensure each widget uses card and spacing tokens.

---

## 4. Module-by-Module Visual Recommendations

| Module | Change |
|--------|--------|
| **Dashboard (Cockpit)** | Remove indigo from revenue/month pacing—use primary or amber. Ensure CockpitSection doesn’t double-pad with layout. Consider one shared "dashboard page title" so the cockpit doesn’t rely on a different pattern than other pages. |
| **Grizzly (Sales)** | Align `max-w-[1400px]` to `1600px` (or use same container as app). Sales command KPI cards: ensure success/warning/danger use semantic or amber/rose; no indigo. |
| **Kodiak (Ops)** | Add a small top row: KPI tiles or summary (e.g. "Accounts at risk: N", "Coverage gaps: N") and primary action (e.g. "View risk"). Keep "Accounts at Risk" table; use `Card` and semantic table styles. |
| **Launch to Ops** | Add a one-line summary (e.g. "Ready: N · Sent: N") above LaunchIntakeList. LaunchIntakeList: already card + list; ensure highlight row uses `bg-primary/10 ring-primary/30` (already does). Empty state: use `AppEmptyState` and tokens. |
| **Crews** | Keep card grid; ensure cards use `bg-card border-border` and hover state is consistent (e.g. `hover:shadow-md`). |
| **Inspections** | Replace all `text-gray-*`, `hover:bg-gray-50`, `bg-yellow-100` with `text-muted-foreground`, `hover:bg-muted/50`, and badge with `bg-amber-500/10 text-amber-600 dark:text-amber-400` or similar. |
| **KPIs/Reports** | Remove full-page wrapper and duplicate header. Use `PageLayout`; one h1 "Reports" (or "KPI Dashboard") and subtitle in content; then tabs and content. Same background as rest of app. |
| **Settings** | Replace `text-gray-600 dark:text-gray-400` with `text-muted-foreground`. Org switcher: keep "How to test" in a collapsible or link to TESTING_ORG_TYPES.md. |
| **Financials** | Keep tab and filter layout; use semantic colors for success/error alerts (e.g. `border-primary/30 bg-primary/10` for success if primary is green, or keep green but use a token). |
| **Executive view** | Reuse app background and shell; remove custom full-page background and gradient. Use `bg-background`, semantic text, and same card style as cockpit. |
| **Onboarding / Import** | Use `Card`, `Button`, and spacing from design system; no marketing footer; clear step progress and one primary CTA per step. |

---

## 5. Specific Improvements Checklist

### 5.1 Grizzly (Sales)

- [ ] Sales page container: use `max-w-[1600px]` (or inherit from app layout) instead of `max-w-[1400px]`.
- [ ] Revenue-related KPI styling: use primary or amber, not indigo.
- [ ] SalesCommandView: ensure all KPI card variants use semantic or brand colors.

### 5.2 Kodiak (Ops)

- [ ] Add a compact summary row or KPI strip (e.g. at-risk count, gaps count) and one primary action.
- [ ] "Accounts at Risk" table: ensure table and badges use semantic colors (e.g. destructive/amber for risk level).
- [ ] CoverageGapsWidget: use card and tokens.

### 5.3 Cub (Crews)

- [ ] Crew cards: consistent `Card` + `border-border`; hover state uniform.
- [ ] Empty state: already uses Card; ensure text uses `text-muted-foreground`.

### 5.4 Launch to Ops

- [ ] Optional: small summary line above list (ready/sent counts).
- [ ] LaunchIntakeList card: use semantic tokens for badges and list rows.
- [ ] Launch intake detail page: same card/heading conventions.

### 5.5 Inspections

- [ ] Replace every `text-gray-*`, `bg-gray-*`, `hover:bg-gray-50` with semantic tokens.
- [ ] "In Progress" badge: use amber or muted variant, not `bg-yellow-100`.
- [ ] Inspection list links: use `hover:bg-muted/50` and `text-foreground`/`text-muted-foreground`.

### 5.6 KPIs and Reports

- [ ] kpis/page.tsx: remove `min-h-screen bg-background` wrapper and separate header strip.
- [ ] Use shared page layout; single h1 + subtitle; tabs below; content in main flow.
- [ ] KpiDashboardPageV2 / KpiCommandCenterContent: use semantic card and chart colors.

### 5.7 Settings

- [ ] Replace `text-gray-600 dark:text-gray-400` with `text-muted-foreground` in settings page and child components.
- [ ] Test data / Team / AI / Organization cards: keep structure; ensure CardTitle and CardDescription use tokens.
- [ ] Org switcher: consider collapsible "How to test" or link to doc.

### 5.8 Financials

- [ ] QuickBooks success/error alerts: use semantic success/destructive or keep green/red but via tokens.
- [ ] Tabs and filters: already clean; ensure all table and card content uses semantic tokens.

### 5.9 AI Onboarding / Import

- [ ] Onboarding wizard and import flows: use `Card`, `Button`, `Input` from design system; spacing `space-y-6` or `space-y-8`.
- [ ] No marketing-style footer; progress indicator and one primary action per step.
- [ ] Success/error states: semantic colors.

### 5.10 Global / Shared

- [ ] **Landing:** Replace indigo/purple CTAs and decorative accents with amber/gold per design rule.
- [ ] **Cockpit KpiTile:** Change `revenue` variant from indigo to primary (or amber).
- [ ] **CockpitSection:** Month pacing and any indigo → primary or amber.
- [ ] **ExecutiveDashboard:** Remove `#070B12` and blue/violet gradient; use `bg-background` and semantic tokens; align with app shell.
- [ ] **globals.css:** Consider adding a `--success` or chart token for revenue if primary is org-branded; document that default primary should feel premium (amber when no branding).
- [ ] **Audit all `gray-*` and `indigo-*` in app:** Replace with semantic tokens (see grep list in audit).

---

## 6. Implementation Notes for Builder

- **Order of work:** (1) Token and color cleanup (globals + Cockpit + Inspections + Settings), (2) Dashboard/Executive layout alignment, (3) KPIs page layout, (4) Ops summary row, (5) Launch summary line, (6) Sales container and revenue color, (7) Onboarding/import pass. Then do landing CTA/accent pass.
- **Files to touch first:**  
  `src/app/globals.css`,  
  `src/components/cockpit/KpiTile.tsx`,  
  `src/app/app/dashboard/components/CockpitSection.tsx`,  
  `src/app/app/inspections/page.tsx`,  
  `src/app/app/settings/page.tsx`,  
  `src/components/executive/ExecutiveDashboard.tsx`,  
  `src/app/app/kpis/page.tsx`,  
  then remaining files with gray/indigo.
- **Testing:** After changes, check dashboard home (owner + franchisee), sales command, ops home, launch intake, crews, inspections list, KPIs (all tabs), settings, financials, and executive toggle in both light and dark mode. Verify no marketing footer in app and no duplicate headers.

---

## 7. Reference

- **Design rule (visual):** `.cursor/rules/design-billion-dollar-saas.mdc`
- **Design agent (process, roles, output format):** `.cursor/rules/janibear-design-agent.mdc`
- **Nav (single source):** `src/lib/nav/navFactory.ts`, `src/lib/nav/shellNav.ts`
- **Theme tokens:** `src/app/globals.css` (`:root` and `.dark`)
- **App shell:** `src/app/app/layout.tsx`, `src/components/app/app-main-with-header.tsx`, `src/components/app/app-sidebar.tsx`
