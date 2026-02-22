# Role-Based Layout System — Validation Report (Re-run)

**Date:** 2025-02-20  
**Re-run:** After builder and design finished (active_layout_mode, Recommended/My Layout, LayoutModeSelector wired).

---

## 1. RLS

### 1.1 Users cannot write org templates unless admin

| Resource | Current behavior | Status |
|----------|------------------|--------|
| **Inspection templates** (`templates`, `template_sections`, `template_items`) | Write gated by `can_admin_org` in migration 059 → owner, manager only | **PASS** — Inspector cannot write. |
| **Widget layout templates** (`widget_layout_templates`) | Write gated by `role IN ('owner','admin','manager')` in 058; `org_members.role` has no `admin` | **PASS** — Only owner and manager can write org widget templates. |

### 1.2 Users cannot read other org templates

| Resource | Policy | Status |
|----------|--------|--------|
| **Inspection templates** | `is_org_member(org_id, auth.uid())` for SELECT | **PASS** |
| **Widget layout templates** | SELECT: `org_id IS NULL OR org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())` | **PASS** |
| **user_widget_layouts** | SELECT: `user_id = auth.uid() AND org_id IN (org_members)` | **PASS** |
| **user_ui_prefs** | SELECT: `user_id = auth.uid() AND org_id IN (org_members)` | **PASS** |

---

## 2. active_layout_mode persists correctly per module

- **Schema:** `user_ui_prefs` (migration 058) with `(user_id, org_id, module_key)` and `active_layout_mode`.
- **App:** `getActiveLayoutMode` / `setActiveLayoutMode` in `src/lib/ui/layouts/active-mode.ts`; WidgetGrid loads mode on mount and calls `setActiveLayoutMode` on mode change and on “Replace my layout”.

**Status:** **PASS** — active_layout_mode is read and written per (user, org, module).

---

## 3. “Recommended” does not overwrite “My Layout”

- **Flow:** Mode is stored in `user_ui_prefs` only. When mode is `recommended` or `org_template`, layout is computed from templates in memory via `selectActiveLayout`; `saveLayout` is only called from “Save layout” and “Replace my layout”.
- **Risk:** If the user had “Recommended” selected, clicked “Customize layout”, then “Save layout”, we would have written the recommended layout into `user_widget_layouts`, overwriting My Layout.

**Status:** **FIX APPLIED** — “Save layout” is disabled when `activeLayoutMode !== 'my'` (and tooltip explains to use “Replace my layout” or switch to My Layout). So Recommended can no longer accidentally overwrite My Layout via Save.

---

## 4. Breakpoint switching does not mix layouts

- **Persistence:** Keyed by `(org_id, user_id, module_key, breakpoint)`; fetch/save use `currentBp` only.
- **UI:** Single grid with `layout` and `cols` for `currentBp`; effect derives layout from `savedByBp[currentBp]` and templates by breakpoint.

**Status:** **PASS** — No cross-breakpoint mixing.

---

## 5. Merge logic handles new widgets (no crash, appends)

- **Logic:** `mergeLayoutWithDefaults` builds default from widget definitions, overlays saved layout; new widgets get default positions.
- **Hardening:** Items with `!item || typeof item.i !== 'string'` are skipped.

**Status:** **PASS** — New widgets append; malformed data does not crash.

---

## 6. SQL policy corrections

- **Inspection templates:** Migration `059_templates_admin_only_write.sql` in place; write restricted to `can_admin_org` (owner/manager).
- **Widget layout templates / user_widget_layouts / user_ui_prefs:** No changes required.
- **Optional hardening:** `user_ui_prefs` UPDATE policy could add `org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())` to WITH CHECK so updated rows remain in allowed orgs. Low priority.

**Note:** Two migrations share the 059 prefix: `059_templates_admin_only_write.sql` and `059_widget_layout_templates_lock_and_name.sql`. Consider renaming one to 060 for deterministic ordering if your migrator relies on filenames.

---

## 7. Next.js hydration

- **WidgetGrid:** Client-only; userId and layout mode loaded in effects; initial render is loading skeleton.
- **WidgetGridInner:** Dynamic import of `react-grid-layout` in useEffect; placeholder until loaded.

**Status:** **PASS** — No hydration issues.

---

## Summary (re-run)

| Check | Result |
|-------|--------|
| RLS: no write to org templates unless admin (inspection) | **PASS** (059 applied) |
| RLS: no write to org widget templates unless admin | **PASS** |
| RLS: no read of other org templates | **PASS** |
| active_layout_mode persists per module | **PASS** (wired in app) |
| “Recommended” does not overwrite “My Layout” | **PASS** (Save disabled when mode ≠ my) |
| Breakpoint switching does not mix layouts | **PASS** |
| Merge logic: new widgets append, no crash | **PASS** |
| Hydration / dynamic import | **PASS** |

---

## Permissions & lock enforcement

| Check | Result |
|-------|--------|
| **Edit mode disabled when locked** | **PASS** — `canEditLayout = !isTemplateLocked \|\| isAdmin`. When locked and not admin, “Customize layout” is hidden; `useEffect` forces `editMode` to `false` when `canEditLayout` becomes false. |
| **Users can still use “My Layout” when locked** | **PASS** — Layout mode selector (My / Recommended / Org Template) is always available. Lock only prevents *customizing* (edit/save/reset). Users can switch to “My Layout” and view their saved layout; they cannot save or replace when locked. |
| **No API write calls for locked (non-admin) users** | **PASS** — (1) “Customize layout” hidden → no edit mode → no Save/Reset in UI. (2) “Replace my layout” gated by `canEditLayout`. (3) “Restore default” only passed when `canEditLayout` (`onRestoreDefault={canEditLayout ? handleReset : undefined}`), so locked users do not see or trigger `resetLayoutsForModule`. (4) `setActiveLayoutMode` (user_ui_prefs) remains allowed when locked (preference only; not layout content). |

**Write paths and lock:** `saveLayout`, `resetLayoutsForModule`, and “Replace my layout” are only reachable when `canEditLayout` is true (or, for Save, when edit mode is on, which requires `canEditLayout`). Lock enforcement is UI-level; RLS on `user_widget_layouts` still allows org members to write their own rows. Optional hardening: server-side check in an RPC that rejects `user_widget_layouts` upsert/delete when `widget_layout_templates.is_locked` is true for that org/module/role.

---

## Change made this run

- **WidgetGrid.tsx:** “Save layout” button is disabled when `activeLayoutMode !== 'my'`, with tooltip: “Switch to My Layout to save, or use Replace my layout”. This prevents accidentally overwriting My Layout by saving while viewing Recommended or Org Template.
- **Lock enforcement:** (1) `onRestoreDefault` is only passed when `canEditLayout`, so locked users cannot trigger “Restore default” (no `resetLayoutsForModule`). (2) `useEffect` sets `editMode` to `false` when `canEditLayout` becomes false so no write UI is available after lock is applied.
