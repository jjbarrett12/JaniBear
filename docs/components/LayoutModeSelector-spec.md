# LayoutModeSelector — Component Spec

## Purpose
Enterprise UI for switching layout modes on widget-based module pages (Dashboard, Sales Command Center, KPI, Financial Health). Supports **My Layout**, **Recommended** (role-based), and **Org Template** (when set by admins).

## Placement
- Lives in the **module header** of each widget grid, in a compact actions row with "Customize layout" and related controls.
- Kept minimal and premium; no clutter.

---

## UI Requirements

### 1. Layout dropdown
- **Trigger label**: "Layout" (or current mode name, e.g. "My Layout").
- **Options** (always in this order):
  - **My Layout** — User’s saved arrangement.
  - **Recommended** — Role-based suggested layout (onboarding default).
  - **Org Template** — Shown only when the org has at least one template row for this module.
- **Tooltips** (on trigger or per option):
  - My Layout: *"Your personal arrangement. Only you see this. Customize and save from this view."*
  - Recommended: *"A suggested layout for your role. Good starting point for new users."*
  - Org Template: *"Your organization’s standard layout. Set by admins for consistency."*

### 2. Role badge (when Recommended is selected)
- Small badge next to or below the dropdown: **"Recommended for {Role Name}"** (e.g. "Recommended for Ops Manager").
- Role name comes from `templateRole` → `getRoleDisplayLabel(roleKey)`.
- Visually subtle (muted text or small pill).

### 3. Secondary action: Replace My Layout
- **Visibility**: Shown only when current mode is **not** "My Layout" (i.e. when viewing Recommended or Org Template).
- **Label**: "Replace my layout".
- **Behavior**: Opens a **confirm modal**; on confirm, overwrites the user’s saved layout with the currently displayed layout and switches mode to "My Layout".
- **Confirm modal copy**:
  - Title: *"Replace my layout?"*
  - Description: *"Your current layout will be overwritten with this one. You can customize it again after saving."*
  - Buttons: **Cancel** | **Replace**.

### 4. Kebab menu (secondary actions)
- **Restore default**: Clears the user’s saved layout for this module and reverts to default arrangement. Same behavior as "Reset to default" in edit mode but available from the header.
- Tooltip: *"Clear your saved layout and use the default arrangement for this module."*

### 5. Empty state when templates missing
- **Org Template option**: If no org template exists, **do not** show "Org Template" in the dropdown.
- **Optional hint**: In the dropdown footer or as a short line when there are no org templates: *"No org template set. Admins can set a standard layout in settings."*
- When **Recommended** is selected but no recommended layout exists for the role, the grid shows the existing empty state ("No widgets on this view" + "Turn on Customize layout to add widgets").

---

## Visual Requirements
- **Style**: Clean shadcn/ui, minimal, premium.
- **Density**: Compact header; actions in one row with small buttons and a single dropdown.
- **Badge**: Low emphasis (muted or small pill), not dominant.

---

## Props (summary)
| Prop | Type | Description |
|------|------|-------------|
| `value` | `LayoutMode` | Current mode: `'my' \| 'recommended' \| 'org_template'` |
| `onChange` | `(mode: LayoutMode) => void` | When user selects a mode |
| `hasOrgTemplate` | `boolean` | Whether to show Org Template option |
| `roleLabel` | `string` | Display label for current role (e.g. "Ops Manager") for badge |
| `disabled` | `boolean?` | Disable dropdown (e.g. while loading) |
| `onReplaceMyLayout` | `() => void` | Called when user confirms "Replace my layout" |
| `onRestoreDefault` | `() => void` | Called when user chooses "Restore default" from kebab |

---

## Copy reference
All user-facing strings are in `layout-selector-copy.ts` for consistency and easy updates.
