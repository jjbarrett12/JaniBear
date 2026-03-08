# Launch Module Refactor — Product Design

**Goal:** Launch is no longer a separate floating section. It lives **inside Sales** (Hunt → Stalk → Kill → **Launch to Ops**) and **inside Ops** (Command Center + **Activations**). The transition from Sales to Ops feels controlled and premium; Activations is where Ops takes ownership of newly won accounts.

---

## 1. Ideal Information Architecture

### 1.1 Mental Model

```
SALES (Grizzly)                          OPS (Kodiak)
─────────────────────────────────────────────────────────────────
Hunt → Stalk → Kill → Launch to Ops  →  Activations → Accounts → …
     (leads)   (pipeline) (handoff)        (intake)    (live)
```

- **Sales** owns the full revenue pipeline through **Launch to Ops**. "Launch to Ops" is the **last step of the sale**: pack the deal, submit to Ops, done.
- **Ops** owns everything after handoff. **Activations** is the **first step of operations** for a new account: receive packet, review, accept (or request changes), then account goes live (schedules, crews, inspections).
- There is **no standalone "Launch" department**. Launch is Sales’ exit and Ops’ entry.

### 1.2 Entity Flow

| Stage | Owner | Entity | UX surface |
|-------|--------|--------|------------|
| Deal won, not yet packed | Sales | Opportunity + Account | Pipeline, Account detail |
| Packing for handoff | Sales | Launch packet (draft / review / ready) | **Launch to Ops** (Sales) |
| Submitted to Ops | Sales (read-only) / Ops (action) | Launch packet (sent_to_ops) | **Launch to Ops** list (Sales); **Activations** queue (Ops) |
| Ops accepted | Ops | Launch packet (accepted); Account active | **Activations** (history); Command Center widgets |
| Post go-live | Ops | Account, schedules, crews, inspections | Command Center, Accounts, Crews, etc. |

### 1.3 Principles

- **Single handoff artifact:** One launch packet per account handoff. Status drives where it appears (Sales vs Ops) and what actions are available.
- **Clear ownership:** Sales = draft → ready → submit. Ops = receive → review → accept or request changes. No shared "Launch" section that both edit.
- **Premium transition:** The moment of "Submitted" and "Accepted" is visible, auditable, and uses consistent status chips and timelines so it never feels duplicated or awkward.

---

## 2. Nav Structure

### 2.1 Current (Good) Baseline

Nav already has **no standalone Launch section**. Use this as the source of truth:

- **Executive:** Dashboard, Financial Health, Alerts, Reports, Map, Benchmarks, HelpHub.
- **Sales (Growth / Grizzly):** Command, Leads, Accounts, Contacts, Pipeline, Walkthroughs, Proposals, **Launch to Ops**, Map.
- **Operations (Kodiak):** **Command Center**, **Activations**, Accounts, Crews, Map, Schedules, Inspections, QC, Issues/SLA, Tasks, Performance, Supplies, Contracts, Service Deployments, Risk, Risk Settings, Reporting.
- **System:** Admin, Users, Invites, Roles, Audit, AI Settings, Training, Pro Gear, Organization.

### 2.2 Naming and Order

| Section | Item | Label (EN) | Purpose |
|---------|------|------------|---------|
| Sales | 1 | Command | Sales cockpit (KPIs, actions) |
| Sales | 2 | Leads | Hunt |
| Sales | 3 | Accounts | Prospects / accounts in pipeline |
| Sales | 4 | Contacts | CRM contacts |
| Sales | 5 | Pipeline | Stalk / Kill (opportunities) |
| Sales | 6 | Walkthroughs | Site visits |
| Sales | 7 | Proposals | Bids / proposals |
| Sales | 8 | **Launch to Ops** | Pack & submit to Ops (alert badge = packets awaiting Ops) |
| Sales | 9 | Map | Territory map |
| Ops | 1 | **Command Center** | Ops cockpit |
| Ops | 2 | **Activations** | Incoming launches; accept / request changes (alert badge = count) |
| Ops | 3 | Accounts | Active accounts |
| … | … | … | (rest unchanged) |

- **Sales:** "Launch to Ops" is one of the list items, not a section. Breadcrumb: **Sales / Launch to Ops**.
- **Ops:** "Activations" is the first operational item after Command Center. Breadcrumb: **Ops / Activations**.

### 2.3 Routes (No Change Required)

- Sales: `/app/sales`, `/app/sales/launch-packets`, `/app/sales/launch-packets/[id]`
- Ops: `/app/ops/command-center`, `/app/ops/launch-intake`, `/app/ops/launch-intake/[id]`

