# Executive Mode — Page Layout & Component Specs

Executive Mode is a **single-screen-first** view: ultra-clean typography, big KPI cards with sparkline trends, and **one scroll maximum**. All “Details” drilldowns open in **drawers** (no full-page navigation).

---

## 1. Page layout

### 1.1 Viewport constraint

- **Target:** Content fits in one viewport on desktop (e.g. 1440×900) with at most **one vertical scroll** to see the bottom.
- **Structure:**
  - **Sticky header:** Page title + timeframe toggle only. No breadcrumbs; minimal chrome.
  - **Above the fold:** One row of 4–6 **big KPI cards** (primary metrics). Optional thin **attention strip** (alerts count + 1–2 lines) only if alerts exist.
  - **Below the fold (single scroll):** Optional second row — either 2–4 secondary KPI cards **or** one compact “Focus” list (e.g. top 5 items). No long tables or infinite scroll on the main canvas.

### 1.2 Layout sketch

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Sticky]  Executive Summary                    30d │ 90d │ YTD        │
├─────────────────────────────────────────────────────────────────────────┤
│  [Optional]  ⚠ 3 need attention · 2 accounts below threshold · 1 SLA     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Active      │ │ MRR         │ │ Net Rev     │ │ Retention   │  ...  │
│  │ Contracts   │ │ $312,400    │ │ Growth 2.4% │ │ 94%         │      │
│  │ 47    ↑3.2% │ │ ↑2.1%       │ │ ↑0.8%      │ │ ↑0.5%       │      │
│  │ ▁▂▃▄▅▆▇█   │ │ ▁▂▃▄▅▆▇█   │ │ ▁▂▃▄▅▆▇   │ │ ▁▂▃▄▅▆▇   │      │
│  │ Details →   │ │ Details →   │ │ Details →   │ │ Details →   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────────────────────┤
│  [Optional second row — 2–4 cards or one “Focus” list]                  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Drawers:** Open from the right when user clicks “Details” (or the card). No route change; overlay + slide-over panel only.

---

## 2. Typography

- **Page title:** One line only. e.g. `text-2xl` / `text-3xl` font-heading, font-bold, text-foreground. No subtitle on the same line; optional single line of description below in muted, smaller size.
- **KPI card:**
  - **Label:** Uppercase, tracking-wide, single line, truncated. e.g. `text-[11px]` or `text-xs`, font-medium, text-muted-foreground.
  - **Value:** Dominant. e.g. `text-3xl` or `text-4xl` font-heading, font-bold, tabular-nums, text-foreground.
  - **Delta:** Inline with or just below value. e.g. `text-sm` font-medium, green/red by sign. Include a short context (e.g. “vs prior period”) in muted, smaller.
  - **Target/benchmark:** One line below delta. e.g. `text-xs` text-muted-foreground.
- **Attention strip:** Short phrase only. e.g. `text-sm` with one icon; no paragraphs.
- **Drawer title:** e.g. `text-lg` font-semibold. Body copy inside drawer can use normal body styles; keep sections scannable (headings + short lists/tables).

**Principle:** Few font sizes, high contrast for the number, everything else secondary. No decorative type; one font family (existing font-heading / sans).

---

## 3. Big KPI card (Executive Mode)

### 3.1 Purpose

Single-metric card: current value, trend vs prior period, optional target, and a **sparkline**. Tapping the card or a “Details” affordance opens the **detail drawer** for that metric.

### 3.2 Specs

| Element        | Spec |
|----------------|------|
| **Container**  | Card, rounded (e.g. `rounded-2xl`), border, min height ~160px. Left border accent by health (green/amber/red/neutral). No heavy shadow; subtle hover shadow OK. |
| **Label**      | One line, uppercase, tracking-wide, muted, truncate with ellipsis. |
| **Value**      | Large (e.g. 2xl–4xl), bold, tabular-nums. Currency/percent formatted (e.g. `$312,400`, `94%`). |
| **Delta**      | Inline or below value: “↑ 2.1%” or “↓ 1.2%” with small trend icon; color by direction. Optional “(vs prior period)” in muted. |
| **Target**     | Single line below, e.g. “Target: 95%” or “Target: $320k”. Muted, small. |
| **Sparkline**  | Right-aligned or bottom-right; same width/height for all cards (e.g. 80×32 or 100×36). No axes, no legend; line only. Stroke color can reflect health. |
| **Details CTA**| “Details” link or chevron at bottom of card; entire card can be clickable. Opens drawer. |

### 3.3 Data contract (align with existing)

Reuse or extend `ExecutiveCardData` from `@/lib/kpi-metrics`:

- `id`, `label`, `value`, `delta`, `deltaLabel`, `targetBenchmark`, `sparkline`, `health`
- Optional: `detailHref` or `onDetailClick` for drawer (no navigation if using drawer only).

### 3.4 Responsive

