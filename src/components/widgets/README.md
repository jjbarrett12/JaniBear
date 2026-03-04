# Dashboard widgets

## Overview

- **ElevatedCard** (`@/components/ui/elevated-card`) – Reusable card style for KPI tiles, charts, and widgets (shadow, border, hover lift, optional accent glow).
- **WidgetFrame** – Wraps each widget: title row (title + drag handle in customize mode, collapse, menu with remove/reset size), content slot, collapsed state.
- **WidgetGrid** – Grid using `react-grid-layout`: drag/resize in customize mode, layout and collapsed state persisted (localStorage first; DB when available).

## Files created or changed

| File | Change |
|------|--------|
| `src/components/ui/elevated-card.tsx` | **New** – ElevatedCard component. |
| `src/app/globals.css` | **Updated** – `.elevated-card`, `.elevated-card:hover`, `.elevated-card-accent` utility classes. |
| `src/components/widgets/WidgetFrame.tsx` | **Updated** – Uses ElevatedCard; title row with drag (edit only), collapse, remove/reset (edit only); collapsed state. |
| `src/components/widgets/WidgetGrid.tsx` | **Updated** – Collapsed state + localStorage; “Customize layout” button; `widget-grid-edit-mode` class; reset size handler; passes collapse/reset to WidgetFrame. |
| `src/components/widgets/widgets-grid.css` | **Updated** – Drag scale 1.02, accent glow while dragging, dashed outline in edit mode. |
| `src/lib/widgets/layoutPersistence.ts` | **Updated** – `getLayoutFromLocalStorage` / `setLayoutToLocalStorage`; save reads localStorage and merges before write; fetch merges DB over local. |
| `src/lib/widgets/widget-collapsed-persistence.ts` | **New** – Load/save collapsed widget IDs to localStorage (key: `janibear_widget_collapsed_{orgId}_{userId}_{moduleKey}`). |
| `src/components/dashboard/MetricCard.tsx` | **Updated** – Uses ElevatedCard instead of Card for KPI tiles. |

## How to add a new widget

1. **Define the widget** in the right registry (e.g. `src/lib/widgets/registry/dashboard-widgets.tsx`):
   - `id`: unique string (e.g. `'my_widget'`).
   - `title`, `description`, `icon`: for list and frame header.
   - `component`: React component that receives `{ orgId: string }`.
   - `default`: `{ lg?, md?, sm? }` with `x`, `y`, `w`, `h` per breakpoint.
   - `minW`, `minH` (optional), `maxW`, `maxH` (optional).

2. **Implement the component** so it renders inside WidgetFrame (no need to wrap in a card; the frame is already an ElevatedCard). Use `ElevatedCard` or `MetricCard` only if you need an inner card.

3. **Register** by adding the definition to the registry array (e.g. `dashboardWidgetRegistry`). The grid will pick it up; default layout is used until the user customizes and saves.

## Customize mode

- **Customize layout** in the dashboard header toggles edit mode.
- In edit mode: drag handle (top-left of title row), resize handles (react-grid-layout), faint dashed outline on hover, lift + scale while dragging, **Add widget** / **Save layout** / **Reset to default**.
- Layout (x, y, w, h) and collapsed state are stored in localStorage (and in DB when save is used). TODO: optional DB sync for cross-device.
