# Territory Map Heatmap (Sales + Ops)

## Provider and approach

- **Map provider**: **Leaflet** (`react-leaflet`) with OSM tiles.
- **Heatmap implementation**: No native heatmap in Leaflet; **grid-based overlay** (no new dependencies).
  - Visible map bounds are divided into a fixed grid (48×36 cells).
  - Point weights are summed per cell and normalized.
  - A canvas overlay draws semi-transparent ellipses per cell; color and opacity encode weight.
  - Bounds updates are throttled (200 ms) on pan/zoom to avoid thrash.

## Data contract

- **Sales heatmap**: `LeadPoint[]` — `id`, `lat`, `lng`, `score`, `priority`, `status`, `weight`.
  - Weight from `src/lib/maps/weights.ts`: `salesLeadWeight(score, priority, status)`.
- **Ops heatmap**: `AccountPoint[]` — `id`, `lat`, `lng`, `riskScore`, `weight`.
  - Risk from `opsAccountRiskScore(health_status, inspection, tickets, missed_shifts)`; weight = riskScore.

Data is returned by `getTerritoryMapData()` as `heatmapLeads` and `heatmapAccounts`.

## UI

- **Layer chips**: "Sales Heatmap" (Sales mode only), "Ops Heatmap" (Ops mode only). Disabled chip shows tooltip to switch mode.
- **Heatmap settings** (gear):
  - **Intensity**: low / med / high → opacity (0.45 / 0.65 / 0.85) and cell radius multiplier (0.8 / 1 / 1.2).
  - **Threshold**: slider 0–100; only points with `weight >= threshold` are included (default 25).
  - **Show pins on top**: when on, heatmap is drawn below markers; when off, heatmap is drawn on top.

## Settings mapping

| Setting    | Effect |
|-----------|--------|
| Intensity low  | Opacity 0.45, smaller cell radius |
| Intensity med  | Opacity 0.65, default radius |
| Intensity high | Opacity 0.85, larger cell radius |
| Threshold      | Min weight for a point to be included (0–100) |
| Show pins on top | Heatmap layer order: below pins (true) or above pins (false) |

## Permissions

- Same as map: `maps.read` required.
- Sales heatmap uses lead data → effective visibility follows `lead.read` (data already filtered by org).
- Ops heatmap uses account/facility data → effective visibility follows `ops.read` / `accounts.read`.
- Cubs: no lead data → Sales heatmap empty if Cub-scoped; Ops heatmap respects account visibility.

## Performance

- Bounds filtering: only points in view are used for the grid (see `filterPointsByBounds`).
- Throttled bounds updates (200 ms) on move/moveend.
- Grid and canvas redraw are memoized / effect-scoped; no per-frame work.
- Target: smooth with 500–2000 points in view.