Do **not** introduce `/app/launch` or a third section. Any legacy "Launch" or "Launches" links should redirect to Sales (Launch to Ops) or Ops (Activations) by context.

---

## 3. Sales Screen Breakdown

### 3.1 Sales Command (Grizzly Home)

- **Purpose:** One-screen view of pipeline health and next actions. Simple, aggressive, revenue-focused.
- **Layout:** Same as today: header (title + optional filters) → **KPI strip** → **Action cards** (e.g. leads needing touch, proposals out, walkthroughs this week, stalled deals).
- **Launch in Command:** One **action card** or KPI: "Ready to launch: N" or "Packets awaiting Ops: N" with link to **Launch to Ops**. Not a separate section; one clear CTA into the Launch to Ops list.
- **Tone:** Numbers, links, minimal copy. No long paragraphs.

### 3.2 Sales Pipeline / Accounts / Proposals

- No structural change. From a **won** opportunity or account, primary CTA = **"Launch to Ops"** (create or open launch packet). So "Kill" flows directly into "Launch to Ops" in the UI (e.g. "Create launch packet" on won deal or account).

### 3.3 Sales → Launch to Ops List (`/app/sales/launch-packets`)

- **Purpose:** Where Sales prepares and submits launch packets. Last step of the sale.
- **Screen structure:**
  - **Page title:** "Launch to Ops" (or "Launch to Operations").
  - **Subtitle:** One line: e.g. "Pack won accounts and submit to Ops. They’ll appear in Activations for acceptance."
  - **Primary CTA:** "New launch packet" (from account picker or from won opportunity).
  - **Summary strip (optional but recommended):** Small one-line summary: e.g. "Draft: 3 · Ready: 2 · Submitted: 5". Keeps the pipeline visible without clutter.
  - **Main content:** **Table or card list** of launch packets.
- **List columns (table) or row content (cards):**
  - Account name (link to packet detail).
  - **Status chip** (see §8).
  - Ready date or Submitted date (if applicable).
  - Optional: "Missing items" badge if draft and checklist incomplete.
- **Empty state:** "No launch packets. Create one from a won opportunity or account." + CTA "New launch packet".

### 3.4 Sales → Launch Packet Detail (`/app/sales/launch-packets/[id]`)

- **Purpose:** Complete the packet (scope, schedule draft, contacts, supplies) and submit to Ops.
- **Layout:**
  - Breadcrumb: Sales / Launch to Ops / [Account name].
  - **Header:** Account name, **status chip** (Draft | Review | Ready | Submitted).
  - **Post-submit notice:** If status is sent_to_ops or accepted/rejected, show a single **banner**: "Submitted to Ops. Scope locked. View in Activations." (and link to Ops launch-intake for that packet if ops role, or leave as informational for sales).
  - **Checklist card:** "Ready for launch" — Contract signed / Scope finalized / Schedule set / Contacts / Supplies. Each row: check or empty circle; label. Completion drives "Ready" and submit button state.
  - **Payload sections (cards):** Scope summary, Schedule draft, Contacts, Supplies, etc. (existing ContractLaunchThreeColumn or equivalent.)
  - **Primary action:** "Submit to Ops" when checklist complete and status is draft/review. Disabled with tooltip if incomplete.
  - **Secondary:** "Save" or auto-save; "Back to list".
- **Conversion entry:** If arrived from lead conversion (`?from=conversion`), keep one short success banner: "Deal converted. Complete the launch packet and submit to Ops."

---

## 4. Launch to Ops Screen Breakdown (Inside Sales)

### 4.1 List Page (Already Covered in §3.3)

- Same as **Sales → Launch to Ops list**. No separate "Launch" list; this *is* the Sales view of launch packets.

### 4.2 Detail Page (Already Covered in §3.4)

- Same as **Sales → Launch packet detail**. Focus: **checklist + payload + Submit to Ops**. After submit, Sales sees status "Submitted" and a locked view; no duplicate "Launch" screen.

### 4.3 Status and Copy

- **Sales copy:** "Launch to Ops" everywhere. "Submit to Ops" on the button. Subtitle: "Pack won accounts and submit to Ops. They’ll appear in Activations for acceptance."
- **Status chips (Sales view):** Draft, Review, Ready, Submitted. No "In Ops" or "Activations" in Sales nav; the list just shows "Submitted" and the detail shows the lock banner.

---

## 5. Activations Screen Breakdown (Inside Ops)

### 5.1 Activations List (`/app/ops/launch-intake`)

