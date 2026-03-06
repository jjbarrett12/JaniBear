# Dashboard Layout & Visual Hierarchy — Audit Report

## Executive summary

The live dashboard looks broken because of **structural conflicts**, **double card nesting**, **inconsistent spacing systems**, and **multiple competing KPI/card implementations**. The redesign was only partially applied; legacy and alternate components remain, and the main cockpit shares the page with a widget grid that uses a different card system.

---

## 1. ROOT CAUSES OF LAYOUT FAILURE

### 1.1 Double card nesting (primary cause of cramped/crowded feel)

- **Where:** `WidgetFrame` wraps all widgets in `<ElevatedCard>`. Dashboard widgets (RevenuePulseCard, RiskAlertCard, AccountHealthCard, etc.) use `MetricCard`, which **also** wraps content in `<ElevatedCard>`.
- **Result:** Every widget is **card-in-card**: outer ElevatedCard (WidgetFrame) + inner ElevatedCard (MetricCard). Double border, double shadow, and the inner card’s `p-5` sit inside the frame’s content area (which only gets `p-2` in edit mode), so layout feels cramped and heavy.
- **Files:** `src/components/widgets/WidgetFrame.tsx`, `src/components/dashboard/MetricCard.tsx`, all `*SnapshotCard` / `*PulseCard` components that use MetricCard.

### 1.2 KpiStrip grid breakpoint gap

- **Where:** `KpiStrip` uses `grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6`. There is **no `lg`** breakpoint.
- **Result:** From `md` (768px) to `xl` (1280px) the strip stays at 3 columns. Six tiles in 3 columns = 2 rows; then at 1280px it jumps to 6 columns (1 row). Tiles feel cramped on tablets/small desktop, then suddenly wide on large desktop. Inconsistent “command center” feel.
- **File:** `src/components/cockpit/KpiStrip.tsx`.

### 1.3 CommandCenterSection — dead code with broken grid

- **Where:** `CommandCenterSection` is **never imported** anywhere. It uses `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8` and assigns `lg:col-span-2` to two tiles and `lg:col-span-1` to the rest.
- **Math:** 2×2 + 4×1 = 8 column units, but the grid has 8 columns and 6 items: two items span 2, four span 1 → 2+2+1+1+1+1 = 8. So it doesn’t overflow, but the **component is dead**. It also uses a **different** KPI component (`dashboard/components/KpiCard` — a `<button>` with custom styles, not cockpit’s `KpiTile`). This indicates a second, abandoned implementation.
- **File:** `src/app/app/dashboard/components/CommandCenterSection.tsx`.

### 1.4 Inconsistent spacing systems

- **PageLayout:** `space-y-8` (32px) between direct children.
- **DashboardShell:** `space-y-6` (24px) between header, KpiStrip, AlertRail, and main grid.
- **Dashboard page:** Franchisee banner has `mt-6` (24px); next section has `mt-8` (32px).
- **CommandPanel:** Header and content use `p-4 sm:p-5` (16px / 20px).
- **KpiTile:** `p-4` (16px).
- **WidgetFrame:** Header `px-3 py-2` (12px/8px); content area has no padding except `p-2` in edit mode.
- **MetricCard:** `p-5` (20px).
- **Result:** No single spacing scale. Mix of 24px vs 32px vertical rhythm and 12px/16px/20px padding makes the page feel uneven and “generic.”
- **Files:** `src/components/enterprise/page-layout.tsx`, `src/components/cockpit/DashboardShell.tsx`, `src/app/app/dashboard/page.tsx`, `CommandPanel`, `KpiTile`, `WidgetFrame`, `MetricCard`.

### 1.5 Widget grid row height

- **Where:** `WidgetGrid` uses `ROW_HEIGHT = 120` and `margin={[16, 16]}` for react-grid-layout.
- **Result:** Each row is 120px tall. Widget content (MetricCard with `p-5` and text) is squeezed into that height; with the double card and no minimum content height, tiles feel cramped and heights inconsistent.
- **File:** `src/components/widgets/WidgetGrid.tsx`.

### 1.6 KpiTile accent bar and padding

- **Where:** `KpiTile` uses `relative` and an absolutely positioned left accent bar `absolute left-0 top-0 bottom-0 w-[3px]`. Content has `p-4` but no extra left padding for the bar.
- **Result:** The 3px bar sits at the left edge of the tile; with `rounded-l-xl` the bar can visually overlap the first few pixels of the padding. Can look tight or slightly overlapping depending on zoom/font.
- **File:** `src/components/cockpit/KpiTile.tsx`.

