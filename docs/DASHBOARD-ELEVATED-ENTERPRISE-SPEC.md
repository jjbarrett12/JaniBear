# Dashboard Elevated Enterprise — Design Spec

**UI/UX Designer output.** Upgrade card styling to an “Elevated Enterprise” system and define UX for movable/customizable widgets. No full redesign; no new nav; existing layout and color customization preserved.

---

## Constraints

- Keep existing layout and color customization system (primary/secondary, org branding).
- No full redesign; no new navigation.
- No glass blur as a default card treatment.
- Neon/glow is **subtle** and **meaningful only**: selected state, drag state, active filters, badges, alert status. Never decorative.

---

## 1. Visual hierarchy (surface layers)

Define how surfaces stack so cards feel “above” the page without competing.

| Layer | Purpose | Token / guidance |
|-------|---------|-------------------|
| **Page surface** | Base canvas (dashboard background) | Dark matte; one step above pure black. e.g. `#0E1117` or `zinc-950`. No texture. |
| **Card surface** | Elevated panel (widget container) | Slightly lighter than page: dark matte, e.g. `#151A22` or `zinc-900/95`. Clearly “on top” of page. |
| **Card content** | Text, charts, controls inside card | Primary text near-white; secondary muted; no extra surface layers inside the card unless nested (e.g. table row hover). |
| **Floating UI** | Modals, dropdowns, tooltips | Above cards; can use same card surface token + stronger shadow. |

**Rule:** Cards sit on the page surface. No more than two distinct background levels in one view (page + card). Nested lists/tables use row hover only, not new panels.

---

## 2. Elevated Card system

### 2.1 Reusable Elevated Card style

A single **Elevated Card** style is used for all dashboard widgets (KPI tiles, chart cards, list cards, etc.).

| Property | Value | Notes |
|----------|--------|--------|
| **Background** | Dark matte panel slightly above page surface | e.g. `#151A22` or theme token; not pure black. No gradient unless user accent is applied in “Enhanced Glow” mode. |
| **Border** | 1px solid | Subtle stroke: `rgba(255,255,255,0.06)` or `zinc-700/80`. Same on all sides. |
| **Shadow stack** | Two layers | (1) Deep ambient: large, very soft, low opacity (e.g. `0 4px 24px rgba(0,0,0,0.2)`). (2) Soft lift: smaller offset, subtle (e.g. `0 2px 8px rgba(0,0,0,0.12)`). Combined = premium, not flat. |
| **Radius** | 16–18px | `rounded-2xl` (16px) or 18px custom. Consistent for all widget cards. |
| **Padding** | Content-dependent | Min 16px; standard 20–24px for card body. Header padding 16–20px. |

No glass/blur by default. No neon on the card container in default state.

### 2.2 Card states (exact behavior)

| State | Trigger | Visual behavior |
|-------|--------|------------------|
| **Default** | Initial / not hovered, not selected, not dragging | Calm, clean: base background, 1px border, shadow stack. No glow. |
| **Hover** | Pointer over card (normal mode only; in customize mode see below) | Slight lift: `translateY(-2px)`. Border brightens slightly (e.g. `rgba(255,255,255,0.1)`). Shadow deepens (same shape, slightly larger spread / darker). Transition 150–200ms ease. |
| **Selected** | User accent “selected” (e.g. clicked for context or “selected widget” in customize) | Very subtle accent: outline or 1–2px ring derived from **user accent** (primary color). Optional very soft glow (e.g. `0 0 0 1px accent` + `0 0 12px accent/0.15`). Never full card fill. |
| **Dragging** | Widget is being dragged in customize mode | Lift + scale: `translateY(-2px)` and `scale(1.02)`. Accent outline/ring (user accent). Shadow elevated (stronger than hover). Cursor: grabbing. Dragged card has higher z-index. |
| **Alert state** | Widget has alert/warning (e.g. KPI breach, attention needed) | **Badge or indicator only** glows (e.g. small dot or “!” in header). **Do not** glow or color the whole card. Badge uses semantic color (amber/red) or user accent if “Enhanced Glow” is on. |

**Rules:**  
- Hover and drag states do not apply in customize mode to the same extent: in customize, hover shows resize/drag UI; drag state applies only to the widget being dragged.  
- All transitions: 150–200ms ease. No bouncy or long animations.

---

## 3. Customize mode UX

### 3.1 Entry / exit

- **Toggle:** A “Customize Layout” (or “Edit layout”) control in the dashboard header. One click = enter customize mode; again = exit. No nested “edit” inside each widget.
- **Persistence:** On exit, save layout (grid positions/sizes) via existing persistence (e.g. user prefs or DB). No “Cancel” required; optional “Reset to default” in a menu or footer when in customize mode.
- **Normal mode:** All customize-only UI hidden; widgets locked (no drag/resize).

### 3.2 In customize mode — per widget

| Control | When visible | Behavior |
|---------|-----------------------------|----------|
| **Drag handle** | Always in customize mode | Top-right of widget **header**. Icon: drag (e.g. grip vertical). Entire header can be drag handle, or a dedicated small area. Cursor: grab; dragging: grabbing. |
| **Resize handles** | On hover over widget (in customize mode) | Small handles at corners or edges (per grid library: e.g. bottom-right, or all four corners). Appear on widget hover; subtle (e.g. 6–8px hit area). Cursor: resize (e.g. nwse-resize on corner). |
| **Remove** | In customize mode | Control in header (e.g. “Remove” or X). Removes widget from grid; does not delete definition (user can re-add from a “Add widget” or “Restore” list if you support it). |
| **Collapse** | Optional, can be always or only in customize | If supported: collapse/expand widget body; header stays. Icon in header. |

### 3.3 Grid behavior