- **Purpose:** Ops’ queue of launch packets from Sales. Accept or request changes. This is **ownership intake**, not a third department.
- **Screen structure:**
  - **Page title:** "Activations".
  - **Subtitle:** One line: e.g. "New accounts from Sales. Accept to go live; request changes to send back."
  - **Summary strip:** "Awaiting: N · Accepted today: M" (or similar). Keeps urgency and throughput visible.
  - **Main content:** **Table or card list** of packets in status `ready` or `sent_to_ops` (and optionally recently accepted for "Accepted today").
- **List columns (table) or row content (cards):**
  - Account name (link to packet detail).
  - **Status chip:** Awaiting review | Accepted | Changes requested.
  - **Readiness:** e.g. "Ready" or "Missing: scope" (from payload).
  - **Received date** (ready_at or created_at).
  - **Primary action:** "Review" → detail page.
- **Empty state:** "No activations in queue. When Sales submits a launch packet, it will appear here." + optional link to "Launch to Ops" (for users with sales access) or nothing.
- **Filter (optional):** Tabs or filter: "Awaiting" | "Accepted" | "All".

### 5.2 Activations Detail (`/app/ops/launch-intake/[id]`)

- **Purpose:** Review packet and Accept or Request changes. Single screen, no wizard.
- **Layout:**
  - Breadcrumb: Ops / Activations / [Account name].
  - **Header:** Account name, **status chip** (Awaiting review | Accepted | Changes requested).
  - **Ownership message (when accepted):** "You accepted this activation on [date]. Account is live." + link to account or schedules.
  - **Packet content (read-only):** Same payload view as Sales (scope, schedule draft, contacts, supplies). Use **cards** for each section; no edit.
  - **Missing items (if any):** Small **alert strip** or badges: "Missing: scope, schedule" so Ops can request changes with context.
  - **Actions:**
    - **Accept** (primary): "Accept & go live" or "Accept activation". Confirms once; then status → accepted, account activated.
    - **Request changes** (secondary): Opens small form (reason required); on submit, status → rejected, reason to Sales.
  - **Timeline (optional):** Compact timeline: Submitted [date] → [Accepted | Changes requested] [date]. Reinforces single handoff, no duplication.

### 5.3 Ops Copy

- Use "Activations" consistently. "Accept activation" or "Accept & go live". "Request changes" with reason. No "Launch intake" in user-facing copy if you want to avoid legacy wording; "Activations" is clearer.

---

## 6. Command Center Widgets for Newly Won Accounts

### 6.1 Data Source

- **New from Sales:** Packets in `sent_to_ops` (awaiting Ops) and recently `accepted` (e.g. last 7 days). Optionally pull from `launch_packets` + `accounts` (status, created_at, accepted_at).
- **Existing "Upcoming go-lives":** Can merge with "New from Sales" or keep separate. Prefer one widget that combines "Awaiting your action" (sent_to_ops) and "Recently accepted (go-live)" so Ops sees one place for "new account" activity.

### 6.2 Recommended Widget: "Activations" (or "New accounts") in Command Center

- **Placement:** Right column of Ops Command Center (where **Upcoming Go-Lives** lives), or replace/rename that panel to **"Activations"**.
- **Content:**
  - **Awaiting (N):** Packets in `ready` or `sent_to_ops`. List 3–5; each row: account name, "Awaiting review", link to `/app/ops/launch-intake/[id]`.
  - **Recently accepted:** Optional second block: "Accepted this week: 3" with short list (account, date) linking to account or schedule.
- **Panel title:** "Activations" (not "Upcoming go-lives" if we want one concept).
- **Panel action:** "View all" → `/app/ops/launch-intake`.
- **Empty:** "No activations awaiting. New packets from Sales will appear here."

### 6.3 KPI or Action Rail

- **Action rail (Requires Action):** Include "N activations awaiting review" as an urgent action when N > 0, linking to Activations list or first packet.
- **KPI (optional):** One tile "Activations" with value = count awaiting, link to list. Keeps it visible without a full panel.

---

## 7. Role-Based Differences (Sales vs Ops)