---

## 2. DESIGN TOKEN FAILURE

### 2.1 .elevated-card uses hardcoded values

- **Where:** `globals.css` defines `.elevated-card` with `border-radius: 17px`, `border: 1px solid rgba(255, 255, 255, 0.1)`, `box-shadow: 0 12px 30px ...`.
- **Result:** No use of `--card`, `--border`, or theme variables. In light mode or different themes, the card can clash with semantic tokens and feel disconnected from the rest of the app.
- **File:** `src/app/globals.css`.

### 2.2 KPI command center tokens only in dark mode

- **Where:** `.dark .kpi-executive-console .kpi-card-elevated` and `.dark .kpi-command-center .kpi-card-elevated` set background and border. The **main dashboard** (CockpitSection) does **not** use these classes; it uses cockpit components and `bg-card` / `border-border`.
- **Result:** The “command center” look (charcoal, elevated cards) is only applied on the KPI/reports page (kpi-page-client), not on the main dashboard. So the “redesign” tokens are not applied where users see the main command center.
- **Files:** `src/app/globals.css`, `src/app/app/kpis/kpi-page-client.tsx`, `src/app/app/dashboard/page.tsx`.

### 2.3 ExecutiveView uses raw Card, not design system

- **Where:** `ExecutiveView` uses shadcn `Card`, `CardHeader`, `CardContent` with `CardHeader className="pb-1"` and no consistent padding scale.
- **Result:** When toggling to “Executive mode,” cards look different from the cockpit (different component, different spacing). Weak hierarchy and inconsistent “command center” feel.
- **File:** `src/components/dashboard/ExecutiveView.tsx`.

---

## 3. COMPONENT ARCHITECTURE FAILURE

### 3.1 Multiple KPI / card components

| Component | Location | Used by | Padding | Wrapper |
|-----------|----------|---------|---------|---------|
| KpiTile | cockpit | KpiStrip (main dashboard) | p-4 | div/button, border + variant styles |
| KpiCard | dashboard/components | CommandCenterSection (dead) | p-4 / p-5 hero | button, no Card |
| KpiCard | enterprise | Platform overview, etc. | CardContent p-6 | Card |
| MetricCard | dashboard | All snapshot widgets in grid | p-5 | ElevatedCard |
| executive-snapshot-card, kpi-metric-tile, ops-health-card, etc. | kpi/ | KPI/reports pages | mixed | Card + kpi-card-elevated |

- **Result:** No single “KPI card” or “dashboard card” contract. Different padding, different wrappers, and mixed use of Card vs ElevatedCard vs custom button cause inconsistent tile sizes and hierarchy.

### 3.2 Page-level layout: two competing sections

- **Flow:** Dashboard page → PageLayout → [CockpitSection] → [franchisee banner] → [DashboardWithExecutiveToggle].
- **CockpitSection** uses DashboardShell (max-w-[1600px], space-y-6), KpiStrip, AlertRail, CommandPanel grid.
- **DashboardWithExecutiveToggle** either renders ExecutiveView (raw Card grid) or WidgetGrid (react-grid-layout + WidgetFrame + ElevatedCard + MetricCard).
- **Result:** The “command center” (cockpit) and the “widget grid” below are two different layout systems (custom grid + panels vs react-grid-layout + double card). No single layout shell or spacing scale.

### 3.3 New dashboard only partially wired

- **Intended:** One command center with KPI strip, alert rail, and main content.
- **Actual:** Cockpit is wired and uses cockpit/KpiTile. The **old** CommandCenterSection (with dashboard/KpiCard and 8-col grid) was never removed and is never rendered. The widget grid below uses a different card system (ElevatedCard + MetricCard) and different spacing. So the “new” cockpit exists, but the content below it was not unified with the same tokens or card component.

---

## 4. LIVE-UI MISMATCH

- **Dashboard page imports:** CockpitSection, DashboardWithExecutiveToggle. It does **not** import CommandCenterSection.
- **Stale component:** CommandCenterSection and dashboard/components/KpiCard are dead; they could be removed or refactored so a single KPI card is used everywhere.
- **Partial refactor:** Only the top section (CockpitSection) uses the cockpit design (KpiTile, CommandPanel, SideRailPanel). The rest of the page uses WidgetGrid + widgets that each wrap in ElevatedCard again via MetricCard.

