# KPI Command Center — Enterprise Design Spec

**Billion-dollar vertical SaaS.** Performance intelligence for commercial cleaning operators. Not a colorful startup dashboard—serious, minimal, data-dense, calm.

---

## Design principles

- **Minimal.** No gradients, no playful UI, no decorative elements.
- **Executive.** Sharp typography hierarchy; data-dense but calm.
- **State-based color only.** Green / amber / red for status; never color entire card.
- **Grid discipline.** 8px internal grid; 24px outer padding; 32px section spacing; 16px card spacing.
- **Dark enterprise theme.** Charcoal background; cards slightly lighter; 1px border; no shadows.
- **Feel:** Stripe dashboard, Linear analytics, enterprise compliance tool. *Not* Notion, ClickUp, or startup marketing SaaS. “I trust this with a $10M cleaning company.”

---

## Layout structure

| Token | Value |
|-------|--------|
| **Max width** | 1400px |
| **Outer padding** | 24px |
| **Vertical section spacing** | 32px |
| **Card spacing** | 16px |
| **Internal spacing grid** | 8px |
| **Background** | Dark charcoal `#0E1117` |
| **Cards** | Slightly lighter `#151A22`; subtle 1px border; no shadows |

**Tailwind guidance:** Section container: `max-w-[1400px] mx-auto px-6` (24px); section spacing: `space-y-8` (32px); card grids: `gap-4` (16px). Use `bg-[#0E1117]` for page and `bg-[#151A22]` for cards (or CSS vars scoped to `.kpi-command-center`).

---

## Section 1 — Executive Snapshot (top row)

- **Layout:** 4 equal-width cards; `grid-cols-4`; **fixed height 140px**.
- **Padding:** Minimal (e.g. 16px); no excessive padding.
- **Per card:**
  - **Label:** Small uppercase, muted gray — `text-[12px] font-medium uppercase tracking-wider text-muted-foreground`.
  - **Value:** Large bold 36–42px — `text-3xl` or `text-4xl font-bold tabular-nums text-foreground`.
  - **Trend:** Arrow + percent, small, right-aligned — `text-xs` with health-green / health-red.
  - **Subtext:** Comparison (e.g. “vs last 30 days”) — `text-[13px] text-muted-foreground`.
  - **State accent:** Left 4px line only — `border-l-4` with `border-l-[hsl(var(--health-*))]` or neutral; never fill card.
- **Hover:** Slight background shift only (e.g. `hover:bg-[#1a1f28]`). No animations, no lift.
- **KPIs (target):** MRR · Gross Margin % · Net MRR Change · Accounts at Risk.

**Tailwind (card):** `h-[140px] border border-border rounded-lg shadow-none border-l-4 transition-colors hover:bg-[#1a1f28]`. Content: `p-4 flex flex-col justify-between` (or compact flex so value + trend sit in one row).

---

## Section 2 — Revenue & Profitability

- **Layout:** Two-column; left column 50%, right 50% (or 55/45).
- **Left column:** MRR Trend (12 months); Revenue by Account Tier.
- **Right column:** Gross Margin Trend; Labor % vs Target.
- **Charts:** Thin lines; no thick neon; minimal gridlines; subtle axis labels; legend top-right, small. **Height 280px** per chart.
- **Tailwind:** `grid grid-cols-1 lg:grid-cols-2 gap-4`; chart containers `h-[280px]`. Use existing chart tokens; stroke width 1–1.5; axis text `text-xs text-muted-foreground`.

---

## Section 3 — Operational Performance

- **Layout:** 4 tiles; `grid-cols-4`; **180px height** per tile.
- **Per tile:** KPI label · large numeric value · micro-trend (7d) · **status color dot** (no full-card color).
- **KPIs:** Crew Utilization % · Inspection Pass Rate · SLA Breaches · Open Issues.
- **Visual rule:** Healthy → subtle green indicator (dot or left border). Warning → muted amber. Danger → soft red. **Never color entire card.**

**Tailwind:** `min-h-[180px] border border-border rounded-lg bg-[#151A22] shadow-none p-4`; dot: `h-2 w-2 rounded-full bg-[hsl(var(--health-green))]` (or amber/red).

---

