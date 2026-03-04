# Benchmark UI — Layout, Copy, and Chart Card Designs

## Overview

The Benchmark UI lets organizations compare their key metrics to **anonymized peer averages**. Peer group is selected by **vertical**, **company size**, and (optional) **region**. Access is gated by **opt-in**; non‑opted-in users see an **upsell panel**.

---

## 1. Page layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Benchmarks                                                       │
│  Compare your key metrics to anonymized peer averages.             │
│  Choose your peer group below.                                   │
├─────────────────────────────────────────────────────────────────┤
│  [Peer group card]                                               │
│  Peer group                                                      │
│  Metrics are averaged across organizations in this group.         │
│  Your data is never shown to others.                             │
│                                                                   │
│  Vertical ▼    Company size ▼    Region ▼ (optional / Coming soon)│
├─────────────────────────────────────────────────────────────────┤
│  Your company vs peers                                           │
│  Peer data is anonymized and aggregated. No individual company   │
│  is ever identified. Your metrics are shown only to you.         │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Close    │ │Inspection │ │ Gross    │ │ Cost per │           │
│  │ rate 90d │ │ score 90d │ │ margin   │ │ sq ft    │           │
│  │ You / Peer│ │ You / Peer│ │ You/Peer │ │ You/Peer │           │
│  │ ████ bar │ │ ████ bar │ │ ████ bar │ │ ████ bar │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

**When not opted in:** Replace the peer group card and “Your company vs peers” section with a single **upsell panel** (see §4).

---

## 2. Peer group selector

- **Placement:** First content card below the page header.
- **Fields (vertical stack on small screens; 2–3 columns on larger):**
  - **Vertical:** Dropdown — All verticals | Medical | Industrial | Education | Retail | Other.
  - **Company size:** Dropdown — All sizes | 1–10 | 11–50 | 51–200 | 201+.
  - **Region:** Optional dropdown — “All regions” or “Coming soon” (disabled until backend supports it).
- **Copy:** Use `PEER_GROUP_SELECTOR_LABEL`, `PEER_GROUP_SELECTOR_DESCRIPTION`, `VERTICAL_LABEL`, `COMPANY_SIZE_LABEL`, `REGION_LABEL`, `REGION_COMING_SOON` from `src/lib/benchmark-copy.ts`.

---

## 3. “Your company vs peers” + privacy

- **Heading:** “Your company vs peers”
- **Privacy line:** “Peer data is anonymized and aggregated. No individual company is ever identified. Your metrics are shown only to you.”
- **Chart cards:** Four metric cards in a responsive grid (e.g. 2×2 on tablet, 4 columns on desktop). Each card shows:
  - Metric name (e.g. “Close rate (90d)”).
  - Optional “Based on N peer orgs”.
  - **Your company** value (or “No data yet”).
  - **Peer average** value (or “No peer data for this group”).
  - Two horizontal bars: one for “You”, one for “Peer avg”, scaled to a common max so comparison is visual.

---

## 4. Chart card design (per metric)

- **Structure:** Card with header (metric name + optional peer count), then:
  - Two labeled values: “Your company” and “Peer average”.
  - Two stacked horizontal bars (You on top, Peer avg below), same scale, with value repeated at end of row for clarity.
- **Metrics:** Close rate (90d), Inspection score (90d), Gross margin, Cost per sq ft.
- **Formatting:** Close rate & gross margin as `%` (0–100); inspection score as number; cost per sq ft as `$X.XX`.
- **Empty states:** “No data yet” for your metric; “No peer data for this group” when no aggregates for selected peer group.

---

## 5. Upsell panel (not opted in)

- **Placement:** Replace main content when `benchmarking_opt_in === false`.
- **Layout:** Single card with icon (e.g. BarChart3), title, short description, bullet list, and CTA.
- **Copy:**
  - Title: “See how you compare”
  - Description: “Opt in to benchmarking to compare your close rate, inspection scores, and more against anonymized peers. Your data is only ever used in aggregates—no one else can see your numbers.”
  - Bullets: Anonymized peer averages by vertical/size; your metrics stay private; improve with clear benchmarks.
  - CTA: “Enable benchmarking” (admins) or “Admins can turn this on in Organization settings” (non‑admins).
- **Admin CTA:** Link to `/app/settings` (where BenchmarkingSettings lives). Non‑admins see subtext only.

---

## 6. Copy constants reference

All strings live in `src/lib/benchmark-copy.ts`:

| Constant | Purpose |
|----------|--------|
| `BENCHMARK_PAGE_TITLE` | Page title |
| `BENCHMARK_PAGE_DESCRIPTION` | Subtitle under title |
| `PEER_GROUP_SELECTOR_*` | Peer group card labels/description |
| `VERTICAL_LABEL`, `COMPANY_SIZE_LABEL`, `REGION_LABEL` | Selector field labels |
| `YOUR_VS_PEERS_HEADING`, `YOUR_VS_PEERS_PRIVACY` | Section heading and privacy line |
| `YOUR_COMPANY_LABEL`, `PEER_AVG_LABEL` | Chart card column labels |
| `METRIC_*` | Per‑metric names (close rate, inspection score, etc.) |
| `NO_DATA_YOU`, `NO_DATA_PEERS` | Empty state messages |
| `BENCHMARK_UPSELL_*` | Upsell panel title, description, bullets, CTA |

---

## 7. Data & permissions

- **Opt-in:** `organizations.benchmarking_opt_in`. Toggled in **Settings → Benchmarking** (BenchmarkingSettings).
- **Peer group dimensions:** `company_size_bucket`, `vertical` on `organizations`; aggregates in `benchmark_aggregates` by `(company_size_bucket, vertical)`. Region is optional and not yet in schema.
- **Your metrics:** From `getOrgBenchmarkMetrics(orgId)` (close rate, inspection score, etc.). Shown only to the org.
- **Peer data:** From `getBenchmarkAggregates()`; no per-org rows, only pre-aggregated averages.

---

## 8. Navigation

- **Benchmarks** appears in the Executive section (e.g. after KPI Dashboard), label key `navBenchmarks`, route `/app/benchmarks`.
