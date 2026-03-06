# JANIBEAR Dashboard — Visual Design Direction

**Design lead.** Executive cockpit for commercial cleaning operations. Operationally sharp, premium, dark-mode native, fast to scan, command-center feel, high trust.

**Visual target:** Palantir / Stripe dashboard polish / Datadog operational density. **Not:** generic Tailwind starter, soft illustrations, giant empty sections, flat gray tiles.

---

## 1. Color System (Discipline)

| Role | Use | Tailwind / CSS |
|------|-----|----------------|
| **Operations** | Primary actions, nav, ops metrics | `indigo-500`, `indigo-500/20` bg, `border-indigo-500/30` |
| **Healthy / OK** | Success, on track | `emerald-500`, `emerald-500/15` bg, `text-emerald-600 dark:text-emerald-400` |
| **Watchlist** | Needs review, caution | `amber-500`, `amber-500/15` bg, `border-amber-500/25` |
| **Urgent / Danger** | SLA, critical | `rose-500`, `rose-500/15` bg, `text-rose-600 dark:text-rose-400` |
| **Money / Revenue** | Financial KPIs | Cool blue or emerald; e.g. `text-sky-600 dark:text-sky-400` or `emerald` with tabular-nums |

- Do **not** make everything bright. Do **not** overuse gradients. No neon cyberpunk.
- Prefer opacity variants: `/10`, `/15`, `/20`, `/25`, `/30` for backgrounds and borders.

---

## 2. KPI Strip (Instruments, Not Rectangles)

**Goals:** Stronger title/value hierarchy, cleaner icon placement, visible accent, restrained status badge, sparkline row integrated, better rhythm.

### Tailwind — KPI card (tile)

- **Container:** `rounded-xl border overflow-hidden`  
  - Neutral: `border-border bg-card dark:bg-card/90`  
  - With variant: `border-l-4` + variant border (e.g. `border-l-emerald-500`, `border-l-amber-500`, `border-l-rose-500`, `border-l-indigo-500`).
- **Padding:** `p-4` (or `p-4 sm:p-5` for hero tiles). **Min height:** `min-h-[132px]` for rhythm.
- **Icon:** Contained, not floating.  
  `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg`  
  - Neutral: `bg-muted/80 text-muted-foreground`  
  - With variant: e.g. `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400`.
- **Title:** Quiet, scannable.  
  `text-[11px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground truncate`.
- **Value:** Dominant.  
  `text-xl sm:text-2xl font-semibold tabular-nums tracking-tight text-foreground` (no washed-out).
- **Subvalue:** One line under value.  
  `text-xs text-muted-foreground mt-0.5`.
- **Delta badge:** Restrained.  
  `rounded-md px-2 py-0.5 text-[11px] font-medium tabular-nums`  
  - Neutral: `bg-muted/80 text-muted-foreground`  
  - Positive (revenue/ops): `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400`  
  - Negative (e.g. health): `bg-rose-500/15 text-rose-600 dark:text-rose-400`.
- **Status badge:** Only when needed.  
  `rounded-md px-2 py-0.5 text-[11px] font-medium`  
  - Review: `bg-amber-500/20 text-amber-600 dark:text-amber-400`  
  - Action: `bg-rose-500/20 text-rose-600 dark:text-rose-400`.
- **Sparkline row:** Integrated, not tacked on.  
  `mt-3 flex items-end gap-px h-8`; bars `min-w-[3px] rounded-sm` with variant-based fill (e.g. `bg-primary/40` or variant opacity). No heavy animation.
- **Hover (clickable):** `hover:border-primary/25 dark:hover:border-primary/30 hover:shadow-sm transition-all duration-200`; optional `hover:-translate-y-0.5` for lift. **Do not** use bright glow or large shadow.

### Grid (KPI strip)

- `grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4`.
- Consistent card height via `min-h-[132px]` so the strip reads as one control row.

---

## 3. Page Rhythm

- **Section spacing:** `space-y-6` or `space-y-8` between major sections (header vs strip vs panels).
- **Shell padding:** `px-4 sm:px-6 lg:px-8 py-6`; max-width `max-w-[1600px] mx-auto`.
- **Vertical rhythm:** Header `pb-5 border-b`; then `gap-6` to KPI strip; then `gap-6` between grid rows.
- **Panel internal:** Header row `p-4 sm:p-5 border-b`; body `p-4 sm:p-5`. Use `border-border` for dividers.

---

## 4. Cockpit Details

- **Section headers:**  
  Title: `text-base font-semibold tracking-tight text-foreground`.  
  Optional label above: `text-[11px] font-medium uppercase tracking-wider text-muted-foreground`.