- **Snap:** Widgets snap to grid (e.g. 1×1 units). Snap on drop and during resize.
- **Reflow:** When a widget is moved or removed, others reflow smoothly (no jump). Use CSS grid or react-grid-layout with `compactType` (or equivalent) for reflow.
- **Placement:** No overlapping. Minimum size per widget type defined (e.g. 1×1 for small KPI; 2×1 for charts).

### 3.4 In normal mode

- No drag handle, no resize handles, no remove/customize-only controls.
- Hover state: only the generic card hover (lift + border + shadow). No neon unless “Enhanced Glow” is on and widget is selected or has alert.

---

## 4. Widget Frame (standard header)

Every dashboard widget is wrapped in a **Widget Frame** that provides a consistent header and slot for body.

| Area | Content | Rules |
|------|---------|--------|
| **Left** | Title (required) | Single line; font weight 600 (semibold); size 14–16px. Truncate with tooltip if long. |
| **Optional** | Subtitle | Muted; smaller (12–13px); below or beside title. One line preferred. |
| **Right** | Actions | **Edit mode only:** Drag handle, Remove (and optionally Collapse). **Always (if applicable):** Collapse/expand only if widget supports it. Optional: filter or “more” menu. Keep to 2–3 actions max. |
| **Spacing** | Header padding | 16–20px vertical; 16–24px horizontal; same as card padding. |

**Minimal and consistent:** Same header height and alignment across all widget types. Body area below header; no extra border between header and body unless design uses a 1px divider (subtle).

---

## 5. Neon / glow (controlled)

### 5.1 “Enhanced Glow Mode” toggle

- **Location:** Dashboard header or settings (e.g. near “Customize Layout” or in a “Display” dropdown).
- **Default:** Off. When off, no glow on cards; only subtle borders and shadows as defined.
- **When on:** Glow is allowed only for the following, and **only** in the user’s **accent color** (primary/brand from existing color customization):

  - Active filters (e.g. pill or chip showing active filter)
  - Badges (e.g. count badges, status badges)
  - Selected widget (selected state outline/glow)
  - Alert/attention state (badge or indicator only, not whole card)

### 5.2 Glow parameters (when Enhanced Glow is on)

- **Color:** Always derived from user accent (primary). No fixed neon yellow/blue unless that is the user’s accent.
- **Intensity:** Subtle. E.g. `box-shadow: 0 0 12px accent/0.2` for selected; `0 0 8px accent/0.25` for badge. Never full saturation or thick rings.
- **Where:** Outline/ring or small badge only. Never full card background glow.

---

## 6. Component inventory

Implement these as reusable building blocks; existing layout and color system stay.

| Component | Responsibility |
|-----------|----------------|
| **ElevatedCard** | Container with: dark matte background, 1px border, shadow stack, 16–18px radius, and state styles (default, hover, selected, dragging, alert). Composable: no header; just surface + states. |
| **WidgetFrame** | Wraps widget content: standard header (title, optional subtitle, actions slot) + body slot. Uses ElevatedCard internally or composes it. Passes through “customize mode” and “selected” to show drag handle, resize, remove, and state. |
| **DashboardGrid** | Grid container for widgets. Handles: layout (columns/rows), customize mode (drag-and-drop, resize), snap, reflow, persist layout. Uses WidgetFrame (or equivalent) for each widget. Does not define card visual style; that is ElevatedCard. |

**Data / state:**  
- Customize mode: boolean (or equivalent) from header toggle.  
- Selected widget: optional ID when user selects a widget (e.g. for “Remove” or context).  
- Layout: list of widget IDs + positions + sizes; persisted per user/org.

---

## 7. Spacing and typography (KPI tiles and charts)

### 7.1 KPI tiles (numbers + label)

- **Card:** ElevatedCard; padding 16–20px.
- **Label:** 12–13px; medium weight; muted color (e.g. `muted-foreground`). Uppercase optional; tracking slight.
- **Value:** 24–32px; semibold or bold; tabular-nums; primary text color.
- **Subtext / delta:** 12px; muted. Enough spacing from value (e.g. 4–8px).
- **Spacing between tiles:** 16px (gap). No inner scroll; keep content within card.

### 7.2 Chart cards

- **Card:** ElevatedCard; WidgetFrame header with title (e.g. “MRR trend”).
- **Chart area:** Min height 200–280px; padding 16–24px from card edges. Axis labels 12px muted.
- **Legend:** Top-right or bottom; compact; 12px. No floating legend over chart center.
- **Spacing:** Same 16px grid gap as other widgets.

### 7.3 General

- **Section spacing:** 24–32px between sections (e.g. “Today” vs “Revenue”).
- **Consistency:** All widget headers use the same title size and weight; body padding aligned across widget types.

---

## 8. Summary checklist for builder

- [ ] **ElevatedCard:** Dark matte background, 1px border, two-layer shadow, 16–18px radius; states: default, hover (lift -2px, border brighten, shadow deepen), selected (accent outline/light glow), dragging (lift + scale 1.02 + accent), alert (badge only).
- [ ] **WidgetFrame:** Header (title left, subtitle optional, actions right); drag handle and resize/remove only in customize mode; collapse if supported.
- [ ] **DashboardGrid:** Drag-and-drop + resize in customize mode; snap; reflow; persist layout; no overlap.
- [ ] **Customize mode:** Toggle in header; on = show drag/resize/remove; off = hide and lock.
- [ ] **Enhanced Glow Mode:** Off by default; when on, glow only for active filters, badges, selected widget, alert badge; color = user accent.
- [ ] **No glass blur default;** no neon except as above.
- [ ] Keep existing layout and color customization; no full redesign or new nav.

---

*Spec complete. Builder implements ElevatedCard, WidgetFrame, and DashboardGrid against this spec; visual hierarchy and state behavior are the single source of truth.*
