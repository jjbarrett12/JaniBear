# Overview & Daily Command — $1B SaaS Design Spec

**Designer agent output.** Redesign for calm, readable, minimal, high-contrast-but-not-harsh. Distinct page identities: **Daily Command** = tactical / action; **Overview** = executive / trend + health.

---

## 1. Design goals

| Goal | Application |
|------|-------------|
| **Easy on the eyes** | Strong hierarchy (title small, value large, supporting text clear); softer dark surfaces; higher legibility; consistent spacing; subtle depth via border/shadow only. |
| **Distinct identities** | Daily = “what needs attention today”; Overview = “how the business is doing” (trends, health, risk). |
| **No metric duplication** | Daily shows **tactical today** metrics only; Overview shows **executive / period** metrics. Do not repeat the same 6 tiles on both pages. |

---

## 2. Shared tile component spec

Use one **MetricTile** (or equivalent) for both pages so spacing and typography stay consistent.

### 2.1 Container

| Token | Value | Tailwind / CSS |
|-------|--------|-----------------|
| Border radius | 12px | `rounded-xl` |
| Padding | 16–20px | `p-4` (16px) or `p-5` (20px) |
| Border | 1px, subtle | `border border-border` (e.g. `rgba(255,255,255,0.06)` in dark) |
| Shadow | Soft, no heavy drop | `shadow-sm` or custom `0 1px 2px rgba(0,0,0,0.04)` |
| Background | Slightly lighter than page | See Color section below. |

### 2.2 Typography

| Element | Size | Weight | Color | Notes |
|---------|------|--------|--------|--------|
| **Title (label)** | 12–13px | Medium (500) | Muted but readable | `text-xs` or `text-[13px] font-medium text-muted-foreground`; avoid thin (300/400) on dark. |
| **Value** | 24–32px | Semibold (600) | Primary (near-white in dark) | `text-2xl` or `text-3xl font-semibold tabular-nums text-foreground`. |
| **Subtext** | 12–13px | Regular | Muted | `text-xs` or `text-[13px] text-muted-foreground`. |
| **Icon** | 18–20px | — | Muted | `h-[18px] w-[18px]` or `h-5 w-5`; `text-muted-foreground`. |

### 2.3 Status (badges / pills)

- **Good** | **Warn** | **Bad**: Small pill badges; **do not use saturated neon**. Prefer muted green / amber / red (e.g. same health tokens as KPI spec).
- Placement: Top-right of tile or below value; do not color the entire tile.

### 2.4 States

| State | Behavior |
|-------|----------|
| **Default** | Border subtle; background card tone. |
| **Hover** | Border slightly brighter; very slight background lift (e.g. 2–4% lighter). No scale or heavy shadow. |
| **Focus** | Visible focus ring (accessibility). |
| **Loading** | Skeleton with **same padding and structure** as filled tile (label line, value block, optional subtext line). |
| **Empty** | Value = “—” with optional tooltip or help text (“No data for this period”). |

### 2.5 Optional tile extras

- **Delta line**: e.g. “+2 vs yesterday” — small, one line; do not clutter.
- **Sparkline / trend placeholder**: Tiny (e.g. 48×24px) for Overview only; thin line, no thick neon.

---

## 3. Color & contrast (dark theme)

### 3.1 Surfaces (layered, not pure black)

| Layer | Purpose | Hex / token | Notes |
|-------|---------|-------------|--------|
| **Page background** | Main canvas | Very dark neutral (e.g. `#0E1117` or `zinc-950`) | Not `#000`. |
| **Card / tile background** | Slightly lighter than page | e.g. `#151A22` or `zinc-900/80` | Subtle lift. |
| **Border** | Separation | Subtle neutral | e.g. `rgba(255,255,255,0.06)` or `border-border`. |

### 3.2 Text

| Use | Contrast | Notes |
|-----|----------|--------|
| **Primary text** | Near-white | High legibility; avoid thin font weights. |
| **Secondary / labels** | Mid grey that **still passes contrast** (e.g. WCAG AA) | Prefer `medium` for labels; avoid very low-contrast grey on black. |
| **Muted / tertiary** | Slightly lower but readable | For timestamps, “vs yesterday”, etc. |

### 3.3 Accent

- **One accent** for status and primary CTAs (e.g. primary button).
- **No** heavy gradients; no multiple competing accent colors across the page.

---

## 4. Daily Command — Layout (tactical)

**Identity:** “What needs attention today.” Action-driven; clear CTAs.

### 4.1 Wireframe (sections top to bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│   Greeting + "Last updated 2m ago"     [Assign crews] (primary)  │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 1: Today metrics grid (6–8 tiles)                       │
│   [Tile] [Tile] [Tile] [Tile]  …   consistent size, status chip │
│   Optional: small delta line ("+2 vs yesterday") — minimal     │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 2: Needs attention (priority list)                   │
│   Card list: severity badge + left border accent                │
│   Row: Account / Site | issue | due time | [CTA button]          │
│   Scannable; no paragraphs                                       │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 3: Today’s schedule (table)                             │
│   Sticky header; row hover highlight                            │
│   Empty: friendly message + CTA button                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Section details

- **Header**
  - Greeting (e.g. “Good morning, [Name]”) + short subtitle.
  - “Last updated 2m ago” (or similar) — small, muted.
  - Primary action: e.g. “Assign crews” or “Start inspections” (one prominent button).

- **Section 1 — Today metrics**
  - 6–8 tiles; **tactical only**: buildings scheduled, projected revenue today, active crews/capacity, utilization %, hiring pressure, unassigned, etc.
  - Same **MetricTile** spec (radius, padding, title/value/subtext, status pill).
  - Status chips (good/warn/bad) only where critical.