| Aspect | Sales | Ops |
|--------|--------|-----|
| **Launch to Ops list** | Sees all packets (draft, ready, submitted). Can create, edit draft, submit. | No access to `/app/sales/launch-packets`. |
| **Activations list** | No access to `/app/ops/launch-intake` (or read-only for "where did my packet go" if product decision). | Sees packets in ready/sent_to_ops (and optionally accepted). Can accept / request changes. |
| **Packet detail (Sales)** | Edit checklist and payload when draft/review; Submit to Ops. After submit: read-only + lock banner. | — |
| **Packet detail (Ops)** | — | Read-only payload; Accept or Request changes. After accept: "Account is live" + link. |
| **Command Center** | N/A (Sales has Command). | Activations widget + action rail for "N awaiting". |
| **Nav** | "Launch to Ops" under Sales. | "Activations" under Ops. |
| **Alerts** | Optional: "N packets ready to submit" or "N submitted (awaiting Ops)". | "N activations awaiting review" (handoffsCount). |

- **Dual-role users:** If a user has both Sales and Ops, they see both nav items. No third "Launch" section. When on Sales they use "Launch to Ops"; when on Ops they use "Activations". Same packet, two views by role.

---

## 8. UI Patterns

### 8.1 Handoff Status Chips

Use a **single status set** for the launch packet; label may differ by context:

| Status (backend) | Sales chip label | Ops chip label |
|------------------|-------------------|----------------|
| draft | Draft | — (not in Ops list) |
| review | Review | — |
| ready | Ready | Awaiting review |
| sent_to_ops | Submitted | Awaiting review |
| accepted | Accepted | Accepted |
| rejected | Changes requested | Changes requested |

- **Visual:** Use semantic variants: Draft/Review = secondary/muted; Ready/Awaiting = default or primary outline; Submitted = default; Accepted = success (green); Rejected/Changes requested = warning (amber) or destructive (red) depending on tone.
- **One chip per row/card.** No stacked statuses.

### 8.2 Readiness

- **Sales:** "Ready for launch" = checklist complete (contract, scope, schedule, contacts, supplies). Show **checklist progress**: "3 of 5 complete" or "Ready to submit."
- **Ops:** "Ready" vs "Missing items". Derive from payload (e.g. scope, schedule_draft present). Show small **badges** "Missing: scope" on list and a short strip on detail so Ops can request changes with reason.

### 8.3 Missing Items

- **Sales (draft):** Inline in checklist: empty circle + label. Optional: "Missing: Schedule, Supplies" badge next to status.
- **Ops:** Badge or short list on card/detail: "Missing: scope, schedule". Do not block Accept; let Ops accept with gaps and handle in operations, or Request changes.

### 8.4 Accepted Ownership

- **After Accept:** Status = accepted. Show one clear line: "Accepted on [date]. Account is live." with link to Account or Schedules. No duplicate "Launch" or "Activation" screen; this is the end of the handoff.
- **Ownership state:** Account is now "owned" by Ops (active). Command Center and Activations can show "Recently accepted" for a short period (e.g. this week).

### 8.5 Start-Date Risk Indicators

- **In packet payload:** If `schedule_draft` or scope includes requested start date, show it in the packet detail (Sales and Ops).
- **Ops Command Center / Activations:** For "Awaiting review" items, show **requested start date** if available. If start date is in the past or within 7 days, show a **risk chip**: "Start soon" or "Start date passed" (amber/red) so Ops prioritizes.
- **Table column (Activations list):** Optional column "Requested start" with date; sort or filter by "at risk" (past or imminent).

### 8.6 Cards

- **List (Sales or Ops):** Prefer **table** for density (account, status, date, action). If cards: one card per packet; same info; status chip on top-right; primary action "Review" or "Open".
- **Detail:** Use **cards** per section: "Ready for launch" (checklist), "Scope", "Schedule", "Contacts", "Supplies". Same card style as rest of app (`bg-card border-border rounded-lg`).

### 8.7 Tables

- **Columns:** Account name | Status | Readiness / Missing | Date (Ready or Submitted) | Action (Review / Open).
- **Sort:** By date (newest first for awaiting; or by requested start date).
- **Row click:** Navigate to detail. Action button for clarity.

### 8.8 Queues

- **Sales:** Single list with status filter or summary strip (Draft / Ready / Submitted). No separate "queue" vs "list"; one list, filtered.
- **Ops:** One queue = "Activations". "Awaiting" = default view; optional "Accepted" / "All" tabs or filter.

### 8.9 Checklist Pattern

- **Sales packet detail:** Vertical list; each row: [check or empty circle] Label. All checked = "Ready to submit". Use semantic colors: checked = muted or success; unchecked = foreground.
- **Do not** use a separate "Launch checklist" page; keep it on the packet detail.

### 8.10 Timeline / Activity Pattern

- **Packet detail (both roles):** Compact timeline at top or bottom:
  - Created [date]
  - Ready [date] (if applicable)
  - Submitted to Ops [date]
  - Accepted | Changes requested [date] (if applicable)
