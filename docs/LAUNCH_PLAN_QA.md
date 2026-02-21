# Launch Plan (Sales → Ops Handoff) v1 — QA Checklist

## Spec flow (must pass)

1. **Win opp** — Opportunity is won (stage = won or equivalent).
2. **Create plan** — From opportunity detail → Launch Plan tab → Create Launch Plan (one row in `launch_plans`).
3. **Fill sales** — Complete Sales inputs (service window, access, scope, included/excluded services, contacts); Mark Sales Ready when gates pass.
4. **Fill ops** — Complete Ops setup (start date, crew/schedule/inspection planned); Mark Ops Ready when gates pass.
5. **Mark launched** — Click Mark Launched; status → `launched`.
6. **Verify activity created** — One `crm_activity` row with subject "First inspection scheduled", `due_at` = start_date + 7 days (if not already present).

Optional: Verify no new `sites` rows; RLS/role behavior (inspector read-only, client_viewer no access).

---

## Prerequisites

- Run migration `050_launch_plans.sql`.
- User with role **owner** or **manager** (or admin/sales/ops) for write; **inspector** for read-only.
- At least one opportunity with `client_id` and `location_id` set.

---

## 1. Opportunity detail — Launch Plan tab

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Go to CRM → open an opportunity → click **Launch Plan** tab | Tab shows; if no plan, "Create Launch Plan" button and short description. |
| 1.2 | Click **Create Launch Plan** | One row in `launch_plans` with `opportunity_id`, `org_id`, `status = 'draft'`. No error. |
| 1.3 | Confirm status pill shows **draft** and **Sales ready** / **Ops ready** badges | Missing list shows items (e.g. scope summary, service window, etc.). |
| 1.4 | Fill **Sales inputs**: Service window, Access/alarm code, Scope summary, Included/excluded services; optionally check "Contacts unknown" | On blur, data saves; readiness may update. |
| 1.5 | Fill **Ops setup**: Start date, optionally Crew ID, check "Schedule planned", "Inspection planned" | On blur/change, data saves. |
| 1.6 | Click **Mark Sales Ready** | `launch_plans.status` = `sales_ready` (only if sales gates pass; otherwise error or missing list remains). |
| 1.7 | Click **Mark Ops Ready** | `launch_plans.status` = `ops_ready` (only if ops gates pass). |
| 1.8 | Click **Mark Launched** | `launch_plans.status` = `launched`; one new row in `crm_activities` with subject "First inspection scheduled", `due_at` = start_date + 7 days. |
| 1.9 | (Before launching) Click **Block**, enter a reason, submit | `launch_plans.status` = `blocked`; `risks` array has one entry with the reason. |
| 1.10 | Log in as **inspector**, open same opportunity → Launch Plan tab | Forms and action buttons read-only or hidden; can view status and missing list. |

---

## 2. Location (facility) page — Launch Plan card

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Open a facility that has a launch plan with `location_id` = that facility’s id (e.g. Accounts → [account] → [facility]) | **Launch Plan** card appears with status, start date, "Open launch plan" link. |
| 2.2 | Click **Open launch plan** | Navigates to opportunity detail with Launch Plan tab. |
| 2.3 | Open a facility with no launch plan for that `location_id` | No Launch Plan card. |

---

## 3. Ops Launches list

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Sidebar → **Operations** → **Launches** | Page lists launch plans: start_date in next 30 days or status in (sales_ready, ops_ready, blocked). Columns: Client, Location, Status, Start date, Crew?, Schedule?, Inspection?, Risks, Actions. |
| 3.2 | Click **Blocked only** filter | Only rows with status `blocked`. |
| 3.3 | Click **Not ops ready** filter | No rows with status `ops_ready`. |
| 3.4 | Click **My plans (ops owner)** filter | Only rows where `ops_owner_user_id` = current user. |
| 3.5 | Click **Open** on a row | Navigates to `/app/crm/opportunities/[id]?tab=launch_plan`. |

---

## 4. Integrations

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Set opportunity stage to **won** (if your app supports it) or accept a bid | On opportunity Overview tab, prompt appears: "Ready to hand off to Ops?" with link to Launch Plan tab. |
| 4.2 | Mark a plan **Launched** | `crm_activities` has one "First inspection scheduled" task with `due_at` = plan start_date + 7 days (only if not already present). |

---

## 5. DB checks (manual)

- `launch_plans`: one row per opportunity (unique `opportunity_id`); `location_id` and `client_id` match opportunity when set.
- RLS: **client_viewer** cannot see any launch plan rows; **inspector** can SELECT only; **owner/manager/admin/sales/ops** can SELECT/INSERT/UPDATE/DELETE.
- No new tables other than `launch_plans`; no changes to inspections/issues/schedules/crews/templates/tasks behavior beyond reading for readiness.

---

## 6. Exact clicks summary

1. **Create plan**: CRM → Opportunities → [open one] → Launch Plan tab → Create Launch Plan.
2. **Edit sales/ops**: Same tab → edit fields (blur to save) and Start date.
3. **Transition**: Same tab → Mark Sales Ready → Mark Ops Ready → Mark Launched (or Block with reason).
4. **View from facility**: Accounts → [account] → [facility] → Open launch plan.
5. **View list**: Operations → Launches → use filters and Open.