- **Section 2 — Needs attention**
  - Card list (or compact cards).
  - Each row: **Account / Site** | **Issue** | **Due time** | **CTA** (e.g. “Assign”, “Review”).
  - Severity: badge + **left border accent** (green/amber/red); do not color full card.

- **Section 3 — Today’s schedule**
  - Clean table: Account (Location), Service type, Crew, Start time (or similar).
  - Sticky header; row hover highlight.
  - Empty state: short friendly message + one CTA (e.g. “Assign buildings”).

---

## 5. Overview — Layout (executive)

**Identity:** “How the business is doing.” Trend + health; timeframe-driven.

### 5.1 Wireframe (sections top to bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                          │
│   "Overview"                    [30d] [90d] [YTD] (timeframe)    │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 1: Business health tiles (6–8 tiles)                     │
│   MRR | Margin | Retention | Pipeline | Utilization avg |        │
│   AR summary | Accounts at risk                                  │
│   Optional: tiny sparkline placeholder or "trend" delta pill     │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 2: Trends strip                                         │
│   [Trend card] [Trend card] [Trend card]                         │
│   Compact: current value, delta, timeframe; mini visual OK       │
├─────────────────────────────────────────────────────────────────┤
│ SECTION 3: Risk + finance (2-column)                            │
│   [Operational risk 30d]     [Financial health]                  │
│   Counts + deltas            AR buckets, simple horizontal bars │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Section details

- **Header**
  - Title: “Overview”.
  - Timeframe selector: 30d / 90d / YTD (or similar). Single control; no extra clutter.

- **Section 1 — Business health tiles**
  - **Different from Daily:** MRR, Margin %, Retention, Pipeline, Utilization (avg over period), AR summary, Accounts at risk.
  - Same **MetricTile** spec.
  - Optional: tiny sparkline (placeholder) or small “trend” delta pill.

- **Section 2 — Trends strip**
  - 3 compact trend cards.
  - Each: current value, delta, timeframe; optional mini visual (no heavy charts).

- **Section 3 — Risk + finance**
  - **Left:** Operational risk (e.g. 30d): counts + deltas.
  - **Right:** Financial health: AR buckets with simple horizontal bars.
  - Can reuse or adapt existing dashboard widgets (Risk, AR) with the new tile/surface styling.

---

## 6. Empty & loading states

### 6.1 Loading

- **Tiles:** Skeleton with **same padding and layout** as real tile (label line, value block, optional subtext).
- **Tables/lists:** Row skeletons or shimmer; same column structure as filled state.
- No spinners in the tile itself; optional small loading indicator in section header if needed.

### 6.2 Empty

- **Tile:** Value = “—” (em dash); optional tooltip or help text (“No data for this period”).
- **Needs attention:** “Nothing needs attention right now” + optional secondary CTA.
- **Schedule table:** Short friendly line + one primary CTA (e.g. “Assign buildings to today’s schedule”).

All empty/loading states should look **premium** (aligned, spaced, same component footprint).

---

## 7. Interaction notes

| Element | Hover | Focus | Clickable |
|---------|--------|--------|-----------|
| **Metric tile** | Border slightly brighter; background lift | Focus ring | Optional: link to detail or drawer (e.g. “View breakdown”). |
| **Needs-attention row** | Row highlight | Focus ring | Yes; CTA and/or row click to open drawer. |
| **Schedule row** | Row highlight | Focus ring | Optional row click for detail. |
| **Badges** | No change or very subtle | Visible focus if interactive | Status only unless badge is a filter/action. |

- **Drilldown:** Prefer **right-side drawer** for detail (consistent with KPI spec); avoid full-page jump where possible.
- **Primary actions:** One clear primary button per section or header; rest secondary/ghost.

---

## 8. Do / Don’t (readability & polish)

| Do | Don’t |
|----|--------|
| Strong hierarchy: small label, large value, clear subtext | Thin muted text on heavy black slab |
| Softer dark surfaces (page vs card distinction) | Pure black (#000) everywhere |
| Medium weight for labels on dark | Very low-contrast grey on black |
| Subtle border + soft shadow for depth | Loud gradients or neon borders |
| One accent for status + primary CTAs | Multiple competing accent colors |
| Same tile spec on both pages | Different tile styles on Daily vs Overview |
| Daily = tactical today; Overview = executive period | Repeat the same 6 metrics on both pages |
| Empty state: “—” + tooltip; loading: skeleton same layout | Blank tiles or mismatched skeleton layout |

---

## 9. Builder notes (implementation)

1. **Introduce or refactor to a single MetricTile** used on both Overview and Daily Command (shared padding, radius, typography, states).
2. **Daily Command:** Build/refactor to three sections: (1) Today metrics grid, (2) Needs attention list, (3) Today’s schedule table. Header with greeting + “Last updated” + primary action.
3. **Overview:** Build/refactor to three sections: (1) Business health tiles (executive KPIs), (2) Trends strip, (3) Risk + finance two-column. Header with “Overview” + timeframe selector. **Do not** duplicate Daily’s “today” tiles here.
4. **Data:** Daily uses existing `getDailyCommand` (and related) for today metrics and schedule; Overview uses `getCommandCenterData` (and any period aggregates) for MRR, risk, AR, pipeline, etc. Map widgets/cards to the new section layout and tile spec.
5. **Theme:** Apply the same dark surface tokens as KPI Command Center where appropriate (e.g. page `#0E1117`, card `#151A22`, border subtle, no heavy shadow).
6. **Hover:** Implement border + background lift only; no scale or animation unless minimal (e.g. 150ms transition).
7. **Empty/loading:** Use the same MetricTile skeleton and empty “—” pattern everywhere for consistency.

---

*Spec complete. Use this document as the single source of truth for Overview and Daily Command visual and interaction design.*
