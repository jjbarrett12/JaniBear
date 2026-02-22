# Audit Log Viewer — Component Spec + Copy

Design for an **Audit Log** viewer: filter bar, table, detail drawer with **before/after JSON diff** (pretty-printed), **Copy to clipboard** with confirmation, and **Export CSV**. Copy lives in `src/lib/audit-log-copy.ts`.

---

## 1. Page layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Audit Log                                                               │
│  View and search changes across the organization.                        │
├─────────────────────────────────────────────────────────────────────────┤
│  [Filter bar]                                                            │
│  Date range   Action   Resource type   Actor        [Apply] [Reset]      │
├─────────────────────────────────────────────────────────────────────────┤
│  [Copy] [Export CSV]                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Timestamp     │ Actor    │ Action  │ Resource   │ Details      │ ⋮   ││
│  │ 2025-02-20…   │ J. Smith │ update  │ contract   │ View         │     ││
│  │ 2025-02-20…   │ System   │ create  │ user       │ View         │     ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘

[Detail drawer — open on row click or "View"]
┌──────────────────────────────────────────┐
│  Audit entry · 2025-02-20 14:32        × │
├──────────────────────────────────────────┤
│  Actor: Jane Smith    Action: update     │
│  Resource: contract   ID: abc-123        │
│  ─────────────────────────────────────  │
│  Before              │ After             │
│  {                   │ {                 │
│    "status": "draft" │   "status": "sent"│
│  }                   │ }                 │
│  ─────────────────────────────────────  │
│  [Copy to clipboard]  [Copied ✓]         │
└──────────────────────────────────────────┘
```

---

## 2. Filter bar

### 2.1 Controls

| Control        | Type        | Purpose |
|----------------|-------------|--------|
| **Date range** | Preset + optional custom | From/to date (default e.g. last 7 days). Presets: Last 24h, Last 7 days, Last 30 days, Custom. |
| **Action**     | Dropdown    | Filter by action: All, create, update, delete (or backend-defined list). |
| **Resource type** | Dropdown | Filter by entity/resource: All, organization, user, contract, issue, … (backend-defined). |
| **Actor**      | Optional dropdown or search | Filter by user (actor). Can be typeahead or select; optional. |
| **Apply**      | Button      | Apply current filter values (e.g. update URL or fetch). |
| **Reset**      | Button      | Clear filters to defaults. |

- Filters can be URL-synced (e.g. `?from=…&to=…&action=update`) for shareable links.
- Copy: `AUDIT_FILTER_DATE_RANGE`, `AUDIT_FILTER_ACTION`, `AUDIT_FILTER_RESOURCE`, `AUDIT_FILTER_ACTOR`, `AUDIT_FILTER_APPLY`, `AUDIT_FILTER_RESET`, presets (e.g. `AUDIT_DATE_LAST_24H`, `AUDIT_DATE_LAST_7_DAYS`, `AUDIT_DATE_CUSTOM`).

### 2.2 Component spec: AuditLogFilterBar

| Prop / slot      | Type     | Spec |
|------------------|----------|------|
| `dateFrom`       | string   | ISO date or ''.
| `dateTo`         | string   | ISO date or ''.
| `action`         | string   | Selected action or 'all'.
| `resourceType`   | string   | Selected resource or 'all'.
| `actorId`        | string   | Optional actor user id or ''.
| `onChange`       | function | (filters) => void when user changes any control.
| `onApply`        | function | () => void when user clicks Apply (optional if filters apply on change).
| `onReset`        | function | () => void when user clicks Reset.
| `actionOptions`  | array    | { value, label } from API.
| `resourceOptions`| array    | { value, label } from API.
| `actorOptions`   | array    | Optional { value, label } for actor dropdown.

---

## 3. Table

### 3.1 Columns

| Column      | Content |
|-------------|---------|
| **Timestamp** | created_at formatted (e.g. locale date + time, or relative). |
| **Actor**     | User display name or email; "System" when no user. |
| **Action**    | create | update | delete (or backend labels). |
| **Resource**  | Resource type + optional short id (e.g. "contract · abc-123"). |
| **Details**   | "View" link or button; opens detail drawer. |
| **Actions**   | Optional kebab: Copy, or only use row click for drawer. |

- Row click (or "View") opens the **detail drawer** for that row.
- Copy: `AUDIT_COLUMN_TIMESTAMP`, `AUDIT_COLUMN_ACTOR`, `AUDIT_COLUMN_ACTION`, `AUDIT_COLUMN_RESOURCE`, `AUDIT_COLUMN_DETAILS`, `AUDIT_VIEW_DETAILS`.

### 3.2 Component spec: AuditLogTable

| Prop        | Type     | Spec |
|-------------|----------|------|
| `rows`      | array    | Audit log rows (id, createdAt, actorDisplayName, action, resourceType, resourceId, before, after, meta). |
| `onRowClick`| function | (row) => void to open drawer. |
| `loading`   | boolean  | Show skeleton or loading state. |
| `emptyMessage` | string | When rows.length === 0. |

---

## 4. Detail drawer (before/after JSON diff)

### 4.1 Behavior

- **Open:** When user clicks a table row or "View" in the Details column.
- **Close:** Overlay click, Escape, or close button. Slide-over from right (reuse `SlideOverDrawer`); width e.g. `max-w-2xl` to allow two columns for Before/After.
- **Content:**
  - **Header:** "Audit entry" + timestamp (or row id). Close button.
  - **Meta block:** Actor, Action, Resource type, Resource ID (each on one line or a small grid).
  - **Before / After:** Two columns (or two stacked sections on narrow view). Each shows a **pretty-printed JSON** block. If payload is not JSON, show as preformatted text.
  - **Copy:** "Copy to clipboard" button; on success show "Copied to clipboard" (toast or inline) and optionally replace button text briefly with "Copied ✓".

### 4.2 Pretty JSON

- **Format:** `JSON.stringify(value, null, 2)` (2-space indent). Use `<pre>` or a `<code>` block with monospace font; overflow auto and max height so long payloads scroll.
- **Diff (optional enhancement):** If both before and after exist, optionally highlight added/removed/changed keys (e.g. green for added, red for removed). For MVP, two side-by-side pretty blocks are enough.
- **Null/empty:** If before or after is null/undefined, show a placeholder: "—" or "No previous value" / "No new value".

### 4.3 Component spec: AuditLogDetailDrawer

| Prop       | Type     | Spec |
|------------|----------|------|
| `open`     | boolean  | Drawer visible. |
| `onClose`  | function | () => void. |
| `entry`    | object \| null | Current row: { id, createdAt, actorDisplayName, action, resourceType, resourceId, before, after, meta }. before/after can be JSON object or string. |
| `onCopy`   | function | (text: string) => Promise<void> or () => void; caller copies and shows toast. |

- **Copy scope:** Either "Copy full entry (JSON)" or "Copy Before" / "Copy After" separately. At least one "Copy to clipboard" that copies a sensible representation (e.g. full entry as JSON).

### 4.4 Copy (drawer)

- `AUDIT_DRAWER_TITLE`, `AUDIT_DRAWER_ACTOR`, `AUDIT_DRAWER_ACTION`, `AUDIT_DRAWER_RESOURCE`, `AUDIT_DRAWER_RESOURCE_ID`, `AUDIT_DRAWER_BEFORE`, `AUDIT_DRAWER_AFTER`, `AUDIT_DRAWER_NO_BEFORE`, `AUDIT_DRAWER_NO_AFTER`, `AUDIT_COPY_BUTTON`, `AUDIT_COPIED_TO_CLIPBOARD`.

---

## 5. Copy to clipboard + "Copied to clipboard"

- **Action:** User clicks "Copy to clipboard" (in drawer or table row). Client copies the selected text (e.g. full audit entry as JSON, or before/after only) via `navigator.clipboard.writeText(text)`.
- **Feedback:** Show a short-lived toast or inline message: **"Copied to clipboard"** (use `AUDIT_COPIED_TO_CLIPBOARD`). Optionally change button to "Copied ✓" for 2–3 seconds then revert.
- **Copy string:** `AUDIT_COPIED_TO_CLIPBOARD` = "Copied to clipboard".

---

## 6. Export CSV

- **Placement:** Toolbar above the table (with or next to "Copy" if there is a bulk copy). Button label: "Export CSV" (`AUDIT_EXPORT_CSV`).
- **Behavior:** On click, build a CSV from the **currently filtered** table data. Columns: Timestamp, Actor, Action, Resource type, Resource ID, Before (can be JSON string or truncated), After (same). Download as file (e.g. `audit-log-2025-02-20.csv`).
- **Copy:** `AUDIT_EXPORT_CSV`, `AUDIT_EXPORT_CSV_FILENAME` (e.g. "audit-log-{date}.csv").

### 6.1 Component spec (export)

- Parent or toolbar component owns "Export CSV" button. On click: call a function that takes `rows` (current page or all filtered) and returns a CSV string; trigger download (blob + anchor or `window.open`). Copy strings in audit-log-copy.

---

## 7. Copy reference (audit-log-copy.ts)

All keys and suggested values:

| Key | Value / purpose |
|-----|------------------|
| **Page** | |
| `AUDIT_LOG_TITLE` | "Audit Log" |
| `AUDIT_LOG_DESCRIPTION` | "View and search changes across the organization." |
| **Filter bar** | |
| `AUDIT_FILTER_DATE_RANGE` | "Date range" |
| `AUDIT_FILTER_ACTION` | "Action" |
| `AUDIT_FILTER_RESOURCE` | "Resource type" |
| `AUDIT_FILTER_ACTOR` | "Actor" |
| `AUDIT_FILTER_APPLY` | "Apply" |
| `AUDIT_FILTER_RESET` | "Reset" |
| `AUDIT_DATE_LAST_24H` | "Last 24 hours" |
| `AUDIT_DATE_LAST_7_DAYS` | "Last 7 days" |
| `AUDIT_DATE_LAST_30_DAYS` | "Last 30 days" |
| `AUDIT_DATE_CUSTOM` | "Custom" |
| `AUDIT_FILTER_ALL` | "All" |
| **Table** | |
| `AUDIT_COLUMN_TIMESTAMP` | "Timestamp" |
| `AUDIT_COLUMN_ACTOR` | "Actor" |
| `AUDIT_COLUMN_ACTION` | "Action" |
| `AUDIT_COLUMN_RESOURCE` | "Resource" |
| `AUDIT_COLUMN_DETAILS` | "Details" |
| `AUDIT_VIEW_DETAILS` | "View" |
| `AUDIT_TABLE_EMPTY` | "No audit entries match your filters." |
| **Toolbar** | |
| `AUDIT_COPY_SELECTION` | "Copy" (optional, for selected rows) |
| `AUDIT_EXPORT_CSV` | "Export CSV" |
| `AUDIT_EXPORT_CSV_FILENAME` | "audit-log" (prefix for filename) |
| **Drawer** | |
| `AUDIT_DRAWER_TITLE` | "Audit entry" |
| `AUDIT_DRAWER_ACTOR` | "Actor" |
| `AUDIT_DRAWER_ACTION` | "Action" |
| `AUDIT_DRAWER_RESOURCE` | "Resource" |
| `AUDIT_DRAWER_RESOURCE_ID` | "Resource ID" |
| `AUDIT_DRAWER_BEFORE` | "Before" |
| `AUDIT_DRAWER_AFTER` | "After" |
| `AUDIT_DRAWER_NO_BEFORE` | "No previous value" |
| `AUDIT_DRAWER_NO_AFTER` | "No new value" |
| `AUDIT_COPY_BUTTON` | "Copy to clipboard" |
| `AUDIT_COPIED_TO_CLIPBOARD` | "Copied to clipboard" |
| `AUDIT_COPIED_BUTTON` | "Copied ✓" (optional) |

---

## 8. Data shape (reference)

Audit log row (for table + drawer):

- `id`: string (UUID)
- `createdAt`: string (ISO)
- `actorDisplayName`: string (or "System")
- `actorId`: string | null
- `action`: string (e.g. "create", "update", "delete")
- `resourceType`: string (e.g. "contract", "user")
- `resourceId`: string | null
- `before`: object | string | null  // JSON payload before change
- `after`: object | string | null   // JSON payload after change
- `meta`: object | null             // optional extra (e.g. ip, user_agent)

Backend can map `activity_log` (org_id, user_id, entity_type, entity_id, action, details) or `platform_audit_log` (actor_user_id, action, meta) into this shape; store before/after in details or meta as needed.