## Section 4 — Cash & Risk

- **Layout:** Two-column.
- **Left:** AR Aging (stacked horizontal bar).
- **Right:** Contracts expiring in 90 days; Client Health Decay Risk List (top 5).
- **Tone:** Slightly more alert-focused; small **“View All”** links aligned right.
- **Tailwind:** `grid grid-cols-1 lg:grid-cols-2 gap-4`; card headers with `flex justify-between items-center` and “View All” as `text-xs text-muted-foreground hover:text-foreground`.

---

## Section 5 — Sales Performance

- **Layout:** Four compact tiles in one row.
- **KPIs:** Pipeline Value · Close Rate · Avg Contract Size · Sales Cycle Length.
- **Tone:** Informational, neutral; no emotional color.
- **Tailwind:** Same card style as Section 3 but neutral borders; `grid-cols-4 gap-4`.

---

## Typography

| Element | Size | Weight | Notes |
|---------|------|--------|--------|
| **Section headers** | 18px | Semi-bold | `text-lg font-semibold` |
| **KPI values (primary)** | 36–42px | Bold | `text-3xl` or `text-4xl font-bold tabular-nums` |
| **Secondary labels** | 12px | Uppercase | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |
| **Subtext** | 13px | Regular | `text-[13px] text-muted-foreground` |
| **Avoid** | — | — | Too many font weights; stick to 2–3. |

---

## Color usage

- **Background:** `#0E1117` (page); `#151A22` (cards).
- **Borders:** 1px subtle; `border-border` or `border-white/5`.
- **State only:** Use `--health-green`, `--health-amber`, `--health-red` for:
  - Left border accent (4px)
  - Trend (up/down)
  - Status dot only
- **Do not:** Gradient fills; colored card backgrounds; neon chart lines; full-card state color.

---

## UX rules

- No scrolling inside cards (fix height or allow natural flow; avoid overflow scroll in small cards).
- No chart tooltips covering entire graph (compact tooltip or inline label).
- All drilldowns open **right-side drawer** (no full-page jump for detail).
- Maintain **vertical rhythm** (consistent section spacing 32px).

---

## Implementation notes (Tailwind-friendly)

1. **Section container:**  
   `kpi-command-center max-w-[1400px] mx-auto px-6 py-6 space-y-8`

2. **Executive snapshot row:**  
   `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`

3. **Snapshot card:**  
   `h-[140px] rounded-lg border border-border bg-[#151A22] shadow-none border-l-4 p-4 flex flex-col transition-colors hover:bg-[#1a1f28]`

4. **Snapshot label:**  
   `text-xs font-medium uppercase tracking-wider text-muted-foreground`

5. **Snapshot value:**  
   `text-3xl md:text-4xl font-bold tabular-nums text-foreground`

6. **State border (left 4px):**  
   `border-l-4 border-l-[hsl(var(--health-green))]` (or amber/red); default `border-l-border`

7. **Performance tile (Section 3):**  
   `min-h-[180px] rounded-lg border border-border bg-[#151A22] shadow-none p-4`; status dot only for state

8. **Charts:**  
   Container `h-[280px]`; thin strokes; minimal grid; legend top-right, small

9. **“View All” link:**  
   `text-xs text-muted-foreground hover:text-foreground ml-auto`

10. **Page background (dark):**  
    In CSS: `.dark .kpi-command-center { background-color: #0E1117; }` and `.dark .kpi-command-center .kpi-card-elevated { background-color: #151A22; border-color: rgba(255,255,255,0.06); }` with no box-shadow.

---

## Do / Don’t

| Do | Don’t |
|----|--------|
| Left 4px state accent only | Color entire card by state |
| 8px internal grid; 32px section spacing | Cramped or irregular spacing |
| Thin chart lines; minimal gridlines | Thick neon charts; busy legends |
| Right-side drawer for drilldown | Full-page navigation for detail |
| Uppercase small labels; bold large values | Too many font sizes/weights |
| Slight hover background shift | Hover animations, lift, shadow |
| Green/amber/red for state only | Gradients; decorative color |

---

This spec is implementation-ready. Apply to the KPI page wrapper and all KPI cards/charts so the Command Center feels like a serious performance intelligence system for operators.
