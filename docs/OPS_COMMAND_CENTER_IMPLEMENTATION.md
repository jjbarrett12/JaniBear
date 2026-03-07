# Ops Command Center — Implementation Plan & Component Tree

## Overview

The **Ops Command Center** (`/app/ops/command-center`) is the primary operations cockpit for managers and franchisors. It surfaces live deployment activity, account health, labor coverage, and urgent action items.

---

## 1. Page structure

| Section | Description |
|--------|-------------|
| **Header** | Title, subtitle, org name, date/time, quick actions (Date, Map). |
| **KPI strip** | Six equal-width cards: Active Accounts, Crews Scheduled Today, Accounts At Risk, Open Deployments, SLA Breaches, Revenue Scheduled Today. |
| **Requires Action rail** | Full-width panel listing urgent operational tasks (from ops recommended actions or mock). |
| **Main grid** | Desktop 12-col: Left 4 cols (Territory Coverage), Center 5 cols (Live Deployments + Account Health Watchlist), Right 3 cols (Crew Capacity + Upcoming Go-Lives). |

---

## 2. File-by-file implementation

| File | Purpose |
|------|--------|
| `src/lib/ops/ops-command-center-types.ts` | Types: `OpsCommandCenterKPIs`, `UrgentActionItem`, panel item types, `OpsCommandCenterData`. |
| `src/lib/ops/ops-command-center-mock.ts` | Mock data for all KPIs and panels when real APIs are not wired. |
| `src/lib/ops/getOpsCommandCenterData.ts` | Server: aggregates dashboard + ops command center data, org name; returns `OpsCommandCenterData`. |
| `src/components/ops/ops-command-center/OpsPanelShell.tsx` | Reusable panel: title, description, action slot, consistent padding and min-height. |
| `src/components/ops/ops-command-center/OpsHeader.tsx` | Header: title, subtitle, org, date/time, quick actions. |
| `src/components/ops/ops-command-center/OpsKpiStrip.tsx` | Six KPI cards in a single grid (2/3/6 cols). |
| `src/components/ops/ops-command-center/ActionRail.tsx` | Full-width “Requires Action” panel; lists urgent items with links. |
| `src/components/ops/ops-command-center/TerritoryCoveragePanel.tsx` | Left panel: territory coverage list (scheduled vs account count, %). |
| `src/components/ops/ops-command-center/LiveDeploymentsPanel.tsx` | Center top: live deployments from service_deployments (mock for now). |
| `src/components/ops/ops-command-center/AccountHealthWatchlistPanel.tsx` | Center bottom: account health watchlist (risk score, reason). |
| `src/components/ops/ops-command-center/CrewCapacityPanel.tsx` | Right top: crew capacity (scheduled today vs capacity, %). |
| `src/components/ops/ops-command-center/UpcomingGoLivesPanel.tsx` | Right bottom: upcoming go-lives (account, date, type). |
| `src/components/ops/ops-command-center/OpsCommandCenterPage.tsx` | Composes header, KPI strip, action rail, main grid. |
| `src/components/ops/ops-command-center/index.ts` | Barrel export for all Ops Command Center components. |
| `src/app/app/ops/command-center/page.tsx` | Server page: auth, `getOpsCommandCenterData(orgId)`, renders `OpsCommandCenterPage`. |

---

## 3. Component tree

```
OpsCommandCenterPage
├── OpsHeader (title, subtitle, orgName, date/time, quickActions)
├── OpsKpiStrip (kpis)
├── ActionRail (urgentActions)
└── Grid (lg:grid-cols-12)
    ├── lg:col-span-4  → TerritoryCoveragePanel (territoryCoverage)
    ├── lg:col-span-5  → [ LiveDeploymentsPanel (liveDeployments), AccountHealthWatchlistPanel (accountHealthWatchlist) ]
    └── lg:col-span-3  → [ CrewCapacityPanel (crewCapacity), UpcomingGoLivesPanel (upcomingGoLives) ]
```

Each panel uses **OpsPanelShell** (title, description, action, children, minHeight).

---

## 4. Helper types (`ops-command-center-types.ts`)

- **OpsCommandCenterKPIs** — `activeAccounts`, `crewsScheduledToday`, `accountsAtRisk`, `openDeployments`, `slaBreaches`, `revenueScheduledToday`.
- **UrgentActionItem** — `id`, `type`, `title`, `subtitle`, `href`, `priority`.
- **TerritoryCoverageItem** — `territoryName`, `accountCount`, `scheduledCount`, `coveragePct`, `status`.
- **LiveDeploymentItem** — `accountName`, `deploymentType`, `stage`, `requestedAt`, `href`.
- **AccountHealthWatchlistItem** — `accountName`, `riskScore`, `riskLevel`, `topReason`, `href`.
- **CrewCapacityItem** — `crewName`, `scheduledToday`, `capacity`, `utilizationPct`, `status`.
- **UpcomingGoLiveItem** — `accountName`, `goLiveDate`, `deploymentType`, `href`.
- **OpsCommandCenterData** — all of the above arrays + `userName`, `orgName`.

---

## 5. Mock data (`ops-command-center-mock.ts`)

- **getOpsCommandCenterMock(userName, orgName)** returns a full `OpsCommandCenterData` with sample KPIs, 3 urgent actions, 3 territories, 2 live deployments, 2 health items, 3 crew rows, 2 go-lives.

---

## 6. Connecting to real JANIBEAR data

| Data | Current source | Future wiring |
|------|----------------|----------------|
| **KPIs** | `getCommandCenterData` (dashboard): `accountHealth.totalAccounts`, `crew.totalCrews`, `accountHealth.countBelow60`, `risk.totalRisk`, `revenue.todayTotal`. Open Deployments: mock → query `service_deployments` where `stage` not `stabilization_complete`. | Add `openDeployments` count from `service_deployments`. |
| **Urgent actions** | Ops `getCommandCenterData(orgId).recommendedActions` mapped to `UrgentActionItem`. | Already wired when ops data is available. |
| **Territory coverage** | Mock. | Use `shift_coverage` / territories + account counts and scheduled counts by territory. |
| **Live deployments** | Mock. | `service_deployments` where `stage` in (`crew_assignment`, `go_live_prep`, `live_monitoring`) order by `requested_at`. |
| **Account health watchlist** | Mock. | Ops `riskAccounts` or `account_risk_snapshots` filtered by risk level. |
| **Crew capacity** | Mock. | Crews + schedules/shifts for today; compute scheduled vs capacity. |
| **Upcoming go-lives** | Mock. | `service_deployments` where `stage` = `go_live_prep` or `live_monitoring` with `requested_at`/go-live date in future. |

---

## 7. Layout rules

- Single grid for main content: `grid-cols-1 lg:grid-cols-12` with fixed column spans (4, 5, 3). No mixed flex-wrap in the same band.
- Consistent gap: `gap-6` between sections and grid cells.
- Panel min-heights: `OpsPanelShell` uses `min-h-[260px]` by default; Territory uses `min-h-[320px]`.
- Shell: `max-w-[1600px]`, `px-4 sm:px-6 lg:px-8`, `py-6`, `space-y-6`.

---

## 8. Quick actions

- **Date** — Links to command-center with date query (can be extended with a date picker).
- **Map** — Links to `/app/map` for territory/location view.