---

## 5. FIX STRATEGY (concise)

1. **Remove double ElevatedCard:** Make MetricCard render content only (no ElevatedCard). WidgetFrame remains the single card wrapper for grid widgets. Adjust MetricCard to a single inner container with the same padding (p-5) and typography.
2. **Unify spacing:** Use one vertical rhythm (e.g. space-y-6) in DashboardShell and align page-level margins (e.g. mt-6 or mt-8 consistently). Use a single padding scale for card interiors (e.g. p-4 sm:p-5 everywhere for panels/cards).
3. **Stabilize KPI strip grid:** Add an explicit `lg:grid-cols-6` (or lg:grid-cols-3 and keep xl:grid-cols-6) so the strip doesn’t jump only at xl. Optionally use a single gap token (e.g. gap-4).
4. **Normalize ExecutiveView:** Use the same card style as cockpit (e.g. CommandPanel or a shared card with border-border bg-card and p-4 sm:p-5), or a single “dashboard card” component used by both cockpit and ExecutiveView.
5. **Remove or repurpose dead code:** Remove CommandCenterSection or refactor it to use KpiStrip/KpiTile and the same layout as CockpitSection so there is one implementation.
6. **Widget grid:** Consider increasing ROW_HEIGHT (e.g. 140) and ensuring WidgetFrame content area has consistent padding (e.g. p-4) so content isn’t clipped and heights feel consistent.
7. **Design tokens:** Prefer semantic tokens (--card, --border) in .elevated-card where possible, or document that elevated-card is intentionally a “premium” override.

---

## 6. FILES TO CHANGE (summary)

| File | Problem | Fix |
|------|---------|-----|
| `MetricCard.tsx` | Wraps in ElevatedCard → double card in grid | Render content only (div with p-5); drop ElevatedCard when used in grid (or always, WidgetFrame is the card). |
| `KpiStrip.tsx` | No lg breakpoint; gap/cols jump at xl | Add lg:grid-cols-6 (or consistent lg behavior); use gap-4. |
| `DashboardShell.tsx` | space-y-6 vs page space-y-8 | Align with page (e.g. keep space-y-6, document as “tight” rhythm for cockpit). |
| `dashboard/page.tsx` | mt-6 vs mt-8 | Use one margin (e.g. mt-6) for both banner and toggle section. |
| `WidgetFrame.tsx` | Content area no padding when not edit mode | Add p-4 to content wrapper so widget content has consistent inset. |
| `WidgetGrid.tsx` | ROW_HEIGHT 120 | Increase to 140 (or 136) so cards feel less cramped. |
| `ExecutiveView.tsx` | Raw Card, different padding | Use shared panel/card class (e.g. same as CommandPanel: rounded-xl border border-border bg-card p-4 sm:p-5) and consistent spacing. |
| `CommandCenterSection.tsx` | Dead code, wrong grid | Remove or refactor to use KpiStrip + same layout as CockpitSection. |
| `KpiTile.tsx` | Accent bar overlap risk | Add pl-1 or ensure content has enough left padding so the 3px bar doesn’t crowd text. |
| `globals.css` (.elevated-card) | Hardcoded colors/shadows | Optional: use CSS variables for border/background where it doesn’t break the “elevated” look. |

---

## 7. VERIFICATION CHECKLIST (post-fix)

- [ ] **Desktop (1280px+):** KPI strip is one row of 6 tiles (`lg:grid-cols-6`); no double border on widget cards (MetricCard content-only); spacing between sections even (mt-6); panel/card padding consistent (p-4 sm:p-5).
- [ ] **Tablet (768–1024px):** KPI strip 3 columns at md, 6 at lg; no overlap; widget grid 2 columns; cards have same padding and no clipped content.
- [ ] **Mobile (<768px):** KPI strip 2 columns; single column widget grid; touch targets adequate; no horizontal scroll from grid or cards.
- [ ] **Executive mode:** ExecutiveCard uses same shell as CommandPanel (rounded-xl border border-border bg-card, p-4 sm:p-5).
- [ ] **Dark theme:** All cards use semantic tokens or documented overrides; no gray flash or wrong contrast.
- [ ] **No dead code:** CommandCenterSection removed; only one KPI strip implementation (KpiStrip + KpiTile) on main dashboard.
- [ ] **Widget grid:** Row height 140px; single ElevatedCard per widget (WidgetFrame only); MetricCard renders content only.