- **Visual:** Small vertical timeline (dots + lines) or a single line of events. Reinforces one handoff, one artifact, no duplication.

---

## 9. Premium Billion-Dollar SaaS Recommendations

### 9.1 Consistency

- **One artifact, two views:** Launch packet is the only handoff object. Sales sees "Launch to Ops"; Ops sees "Activations". Same routes and data; different nav entry and copy. No "Launch" section in the middle.
- **Unified status set:** One status enum; chip labels and colors consistent across list and detail, Sales and Ops.

### 9.2 Hierarchy and Clarity

- **Page title + one subtitle** per screen. No long paragraphs. Summary strip (Draft / Ready / Submitted or Awaiting / Accepted) keeps context without clutter.
- **Primary action per screen:** List = "New launch packet" (Sales) or "Review" (Ops). Detail = "Submit to Ops" (Sales) or "Accept" / "Request changes" (Ops).

### 9.3 Controlled Transition

- **Submit:** One button; confirmation if needed ("Submit to Ops? They’ll see this in Activations."). After submit: lock edits, show "Submitted" and banner.
- **Accept:** One button; confirmation ("Accept & go live? This will activate the account and create schedules."). After accept: success state, link to account/schedules, no extra steps.

### 9.4 Visual and Copy

- **Cards:** Same `Card` component and tokens (`bg-card`, `border-border`, `rounded-lg`/`rounded-xl`). Checklist and payload sections in cards.
- **Status chips:** Semantic variants; no custom colors. Accepted = success; Changes requested = warning/destructive; Draft/Ready/Submitted = default or muted.
- **Copy:** "Launch to Ops" (Sales). "Activations" (Ops). "Submit to Ops", "Accept & go live", "Request changes". No "Launch module" or "Launch department".

### 9.5 Performance and Trust

- **List loading:** Tables or cards load with status and dates first; optional skeleton. No flash of "Launch" then "Activations" wording.
- **Audit:** Handoff events (submitted, accepted, rejected with reason) are already revalidated and can be shown in timeline; consider audit log for compliance.

### 9.6 Implementation Checklist

- [ ] Nav: Confirm no standalone Launch section; Sales = "Launch to Ops"; Ops = "Activations" (see navFactory).
- [ ] Sales list: Summary strip (Draft / Ready / Submitted); table or cards; status chips per §8.1.
- [ ] Sales detail: Checklist card, payload cards, Submit to Ops, post-submit lock banner.
- [ ] Ops list: Summary strip (Awaiting / Accepted); table or cards; "Review" action; empty state copy.
- [ ] Ops detail: Read-only payload, missing-items strip, Accept / Request changes, post-accept message + link.
- [ ] Command Center: Activations panel (awaiting + recently accepted); action rail item when N > 0; link to `/app/ops/launch-intake`.
- [ ] Copy: LAUNCH_HANDOFF_COPY and any nav labels updated to "Launch to Ops" and "Activations"; no "Launch intake" in UI if desired.
- [ ] Start-date risk: Optional requested start date on packet; "Start soon" / "Start date passed" in Ops list or Command Center.
- [ ] Timeline: Optional compact timeline on packet detail (created → ready → submitted → accepted/rejected).

---

## 10. Reference (Current Codebase)

| Concern | Location |
|--------|----------|
| Nav sections | `src/lib/nav/navFactory.ts` (buildSalesSection, buildOperationsSection) |
| Sales launch list | `src/app/app/sales/launch-packets/page.tsx` |
| Sales packet detail | `src/app/app/sales/launch-packets/[id]/page.tsx` |
| Ops activations list | `src/app/app/ops/launch-intake/page.tsx` |
| Ops packet detail | `src/app/app/ops/launch-intake/[id]/page.tsx` |
| Launch handoff copy | `src/lib/launch-handoff-copy.ts` |
| Ops Command Center | `src/components/ops/ops-command-center/`, `src/lib/ops/getOpsCommandCenterData.ts` |
| Upcoming go-lives panel | `src/components/ops/ops-command-center/UpcomingGoLivesPanel.tsx` |
| Launch packet detail (shared) | `src/components/launch/launch-packet-detail.tsx` |
| Nav alerts (handoffsCount) | `src/actions/nav-alerts.ts` |

Use this doc as the single reference for the Launch refactor so the experience stays Sales → Launch to Ops (list + detail) and Ops → Activations (list + detail) + Command Center widgets, with no third Launch section and a clear, premium handoff.
