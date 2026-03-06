# Service Deployments — Implementation Plan & Component Structure

## Overview

The **Service Deployments** module is an Operations pipeline for managing operational deployments: new account activations, crew reassignments, scope changes, franchise transfers, and service restarts. It provides a Kanban-style board with draggable cards, a detail panel, and full audit via `deployment_events`.

---

## 1. Database

### Migration: `supabase/migrations/111_service_deployments.sql`

**Tables:**

| Table | Purpose |
|-------|--------|
| `service_deployments` | One row per deployment. Links to `accounts`, `crews`, `facilities`, `profiles` (requested_by). Stages: `request_logged` → `review_approval` → `crew_assignment` → `go_live_prep` → `live_monitoring` → `stabilization_complete`. |
| `deployment_events` | One row per stage transition. Columns: `deployment_id`, `from_stage`, `to_stage`, `created_by`, `created_at`, `payload`. |

**Deployment types (CHECK):** `new_account`, `crew_reassignment`, `scope_change`, `franchise_transfer`, `service_restart`.

**RLS:** Org-scoped; only org members can select/insert/update/delete. Events are readable/insertable when the deployment belongs to the user’s org.

**Integration:** FKs to `accounts`, `crews`, `facilities`, `profiles`. No direct FKs to `inspections` or `schedules`; link via `account_id` / `facility_id` when needed.

---

## 2. Types & Constants

**File:** `src/lib/service-deployments/types.ts`

- `DeploymentStage` — union of the 6 stage slugs.
- `DeploymentType` — union of the 5 deployment types.
- `STAGE_LABELS`, `DEPLOYMENT_TYPE_LABELS` — UI labels.
- `ServiceDeploymentRow` — list/detail row (with optional `account`, `assigned_crew`, `requested_by_profile`).
- `DeploymentEventRow` — event row.
- `DeploymentWithDetails` — deployment + `events[]`, `account_name`, `assigned_crew_name`, `requested_by_name`.

---

## 3. API Routes

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/api/app/ops/service-deployments` | List deployments for current org (with account name, crew name, requester). |
| POST | `/api/app/ops/service-deployments` | Create deployment (`account_id`, `deployment_type`, `reason`, `facility_id`). |
| GET | `/api/app/ops/service-deployments/[id]` | Single deployment with events and resolved names. |
| PATCH | `/api/app/ops/service-deployments/[id]` | Update `stage`, `assigned_crew_id`, `notes`, `go_live_checklist`, `stabilization_metrics`. On `stage` change, insert into `deployment_events`. |
| GET | `/api/app/ops/crews` | List crews (id, name) for org (used in detail panel dropdown). |

Auth: `getCurrentUserId`, `getActiveOrgIdFromCookie`, `requirePermission` (`ops.read` / `ops.write`).

---

## 4. Page & Layout

**Page:** `src/app/app/ops/service-deployments/page.tsx`

- Server component: `requireOrg`, `requirePermission('dashboard.ops')`.
- Fetches deployments (with `accounts(name)`, `crews(name)`, `profiles!requested_by(full_name)`) and crews from Supabase.
- Passes `initialDeployments` and `crewOptions` to client.

---

## 5. Component Structure

```
src/components/ops/service-deployments/
├── ServiceDeploymentsClient.tsx   # State: deployments, selectedId, detailOpen; handlers: move, crew assign
├── DeploymentsKanban.tsx          # 6 columns (stages), drag-and-drop, renders DeploymentCard per item
├── DeploymentCard.tsx              # Card: account name, type, reason, requested by, date, status, crew
└── DeploymentDetailPanel.tsx      # Sheet: reason, incident history, current/recommended crew, assign, checklist, metrics
```

### ServiceDeploymentsClient

- Props: `initialDeployments`, `crewOptions`.
- State: `deployments`, `selectedId`, `detailOpen`.
- `onMoveDeployment`: PATCH stage, then update local state.
- `onCrewAssign`: PATCH `assigned_crew_id`, then update local state.
- Renders `DeploymentsKanban` and `DeploymentDetailPanel`.

### DeploymentsKanban

- Props: `deployments`, `onSelectDeployment`, `onMoveDeployment`.
- Groups by `stage`; one column per stage (280px, scrollable).
- HTML5 drag-and-drop: drag card into another column → PATCH stage, append event (backend).
- Cards: `DeploymentCard` with optional drag handle (e.g. GripVertical on hover).

### DeploymentCard

- Props: `deployment`, `onClick`, `isDragging`, `className`.
- Shows: account name, deployment type badge, reason (line-clamp), requested by, requested date, current stage, assigned crew.
- Left border accent by type (emerald/blue/amber/violet/slate).
- `rounded-xl`, `border`, `bg-card`, dark cockpit styling.

### DeploymentDetailPanel

- Props: `deploymentId`, `open`, `onClose`, `onStageChange`, `onCrewAssign`, `crewOptions`.
- Fetches `/api/app/ops/service-deployments/[id]` when opened.
- Sections: Reason for deployment; Incident history (events); Current crew + Select to assign; Go-live checklist (JSONB); Stabilization metrics (JSONB).
- Uses shadcn `Sheet`, `Button`, `Badge`, `Select`, `ScrollArea` → replaced with `overflow-y-auto` div.

---

## 6. UI / Theming

- **Design:** Dark cockpit: slate surfaces, subtle borders, rounded-xl cards, operational accents (emerald/blue/amber/violet/rose where appropriate).
- **Components:** shadcn/ui (Card, Badge, Button, Sheet, Select, etc.) + Tailwind.
- **Stages:** Single grid of columns; no mixed flex-wrap for the same band; consistent gap.

---

## 7. Nav & i18n

- **Nav:** Operations section in `src/lib/nav/navFactory.ts`: added `{ href: '/app/ops/service-deployments', labelKey: 'navServiceDeployments', icon: Rocket }`.
- **Translations:** `src/lib/app-translations.ts`: `navServiceDeployments: 'Service Deployments'` (en), `'Despliegues de servicio'` (es).

---

## 8. Stage Transitions & Events

- Every time the backend receives a PATCH with a new `stage`, it:
  1. Reads current `stage` of the deployment.
  2. Inserts into `deployment_events` (`deployment_id`, `from_stage`, `to_stage`, `created_by`).
  3. Updates `service_deployments.stage` and `updated_at`.

So every stage transition is recorded; the detail panel “Incident history” lists these events.

---

## 9. Integration Points

- **accounts:** `service_deployments.account_id` → account name in card and detail.
- **crews:** `service_deployments.assigned_crew_id` → crew name; assignment in detail panel uses `/api/app/ops/crews`.
- **facilities:** `service_deployments.facility_id` optional; can be used for scope/location.
- **inspections / schedules:** No direct FK; can be joined or displayed in future via `account_id` / `facility_id`.

---

## 10. Cleanup / Checklist

- [x] Migration applied (run `supabase db push` or apply `111_service_deployments.sql`).
- [x] List API returns account/crew/requester (embed or separate query).
- [x] PATCH writes `deployment_events` on stage change.
- [x] Kanban drag-and-drop updates stage and refetches/updates local state.
- [x] Detail panel shows reason, events, crew assign, checklist, metrics.
- [ ] Optional: “Add deployment” button + modal (POST) and “Recommended crews” logic (capacity/territory).
- [ ] Optional: Go-live checklist and stabilization metrics edit in detail panel (PATCH `go_live_checklist` / `stabilization_metrics`).
