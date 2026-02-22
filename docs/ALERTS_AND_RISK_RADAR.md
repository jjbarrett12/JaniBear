# Alerts Center & Risk Radar — Layouts + Copy

Design for a dedicated **Alerts Center** (severity filters + assignment) and **Risk Radar** (Top 10 Risks + At-risk Accounts with badges). All copy lives in `src/lib/alerts-risk-copy.ts`.

---

## 1. Alerts Center

### 1.1 Purpose

Single place to see all attention items (handoffs, open issues, missed tasks, accounts below threshold, etc.), filter by **severity**, and **assign** items to a person or team for follow-up.

### 1.2 Page layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Alerts Center                                                           │
│  Triage and assign items that need attention.                            │
├─────────────────────────────────────────────────────────────────────────┤
│  [Severity]  ● Critical   ● Warning   ● All                    [Assign] │
├─────────────────────────────────────────────────────────────────────────┤
│  Alert / summary              Count   Severity   Assigned to   Actions   │
│  ─────────────────────────────────────────────────────────────────────  │
│  Open issues past SLA         1      Critical   —             Assign    │
│  Accounts below threshold     3      Warning    J. Smith      Reassign  │
│  New hand-offs from sales     2      —          —             Assign    │
│  Contracts not inspected 14+d  2      Warning    —             Assign    │
│  Opportunities stalled 30+d   4      Warning    —             Assign    │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Header:** Title + one-line description.
- **Toolbar:** Severity filter (Critical | Warning | All) as chips or segmented control; optional bulk **Assign** action when rows are selected.
- **List/table:** One row per alert type (or per alert instance if modeled per-item). Columns: **Alert** (label + optional short summary), **Count**, **Severity** (badge), **Assigned to** (name or “Unassigned”), **Actions** (Assign / Reassign / View).

### 1.3 Severity filters

| Filter   | Behavior |
|----------|----------|
| Critical | Only alerts with `severity === 'critical'` (e.g. issues past SLA). |
| Warning  | Only alerts with `severity === 'warning'` (e.g. accounts below threshold, stalled opps). |
| All      | Show all alerts regardless of severity (include items with no severity). |

- **Default:** All. Persist last selection in session or URL if desired.
- **Copy:** Use `ALERTS_FILTER_CRITICAL`, `ALERTS_FILTER_WARNING`, `ALERTS_FILTER_ALL`.

### 1.4 Assignment

- **Assigned to:** Column shows assignee name or “Unassigned”. Empty when no assignment.
- **Actions:** “Assign” opens a small modal or dropdown: pick a user (or team) and optional due date; confirm. “Reassign” same UX for already-assigned rows.
- **Copy:** `ALERTS_ASSIGNED_TO`, `ALERTS_UNASSIGNED`, `ALERTS_ACTION_ASSIGN`, `ALERTS_ACTION_REASSIGN`, `ALERTS_ASSIGN_MODAL_TITLE`, etc.

### 1.5 Alerts list row (spec)

| Column       | Content |
|--------------|--------|
| Alert        | Label (e.g. “Open issues past SLA”) + optional 1-line summary. Link to drilldown (e.g. `/app/issues`) if `href` exists. |
| Count        | Numeric count. |
| Severity     | Badge: Critical (red) or Warning (amber). No badge for neutral/unset. |
| Assigned to  | User display name or “Unassigned”. |
| Actions      | Button or dropdown: Assign, Reassign (if assigned). |

### 1.6 Empty state

- **No alerts:** “No alerts right now. When something needs attention, it will show up here.”
- **No results for filter:** “No [Critical / Warning] alerts. Try “All” or change filters.”

---

## 2. Risk Radar

### 2.1 Purpose

Executive view of **Top 10 Risks** (aggregate risk drivers or ranked risk items) and **At-risk Accounts** (accounts/sites with risk badges and primary reason).

### 2.2 Page layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Risk Radar                                                              │
│  Top risks and at-risk accounts at a glance.                             │
├─────────────────────────────────────────────────────────────────────────┤
│  Top 10 Risks                    │  At-risk Accounts                     │
│  ─────────────────────────────  │  ───────────────────────────────────  │
│  1. Open issues past SLA (3)     │  Tech Campus West · TechCo            │
│  2. Accounts below threshold (3)│     Risk 78  [Low margin + late payer]│
│  3. Overdue AR (2 accounts)      │  Retail Strip Mall · MallCo          │
│  4. Contracts not inspected (2)  │     Risk 65  [Overdue AR]             │
│  5. Stalled opportunities (4)    │  Hotel North · StayWell               │
│  6. …                             │     Risk 58  [Supply spike + low GM] │
│  …                                │  …                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Header:** Title + one-line description.
- **Two columns (or two stacked sections on small screens):**
  - **Left:** **Top 10 Risks** — ordered list (1–10). Each line: rank + short label + optional count in parentheses.
  - **Right:** **At-risk Accounts** — list of account/site rows. Each row: **Account name · Client**, then **Risk score** (number) + **badge(s)** for primary reason (e.g. “Low margin + late payer”, “Overdue AR”). Rows link to account/site detail or risk detail drawer.

