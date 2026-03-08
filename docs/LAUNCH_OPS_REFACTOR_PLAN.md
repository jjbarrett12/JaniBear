# Launch / Ops Refactor — Architecture and Implementation Plan

**Goal:** Refactor so Launch is no longer a standalone module between Sales and Ops. Sales owns pursuit through handoff packaging; Ops owns intake, activation, and go-live. One handoff/activation model with role-specific views.

**Target structure:**
- **Sales (Grizzly):** Hunt → Stalk → Kill → **Launch to Ops** (Sales ends with handoff)
- **Ops (Kodiak):** **Command Center** → **Activations** → Accounts → Crews → Mapping → Inspections → Issues → Performance

---

## 1. Current Architecture Audit

### 1.1 Nav (pre-refactor)

| Section   | Items |
|----------|--------|
| Executive | Dashboard, Financial Health, Alerts, Reports, Map, Benchmarks, HelpHub |
| Sales     | Command, Leads, Accounts (Prospects), Contacts, Pipeline, Walkthroughs, Proposals, Map |
| **Launch** (standalone) | Activation Queue → `/ops/launch-intake`, Launch to Operations → `/sales/launch-packets`, Scope Packet → `/sales/scope`, Handoff Checklist → `/ops/launch-intake`, Staffing Plan → `/ops/launches`, Go-Live Calendar → `/ops/launches`, First Inspection Setup → `/ops/launch-intake`, 30-Day Review → `/ops/launches` |
| Operations | Accounts (Active), Crews, Schedules, Inspections, QC, Issues, Tasks, Supplies, Contracts, Command Center, Service Deployments, Performance, Risk, Risk Settings, Reporting, Map |
| System    | Admin, Users, Invites, Roles, Audit, AI Settings, Training, Pro Gear, Organization |

Problems:
- Launch section mixes **sales routes** (launch-packets, scope) and **ops routes** (launch-intake, launches) and appears as a separate “phase,” which blurs ownership.
- Ops users must open “Launch” to get to Activation Queue / Launches; Sales users must open “Launch” to get to Launch to Operations. Confusing.

### 1.2 Routes

| Route | Purpose | Owner (logical) |
|-------|---------|------------------|
| `/app/sales/launch-packets` | List/create launch packets; submit to Ops | **Sales** |
| `/app/sales/launch-packet/[id]`, `/app/sales/launch-packets/[id]` | Edit packet, submit | **Sales** |
| `/app/sales/scope` | Scope packet builder | **Sales** |
| `/app/ops/launch-intake` | Queue of packets from Sales; accept/request changes | **Ops** |
| `/app/ops/launch-intake/[id]` | Accept/reject packet, activate | **Ops** |
| `/app/ops/launches` | Launch plans (opportunity-based); staffing, go-live, 30-day | **Ops** |

No duplication: same pages, different nav placement by role.

### 1.3 Data Model (current)

- **launch_packets** (account-centric): Sales creates; status `draft | review | ready | sent_to_ops | accepted | rejected`. Ops accepts → `activateLaunchPacket()` creates service agreement / lines / assignments. **Canonical handoff artifact.**
- **launch_plans** (opportunity-centric): One per opportunity; status `draft | sales_ready | ops_ready | launched | blocked`. Used for staffing, go-live calendar, 30-day review. **Ops execution timeline.**
- **service_agreements**, **service_agreement_lines**, **crew_assignments**, etc.: Created when Ops accepts a launch packet or sets up an account.

---

## 2. What Parts of Launch Belong in Sales

- **Launch to Operations** — Creating and submitting launch packets (ready-for-handoff checklist). Sales ends here.
- **Scope Packet** — Building scope for the handoff (can live under Sales as “Scope” or inside Launch to Ops flow).
- **Launch packets list** — Draft → Review → Ready → Submit. Sales-owned; link in Sales nav.

---

## 3. What Parts Belong in Ops

- **Activations** — Intake queue: packets from Sales; accept / request changes; activate (create agreements, schedules, crews). Ops begins here.
- **Launch plans / Launches** — Staffing plan, go-live calendar, first inspection setup, 30-day review. All ops execution; can live under “Activations” or a sub-view (e.g. “Launch plans”).
- **Handoff checklist** — Ops view of what’s needed per packet; same data as launch-intake, different framing.

Avoid duplicating pages: one route per function (e.g. one launch-intake page), with nav entry under Ops “Activations.” Optionally one “Launches” (launch plans) page under Ops.

---

## 4. Canonical Handoff/Activation Data Model

Single underlying model, two surfaces:

| Concept | Table(s) | Sales view | Ops view |
|--------|----------|------------|----------|
| Handoff packet | `launch_packets` | Create, complete, submit | Queue, accept, request changes |
| Handoff readiness | `launch_packets.payload_jsonb`, status | Draft → Ready → Sent | Ready / Sent → Accepted / Rejected |
| Activation | `activateLaunchPacket()` → `service_agreements`, lines, assignments | — | Accept → create agreement, schedules, crews |
| Launch plan (timeline) | `launch_plans` | Optional read (e.g. “when is go-live”) | Staffing, go-live, 30-day review |

Support both:
- **New-account launches:** Sales submits packet → Ops accepts → activation creates new account/service setup.
- **Ops-only activation events:** Crew changes, recovery transitions, restart activations can use same `service_agreements` / schedules; no need for a new launch_packet unless re-onboarding. (Future: “activation type” or separate ops-only flows that don’t create packets.)

---

## 5. Lifecycle Statuses

**Sales (opportunity / proposal):**  
Lead → Walkthrough → Proposal → Won → **Launch packet created** → **Submitted to Ops**.

**Handoff (launch_packets):**  
`draft` → `review` → `ready` (Sales) → `sent_to_ops` (Sales submit) → `accepted` | `rejected` (Ops).

**Launch plan (launch_plans):**  
`draft` → `sales_ready` → `ops_ready` → `launched` | `blocked`.

**Account (post-activation):**  
Active Account → (Cancelled | Attrition) → Past Account (align with `accounts.status` and canonical language).

---

## 6. Recommended Nav Structure

**Sales**
- Command, Leads, Accounts (Prospects), Contacts, Pipeline, Walkthroughs, Proposals  
- **Launch to Operations** → `/app/sales/launch-packets`  
- (Optional) Scope → `/app/sales/scope`  
- Map  

**Ops**
- **Command Center** → `/app/ops/command-center`  
- **Activations** → `/app/ops/launch-intake` (queue of packets + link to launch plans if desired)  
- Accounts (Active), Crews, Map, Schedules, Inspections, Issues, Performance, Risk, Reporting, etc.

**Removed**
- Standalone **Launch** section (all items redistributed to Sales or Ops).

Optional: Under Ops, a second item “Launch plans” → `/app/ops/launches` for staffing/go-live/30-day, or fold into Activations as tabs/links. Phase 1: one “Activations” item pointing to launch-intake; launch plans reachable from there or from a direct link.

---

## 7. Exact File-Level Implementation Plan

### Phase 1 (nav and module ownership)

| File | Change |
|------|--------|
| `src/lib/nav/navFactory.ts` | Remove `buildLaunchSection()`. Add to Sales section: item “Launch to Operations” (`navLaunchToOperations`) → `/app/sales/launch-packets`. Add to Ops section (near top): “Activations” (`navActivations`) → `/app/ops/launch-intake`. Reorder Ops: Command Center, Activations, Accounts, Crews, Map, then Schedules, Inspections, … |
| `src/lib/app-translations.ts` | Add `navActivations: 'Activations'` (EN) and Spanish. |
| `src/lib/ops-command-copy.ts` | In `upcomingGoLives.action`, change “Launch intake” to “Activations” (or “View activations”). |

### No changes (preserve)

- All route paths: `/app/sales/launch-packets`, `/app/ops/launch-intake`, `/app/ops/launches`, `/app/sales/scope`.
- All pages and components; only nav and labels change.
- DB, actions, API: no schema or API changes in Phase 1.

### Phase 2 (optional later)

- Add “Launch plans” under Ops (e.g. “Launch plans” → `/app/ops/launches`) if not folded into Activations.
- Unify “Activations” page to show both packet queue and launch plans (tabs or sections).
- Add activation type or ops-only activation flows for crew changes / recovery / restart.

---

## 8. QA and Rollback

**QA**
- [ ] Sales nav: “Launch to Operations” links to `/app/sales/launch-packets`.
- [ ] Ops nav: “Activations” links to `/app/ops/launch-intake`; no standalone “Launch” section.
- [ ] Ops order: Command Center, Activations, Accounts, Crews, …
- [ ] All existing launch/launch-intake/launches pages still work at same URLs.
- [ ] Ops Command Center panel “Upcoming Go-Lives” action says “Activations” (or “View activations”).

**Rollback**
- Restore `buildLaunchSection()` in navFactory and call it in `buildNavSections`.
- Remove “Launch to Operations” from Sales and “Activations” from Ops.
- Revert `navActivations` and ops-command-copy change.