- **Dividers:** Thin, quiet. `border-b border-border` or `h-px bg-border`.
- **Accents:** Left border accent on cards (e.g. `border-l-4 border-l-indigo-500/50`) or bottom accent on section headers. No full glowing borders.
- **Surfaces:** Dark mode: layered. Base `bg-background`; cards `bg-card` or `bg-card/90`; muted areas `bg-muted/30` or `bg-muted/20`.
- **Status chips:** Pill or small rounded.  
  `rounded-full px-2.5 py-0.5 text-xs font-medium` with semantic colors (emerald / amber / rose). No giant badges.

---

## 5. Typography

- **Dashboard title:** `text-xl sm:text-2xl font-semibold tracking-tight text-foreground` (stronger; not washed out).
- **Labels / overlines:** `text-xs` or `text-[11px] font-medium uppercase tracking-wider text-muted-foreground`.
- **KPI value:** `text-xl sm:text-2xl font-semibold tabular-nums tracking-tight text-foreground`.
- **Section title:** `text-base font-semibold tracking-tight text-foreground`.
- **Section subtitle:** `text-sm text-muted-foreground`.
- **Body in panels:** `text-sm text-foreground`; secondary `text-muted-foreground`. Avoid body that looks washed out (ensure contrast in dark mode).

---

## 6. Shadows, Border, Radius, Spacing

- **Shadows:** Restrained. Card: `shadow-sm`; hover: `shadow-md` only if needed. No `shadow-xl` or colored glow on default state.
- **Border:** Default `border-border`. Cards `rounded-xl`; inputs/buttons `rounded-lg`.
- **Radius:** `rounded-xl` panels/cards; `rounded-lg` buttons and inputs; `rounded-md` badges/chips.
- **Spacing:** Base 4px grid. Section padding `p-4 sm:p-5`; gaps `gap-3`, `gap-4`, `gap-6`.

---

## 7. Sidebar + Frame (Suggestions)

- **Sidebar:** Dense but readable. Nav items `text-sm`; active state clear (e.g. `bg-primary/15` or `border-l-2 border-primary`). Use `border-r border-border` for separator.
- **Active state:** `bg-muted/50` or `bg-primary/10` + `text-foreground`; not bright fill.
- **Footer:** Optional thin top border `border-t border-border`; org switcher / language compact.
- **Top bar:** Clean; time/date and quick actions only. No giant headers.

---

## 8. Prioritized Implementation Order

1. **KPI tiles** — Fix value text (remove invalid `styles.value`), apply variant accents, icon containers, status badges, sparkline row, min-height and hover. Single biggest visual win.
2. **KPI strip grid** — Gap and min-height; ensure 6-tile rhythm.
3. **Dashboard header** — Stronger title, quieter subtitle, compact time/date.
4. **CommandPanel / SideRailPanel** — Uppercase section overline, thin border-b, compact padding.
5. **AlertRail** — Chip-style treatment; amber when active, muted when clear.
6. **DashboardShell** — Consistent `space-y-6` and padding.
7. **Sidebar** — Active state and separator polish (optional, if time).

---

## 9. Microinteractions (Optional, Performance-Safe)

- KPI tile: `transition-all duration-200` on border and shadow; optional `hover:-translate-y-0.5`.
- Alert rail: `transition-colors duration-150` on hover.
- Panel header: no animation needed.
- Avoid: sparkline animation, heavy parallax, or auto-playing motion.

---

## 10. Component-by-Component Checklist

| Component | Change |
|-----------|--------|
| **KpiTile** | Left accent bar or border-l-4; icon in rounded box; title uppercase small; value large and foreground; delta/status badges restrained; sparkline row with variant color; min-height; hover lift + shadow-sm. |
| **KpiStrip** | Grid gap-3 sm:gap-4; min-h on tiles; role="region" aria-label. |
| **DashboardHeader** | Title text-xl sm:text-2xl font-semibold; subtitle text-sm text-muted-foreground; time/date text-sm tabular-nums. |
| **DashboardShell** | space-y-6; py-6; max-w-[1600px] px-4 sm:px-6 lg:px-8. |
| **CommandPanel** | Section: rounded-xl border border-border bg-card/80; header border-b border-border p-4 sm:p-5; optional overline "OPERATIONS" in uppercase; body p-4 sm:p-5. |
| **SideRailPanel** | Same as CommandPanel; title text-sm font-semibold; description text-xs text-muted-foreground. |
| **AlertRail** | rounded-xl border; when active: border-amber-500/30 bg-amber-500/10; when clear: border-border bg-muted/30; chip-like padding. |

Implement in React + Tailwind; keep existing data and behavior; only change layout and styling.