### 2.3 Top 10 Risks (spec)

- **Content:** Rank (1–10) + risk type label + optional count, e.g. “1. Open issues past SLA (3)”.
- **Order:** By severity/impact (e.g. critical first, then by count or risk score). Same taxonomy as Alerts Center where applicable.
- **Interaction:** Click row → navigate to relevant list (e.g. issues, accounts) or open a detail drawer with the underlying items.
- **Copy:** Section heading `RISK_RADAR_TOP_10_TITLE`; empty state “No risks identified.”

### 2.4 At-risk Accounts list (spec)

- **Row:** 
  - Line 1: **Site/account name** · **Client name** (e.g. “Tech Campus West · TechCo”).
  - Line 2 (or inline): **Risk score** (e.g. 78) + **badges** for primary reason(s). One primary badge per row is enough; multiple tags if design allows.
- **Badges:** Short, readable reason labels (e.g. “Low margin + late payer”, “Overdue AR”, “Supply spike + low GM”). Use existing `Badge` component; variant outline or secondary so they don’t overpower the list.
- **Sort:** By risk score descending (highest risk first).
- **Copy:** Section heading `RISK_RADAR_AT_RISK_ACCOUNTS_TITLE`; “Risk” label before score; empty state “No at-risk accounts.”

### 2.5 Responsive

- **Desktop:** Two columns (e.g. 40% / 60% or 1fr / 1.5fr).
- **Tablet/Mobile:** Stack vertically: Top 10 Risks first, then At-risk Accounts. Same copy and row/badge structure.

---

## 3. Copy reference

All strings are in `src/lib/alerts-risk-copy.ts`.

### Alerts Center

| Key | Example / purpose |
|-----|-------------------|
| `ALERTS_CENTER_TITLE` | "Alerts Center" |
| `ALERTS_CENTER_DESCRIPTION` | "Triage and assign items that need attention." |
| `ALERTS_FILTER_CRITICAL` | "Critical" |
| `ALERTS_FILTER_WARNING` | "Warning" |
| `ALERTS_FILTER_ALL` | "All" |
| `ALERTS_COLUMN_ALERT` | "Alert" |
| `ALERTS_COLUMN_COUNT` | "Count" |
| `ALERTS_COLUMN_SEVERITY` | "Severity" |
| `ALERTS_COLUMN_ASSIGNED_TO` | "Assigned to" |
| `ALERTS_COLUMN_ACTIONS` | "Actions" |
| `ALERTS_UNASSIGNED` | "Unassigned" |
| `ALERTS_ACTION_ASSIGN` | "Assign" |
| `ALERTS_ACTION_REASSIGN` | "Reassign" |
| `ALERTS_ACTION_VIEW` | "View" |
| `ALERTS_EMPTY` | "No alerts right now. When something needs attention, it will show up here." |
| `ALERTS_EMPTY_FILTER` | "No [severity] alerts. Try \"All\" or change filters." |
| `ALERTS_ASSIGN_MODAL_TITLE` | "Assign alert" |
| `ALERTS_ASSIGN_MODAL_ASSIGNEE` | "Assign to" |
| `ALERTS_ASSIGN_MODAL_DUE` | "Due date (optional)" |
| `ALERTS_ASSIGN_CONFIRM` | "Assign" |

### Risk Radar

| Key | Example / purpose |
|-----|-------------------|
| `RISK_RADAR_TITLE` | "Risk Radar" |
| `RISK_RADAR_DESCRIPTION` | "Top risks and at-risk accounts at a glance." |
| `RISK_RADAR_TOP_10_TITLE` | "Top 10 Risks" |
| `RISK_RADAR_TOP_10_EMPTY` | "No risks identified." |
| `RISK_RADAR_AT_RISK_ACCOUNTS_TITLE` | "At-risk Accounts" |
| `RISK_RADAR_AT_RISK_EMPTY` | "No at-risk accounts." |
| `RISK_RADAR_RISK_LABEL` | "Risk" (prefix before score, e.g. "Risk 78") |
| `RISK_RADAR_PRIMARY_REASON` | "Primary reason" (optional column header or tooltip) |

---

## 4. Data alignment

- **Alerts:** Can be driven by existing `AttentionAlert` (id, label, count, severity, href) and/or nav alert types (handoffs, open issues, missed tasks). Add optional `assignedToUserId` / `assignedToName` and `dueDate` when assignment is implemented.
- **Risk Radar — Top 10:** Derived from same alert types (with counts) or from a dedicated risk-aggregation query; ordered by severity and count/score.
- **Risk Radar — At-risk Accounts:** Align with contracts-at-risk / account-risk data: site/account name, client name, risk score, primary reason(s). Use badges for reason labels; optional columns (GM trend, overdue $, last inspection) can stay in a detail view or drawer.
