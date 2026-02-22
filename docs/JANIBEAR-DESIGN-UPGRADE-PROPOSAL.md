# JANIBEAR Design Upgrade — Enterprise UI/UX Proposal

**Design Agent output.** No business logic or server actions changed. Layout, hierarchy, spacing, typography, and composition only. Uses existing `ThemeProvider`/tokens and shadcn + Tailwind.

---

## 1. Component tree proposal

### 1.1 New shared components (add only)

| File | Purpose |
|------|--------|
| `src/components/enterprise/page-shell.tsx` | Standard page shell: optional breadcrumb, header slot, KPI strip slot, primary + secondary area, consistent vertical rhythm |
| `src/components/enterprise/kpi-strip.tsx` | Horizontal strip of 2–4 KPI cards; accepts `KpiCardProps[]` or typed placeholder data |
| `src/components/enterprise/section-card.tsx` | Section wrapper: Card + optional title/description, consistent padding (p-6), rounded-2xl, border |
| `src/components/enterprise/page-skeleton.tsx` | Full-page loading: header skeleton + KpiRowSkeleton + 2–3 content blocks (reuses `LoadingSkeleton`, `KpiRowSkeleton`) |
| `src/components/enterprise/empty-state-panel.tsx` | Wrapper that puts `EmptyState` inside a `SectionCard` for secondary panels |

**Reused as-is (no refactor):** `PageLayout`, `PageHeader`, `KpiCard`, `KpiRow`, `ContentGrid`, `PrimaryPanel`, `ContextPanel`, `EmptyState`, `LoadingSkeleton`, `KpiRowSkeleton`, `SlideOverDrawer`, `ThemeApplier`, all shadcn components (Card, Skeleton, Button, etc.).

### 1.2 Files to change (layout/composition only)

| File | Change |
|------|--------|
| `src/components/enterprise/index.ts` | Export `PageShell`, `KpiStrip`, `SectionCard`, `PageSkeleton`, `EmptyStatePanel` |
| `src/app/app/dashboard/page.tsx` | Wrap content in `PageShell`; keep `CommandCenterHeader` in header slot; add optional KPI strip slot (data from existing `getCommandCenterData` or placeholder); ensure franchisee banner stays; keep `DashboardWithExecutiveToggle` in primary area |
| `src/app/app/kpis/page.tsx` | No route/data change. `kpi-page-client.tsx`: use `PageShell` with header slot = current title + `StrategicTimeframeToggle`; optional `KpiStrip` from context or placeholder; primary = `WidgetGrid` |
| `src/app/app/sales/page.tsx` | Wrap in `PageShell`; header = `PageHeader` (title “Sales”, description “Lead → Walk-through”, actions = existing buttons); optional KPI strip (e.g. lead count, pipeline value from existing `salesData` or placeholder); primary = existing `WidgetGrid` |
| `src/app/app/alerts/page.tsx` | Use `PageShell`; header = `PageHeader` (“Alerts & Risk Radar”, existing description); primary = `RiskRadarPanel`; secondary (context) = `AlertsCenter` via `ContentGrid`; add `PageSkeleton` for loading state in client wrapper if needed |
| `src/app/app/audit/page.tsx` | Use `PageShell`; header = `PageHeader`; primary = `AuditLogViewer` inside `SectionCard`; add loading skeleton in `AuditLogViewer` or parent |
| `src/app/app/benchmarks/page.tsx` | No server change. `benchmark-page-client.tsx`: use `PageShell`; header slot = current title + description; when opted-in: KPI strip (4 metrics) + `ContentGrid` (primary = peer selector + chart cards, optional context = summary); when not opted-in: `EmptyStatePanel` + upsell |
| `src/app/app/settings/page.tsx` | Use `PageShell`; header = `PageHeader` (“Settings”, “Manage your organization settings”); primary = existing cards in a single column with consistent `SectionCard` wrapper and spacing |
| `src/app/app/financial-health/page.tsx` | No data change. `OperatorFinancialHealthDashboard`: wrap in `PageShell`; header slot; primary KPIs then secondary panels; empty/loading via `PageSkeleton` / `EmptyState` where appropriate |

### 1.3 Optional shared “page header” convention

- **PageShell** accepts: `breadcrumb?`, `title`, `description?`, `actions?`, `badge?`, `kpiStrip?`, `children` (primary content), `secondary?` (context column).
- Pages that already use a custom header (e.g. `CommandCenterHeader`) pass it as `header` slot; others use `PageHeader`-compatible props via `PageShell`.

---

## 2. Visual layout description

### 2.1 Global structure (unchanged)