- **Desktop:** 4–6 cards per row (e.g. grid-cols-4 or grid-cols-6).
- **Tablet:** 2–3 per row.
- **Mobile:** 1–2 per row; still one scroll max (fewer cards or smaller value font).

---

## 4. Sparkline

- **Role:** Show trend at a glance; no exact readout required.
- **Spec:** Small single-line chart, no axes, no labels. Last point = current period.
- **Size:** Consistent across cards (e.g. 80×32px or 100×36px SVG).
- **Data:** Array of numbers (e.g. 12 points for 12 periods). Normalize to min–max within the series for vertical scale.
- **Style:** Stroke only; stroke width ~1.5; line join round. Color: health (green/amber/red) or neutral muted.
- **A11y:** `aria-hidden` on the SVG; ensure card label/value give the same information in text.

Existing `SparklineMini` in `executive-snapshot-card.tsx` and sparkline in `kpi-metric-tile.tsx` can be reused or scaled up for the larger card size.

---

## 5. Details drilldown — drawer

### 5.1 When to open

- User clicks “Details” (or the whole card) on a big KPI card.
- Optional: from the attention strip, “3 need attention” could open a drawer listing those items (with links to full pages if needed later).

### 5.2 Drawer behavior

- **Pattern:** Slide-over from the **right**. Overlay dims background; Escape or overlay click closes.
- **Width:** e.g. `max-w-md` to `max-w-lg` (or full width on small viewports). Use existing `SlideOverDrawer` from `@/components/enterprise/slide-over-drawer`.
- **Content:** Scoped to the **one metric** (or one alert list):
  - **Title:** Metric name (e.g. “Active Contracts” or “MRR”).
  - **Body:** Short breakdown (e.g. list of contracts, or MRR by segment), small table, or time-series mini chart. No full-page app chrome inside the drawer.
  - **Footer (optional):** “View full report” link to existing KPI/Financial Health page if needed; primary action is “Close”.

### 5.3 Component spec: Metric detail drawer

| Prop / slot | Spec |
|-------------|------|
| **Open**    | Boolean. |
| **OnClose** | Callback (no route change). |
| **Title**   | String (metric name). |
| **Children**| React node: breakdown content. |
| **MetricId**| Optional; for loading the right breakdown (e.g. `active_contracts`, `mrr`). |

Content per metric is defined by data/API (e.g. “Active Contracts” = list or table of contracts; “MRR” = breakdown by segment or month). Drawer does not fetch the list itself; parent passes content or a content-loader.

### 5.4 Attention-strip drawer (optional)

If the strip is clickable:

- **Title:** e.g. “Attention required”.
- **Content:** List of alerts (label + count or short description). Each row can link to existing app page (e.g. accounts, issues) or open another drawer. Keep list short (e.g. top 5–10).

---

## 6. Attention strip (optional)

- **Placement:** Between page header and KPI cards; full width, one row.
- **Visibility:** Only when there is at least one attention item (e.g. count > 0).
- **Content:** Icon + one short sentence (e.g. “3 need attention · 2 accounts below threshold · 1 SLA at risk”). No long text.
- **Interaction:** Optional “See all” or strip click → open drawer with list (see 5.4).
- **Style:** Low emphasis (muted background, border); not a full banner. Doesn’t break “one scroll” if kept to one line.

Existing `AttentionRequiredStrip` / `getAttentionAlerts()` can feed this; strip UI should stay minimal.

---

## 7. Summary: component list

| Component            | Purpose |
|----------------------|--------|
| **ExecutiveModePage**| Layout wrapper: sticky header (title + timeframe), optional attention strip, grid of big KPI cards, optional second row. Manages drawer open state (which metric id). |
| **ExecutiveBigKpiCard** | Single big KPI card: label, value, delta, target, sparkline, “Details” CTA. Click opens detail drawer. |
| **ExecutiveSparkline**   | Sparkline only (or reuse/extend existing SparklineMini). |
| **ExecutiveDetailDrawer**| Wrapper around `SlideOverDrawer`; title + slot for metric-specific content. |
| **ExecutiveAttentionStrip** | Optional one-line strip; optional click → drawer. |

**Data:** Reuse `getExecutiveSnapshot(timeframe)` and `ExecutiveCardData`; add optional `onDetailClick(cardId)` and drawer content per `card.id`.

---

## 8. One-scroll rule

- **Measure:** On a reference viewport (e.g. 1440×900), the main page content (header + strip + 6 cards + optional second row) fits with at most **one vertical scroll**.
- **How:** Limit rows (e.g. 1 primary row of 4–6 cards; 1 optional second row). No long tables, no “Load more” on the canvas. Put lists/tables inside **drawers** or behind “View full report”.
- **Mobile:** Same idea: fewer cards per row or slightly smaller cards so one scroll still suffices; drawers remain the drilldown pattern.

This keeps Executive Mode as a true “glance” view with details on demand in drawers.