- **App layout:** `ThemeProvider` → `ThemeApplier` → `AppSidebar` + `AppMainWithHeader` + `BottomNav`. Main content area: `flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full min-w-0`.
- **Tokens:** Use only existing CSS variables: `--background`, `--foreground`, `--card`, `--primary`, `--muted`, `--muted-foreground`, `--border`, `--radius`, `--health-*`, `--chart-*`. ThemeProvider injects `--primary`/`--secondary` from org branding; do not assume new tokens.

### 2.2 Per-page pattern (every page)

1. **Header area**
   - Optional breadcrumb (small, `text-muted-foreground`).
   - Title: `font-heading` (or existing heading class), 28–32px, `tracking-tight`, one line if possible.
   - Optional description: `text-sm text-muted-foreground max-w-2xl`.
   - Actions: right-aligned on md+, stacked on small screens; use shadcn `Button` variants.

2. **Primary KPIs**
   - Strip of 2–4 metrics above the fold (dashboard, KPIs, sales, benchmarks, financial health). Use existing `KpiCard` in a responsive grid (e.g. `grid grid-cols-2 lg:grid-cols-4 gap-4`). Same data contracts as today (e.g. from `getCommandCenterData`, `salesData`, `orgMetrics`); if a page has no KPIs, omit strip.

3. **Secondary panels**
   - Where applicable: 70/30 or single column. Use `ContentGrid` + `PrimaryPanel` + `ContextPanel`, or a single column of `SectionCard`s. Cards: `rounded-2xl border border-border bg-card`, padding `p-6`, no change to inner logic.

4. **Empty states**
   - Use existing `EmptyState` (icon, title, description, action). Wrap in `EmptyStatePanel` (SectionCard) when it’s a panel. No new copy; use existing or typed placeholder copy.

5. **Skeleton / loading**
   - Section-level: `LoadingSkeleton` or `KpiRowSkeleton`. Full-page: new `PageSkeleton` (header block + KPI row + 2–3 content blocks). No spinners for section load; calm, predictable blocks.

6. **Spacing**
   - Vertical rhythm: `space-y-6` or `space-y-8` between major sections; `gap-4` or `gap-6` in grids. Preserve existing `PageLayout` `space-y-8 pb-8`. Horizontal padding already set by `AppMainWithHeader`.

### 2.3 Page-specific layout (concise)

- **Dashboard:** Header = CommandCenterHeader. Optional KPI strip (from command center data). Primary = franchisee banner (if applicable) + DashboardWithExecutiveToggle/WidgetGrid. No secondary column.
- **KPIs:** Header = title + timeframe toggle. Optional KPI strip. Primary = WidgetGrid. No secondary.
- **Sales:** Header = PageHeader + actions (cadence, top targets, add lead). Optional KPI strip (e.g. total leads, by stage counts). Primary = WidgetGrid.
- **Alerts:** Header = PageHeader. ContentGrid: primary = RiskRadarPanel, context = AlertsCenter.
- **Audit:** Header = PageHeader. Primary = AuditLogViewer inside SectionCard; filters stay in card.
- **Benchmarks:** Header + description. If opted-in: KPI strip (4 metrics) then peer selector + chart grid; optional context. If not opted-in: EmptyStatePanel + BenchmarkUpsellPanel.
- **Settings:** PageHeader. Single column of SectionCards (Branding, Benchmarking, Team, Organization).
- **Financial health:** PageShell; header; KPI strip from laborSummary or placeholders; primary = existing dashboard blocks.

---

## 3. Key UI states (no backend assumptions)

- **Loading:** Use `PageSkeleton` or section-level `LoadingSkeleton`/`KpiRowSkeleton`; data comes from existing props or Suspense boundaries. No new API calls.
- **Empty:** Use `EmptyState`/`EmptyStatePanel` with existing or typed placeholder copy (e.g. “No alerts”, “No audit entries”).
- **Error:** No new error UI contract; if a page already shows an error from server/action, keep it. Optional: wrap in `SectionCard` for consistency.
- **Partial data:** Components consume existing props; use typed placeholders (e.g. `value: number | null`) where design needs a placeholder (e.g. “—” or “N/A”) without changing server contracts.

---

## 4. Summary

- **Add:** `page-shell.tsx`, `kpi-strip.tsx`, `section-card.tsx`, `page-skeleton.tsx`, `empty-state-panel.tsx`; export from `enterprise/index.ts`.
- **Change:** Dashboard, KPIs (client), Sales, Alerts, Audit, Benchmarks (client), Settings, Financial health (client) to use `PageShell` + optional `KpiStrip` + `ContentGrid`/`SectionCard` + existing empty/loading components.
- **Preserve:** All data contracts, routing, server actions, and theme/tokens; only layout, hierarchy, spacing, typography, and composition are upgraded.
