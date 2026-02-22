# JANIBEAR Sales Module — UI/UX Design Spec

**Designer Agent output.** Layout, component structure, interaction patterns, states, and visual hierarchy only. No business-logic or server-action changes. Aligns with existing JANIBEAR design system (Tailwind, shadcn/ui, enterprise components). Implement so the Sales flow feels like a **deal machine**: enterprise, fast, inevitable.

---

## 1. Existing patterns to match

Use these as the foundation; do not introduce a new style system.

| Pattern | Location | Use for |
|--------|----------|---------|
| **SalesPageShell** | `src/components/sales/page-shell.tsx` | Every Sales page: optional breadcrumb, optional left rail, main content. |
| **PageHeader** (sales) | `src/components/sales/page-header.tsx` | Title, description, primaryCta, secondaryActions, filters row. |
| **RightDrawer** | `src/components/sales/right-drawer.tsx` | Quick view/edit + next-step actions (wraps `SlideOverDrawer`). |
| **SlideOverDrawer** | `src/components/enterprise/slide-over-drawer.tsx` | Backdrop, close on Escape, title + scrollable body. |
| **Card / Badge / Button / Table** | `src/components/ui/*` | Standard shadcn. Cards: `rounded-2xl border border-border bg-card`, padding `p-6`. |
| **EmptyState** | `src/components/enterprise/empty-state.tsx` | Icon, title, description, action. |
| **LoadingSkeleton, KpiRowSkeleton** | `src/components/enterprise/loading-skeleton.tsx` | Section/full-page loading. |
| **SectionCard** | `src/components/enterprise/section-card.tsx` | Section wrapper with optional title/description. |
| **Typography** | Existing | `font-heading`, `text-2xl font-bold tracking-tight text-foreground`, `text-sm text-muted-foreground`. |
| **Spacing** | Existing | `space-y-6` / `space-y-8` between sections; `gap-4` in grids; `p-4 md:p-6` page padding. |

---

## 2. Global layout system (apply to ALL Sales pages)

### 2.1 Stepper rail — “Where am I in the workflow?”

- **Placement:** Directly under the app header (or under Sales breadcrumb), full width, subtle.
- **Steps:**  
  **Leads** → **Pipeline** → **Account** → **Walkthrough** → **Scope** → **Proposal** → **Contract Launch** → **Launch Intake**
- **Behavior:** Current section highlighted (e.g. `text-foreground font-medium`); others `text-muted-foreground`. Clickable links to each module. Compact: single row, possibly truncate on small screens (e.g. “Leads · Pipeline · … · Launch Intake”).
- **Component:** New optional **SalesStepperRail** (or inline in SalesPageShell). No new visual style—use existing borders and text tokens.

### 2.2 Page template (every Sales page)

- **PageHeader**
  - **Title** — one clear noun (e.g. Leads, Pipeline, Accounts).
  - **Subtitle** — one short line (optional): what this module is and what to do next.
  - **Primary CTA** — right side, single main action (e.g. New Lead, Schedule Walkthrough, Submit to Operations).
  - **Secondary actions** — icon buttons or outline buttons (e.g. Board/Table toggle, Calendar/List, Export, Filters).
  - **Filter chips row** — when the page has list/board views: status, stage, date range, saved view. Use existing Button `variant="outline"` / `variant="default"` for active state.
- **Body**
  - **Optional left “Saved Views” rail** — only where applicable (e.g. Leads, Pipeline, Accounts). Narrow column (`w-52`), list of saved filters/views; reuse existing `SalesPageShell` `leftRail` prop.
  - **Main content** — Table, Board, or Detail. Same density: readable but high-info (compact rows, clear hierarchy).
- **Right Drawer**
  - Opens from row/card click or “Quick view” action.
  - Contents: summary at top, then quick-edit fields or read-only blocks, then **next-step actions** (e.g. Convert to Opportunity, Schedule Walkthrough, Create Scope).
  - Width: keep `max-w-xl` for Sales (existing `RightDrawer`).
- **Spacing / density**
  - Header: `pb-4 border-b border-border/60`, `space-y-4` between title row and filters.
  - Body: `p-4 md:p-6 space-y-6`.
  - Table: default row height comfortable for scanning; hover state `hover:bg-muted/50`.

---

## 3. Module-by-module design specs

### 3.1 Leads

**Component tree**

- **Page:** SalesPageShell (breadcrumb: Sales / Leads).
- **Header:** PageHeader (title: “Leads”, description: “Unqualified contacts — convert to Opportunity to move into Pipeline.”, primaryCta: “New Lead”, optional secondaryActions: e.g. Import, optional filters: Status).
- **Body:** LeadsTableWithDrawer (table + right drawer). Optional left rail: Saved views (e.g. “All”, “New”, “Contacted”, “No activity 7d”).
- **Drawer:** RightDrawer — “Lead Quick View”:
  - **Contact card** (company, contact name, email, phone, address).
  - **Notes** (read/edit).
  - **Activity timeline** (calls, tasks, touches).
  - **Prominent “Convert to Opportunity”** button.
  - Secondary: Log call, Create task, Disqualify, “Open full lead page”.
- **Modal:** Convert to Opportunity — **2-step**:
  - **Step 1:** Account (create new or select existing).
  - **Step 2:** Opportunity (stage, value, close date).
  - Buttons: Back, Next, Convert.

**Layout notes**

- Table: columns **Company + Contact** (prominent, combined cell), Source, Status, Last touch, Owner, Next step, Created. Row hover reveals subtle quick-action affordance (e.g. icon buttons for call/task) if desired; primary action = click row → open drawer.
- Drawer: sections separated by `border-t border-border`; primary CTA at bottom of drawer or sticky above actions.

**Interactions**

- **Opens drawer:** Click table row.
- **Modal:** “Convert to Opportunity” in drawer opens 2-step modal; on success close drawer and refresh list; toast: “Lead converted to opportunity.”
- **Full page:** “Open full lead page” → `/app/sales/leads/[id]`.

**Copy**

- Empty state title: **No leads yet**
- Empty state description: Add your first lead or import from a list.
- Empty state actions: **New Lead** (primary), **Import leads** (secondary).
- Primary CTA: **New Lead**
- Drawer CTA: **Convert to Opportunity**
- Modal step 1 title: **Choose or create account**
- Modal step 2 title: **Set opportunity details**

---

### 3.2 Pipeline

**Component tree**

- **Page:** SalesPageShell (breadcrumb: Sales / Pipeline).
- **Header:** PageHeader (title: “Pipeline”, description: “Qualified opportunities by stage. Click a card to open details.”, primaryCta: none or “New opportunity” if applicable, secondaryActions: **Board** / **Table** toggle, optional filters: Stage, Date range).
- **Body:** PipelineBoardTableWithDrawer. Default: **Board** view. Optional left rail: Saved views.
- **Board:** Columns = stages; each column: stage name + count; cards per opportunity.
- **Card (board):** Account name, value (est. MRR/value), Next step + due date, Last activity + **stale warning badge** (e.g. “No activity 7d” — muted-foreground or amber).
- **Drawer:** RightDrawer — “Opportunity”:
  - **Summary at top** (account, value, stage).
  - **Inline stage change** (dropdown or buttons).
  - **Next actions:** Schedule Walkthrough, Create Scope, Generate Proposal (as links/buttons).
  - **Linked artifacts** list with statuses (walkthrough, scope, proposal — with links).

**Layout notes**

- Board: stage columns `w-72 shrink-0`; cards compact, `rounded-lg border bg-card`; drag optional for later.
- Table view: same data, columns Account, Stage, Value, Next step, Last activity, Stale; row click → drawer.
- Stale/at-risk: badge or small label when last_activity older than threshold (e.g. 7 days).

**Interactions**

- **Opens drawer:** Click board card or table row.
- **Stage change:** In drawer, inline; on save → toast “Stage updated,” optional refresh.
- **Next actions:** Navigate to Walkthroughs (schedule), Scope, or Proposals (generate). No modal unless creation flow requires it.
- **Table/Board:** Toggle in header; persist preference in URL or local state.

**Copy**

- Empty state (no opportunities): **No opportunities yet** — Convert a lead to add one to the pipeline.
- Card stale: **No activity 7d** (or configurable threshold).
- Drawer CTA: **Schedule Walkthrough** | **Create Scope** | **Generate Proposal**

---

### 3.3 Accounts

**Component tree**

- **Page (list):** SalesPageShell + PageHeader (title: “Accounts”, description: “Prospects and customers — walkthroughs, scope, and proposals live here.”, primaryCta: “New Account”, filters: All / Prospects / Customers) + AccountsListWithFilter (or table) + optional left rail **Saved views**.
- **Page (detail):** SalesPageShell (breadcrumb: Sales / Accounts / [Name]). **Account Summary Strip** at top, then **Tabs:** Overview | Walkthroughs | Scope | Proposals | Activity.

**Layout notes**

- **Account Summary Strip:** Key stats (e.g. open opportunities, next walkthrough), current stage/status, **Next action** (e.g. “Schedule walkthrough” or “Create scope”). Single horizontal strip, Card or bordered bar; compact.
- **Tabs:** Use shadcn Tabs. Content under each tab feels **nested under Account** (same page, no full navigation away); Walkthroughs/Scope/Proposals show lists or cards that link to their detail pages.
- List: search + filter; rows show name, status, primary location, counts (opportunities, walkthroughs). Click row → account detail (full page).

**Interactions**

- **Full page:** List → Account detail. Detail tabs are in-page; links to Walkthrough/Scope/Proposal go to their modules with context (e.g. account id in URL or back link).
- **Drawer:** Optional quick-view drawer from list row (same pattern as Leads) with summary + “Open account” primary action.

**Copy**

- Empty state (no accounts): **No accounts yet** — Create your first account or convert a lead.
- Primary CTA: **New Account**
- Summary strip “Next action”: **Schedule walkthrough** | **Create scope** | **View proposal**

---

### 3.4 Walkthroughs

**Component tree**

- **Page:** SalesPageShell + PageHeader (title: “Walkthroughs”, description: “Site assessments. Create scope from a walkthrough to build a proposal.”, primaryCta: “Schedule Walkthrough”, secondaryActions: **Calendar** / **Table** toggle).
- **Body:** WalkthroughsTableCalendar (existing or enhanced). Default: Table or Calendar based on preference.
- **Detail (full page):** Left: **Captured data** (zones, measurements, floors, restrooms). Right: **Photos/attachments + notes**. Top: **Schedule info** (date, rep, status). **Sticky CTA:** “Create Scope from Walkthrough”.

**Layout notes**

- List/calendar: rows or calendar events show account, date, status; click → detail page.
- Detail: two-column layout on desktop (e.g. 60/40); left = structured scope data, right = media and notes; top bar = schedule + rep + status pill.
- Sticky CTA at bottom or top of right column so it’s always visible.

**Interactions**

- **Full page:** List/calendar → Walkthrough detail. No drawer required for list if detail is the main interaction.
- **Primary CTA on detail:** “Create Scope from Walkthrough” → navigates to Scope Builder with walkthrough context (or opens scope creation flow).

**Copy**

- Empty state: **No walkthroughs yet** — Schedule one from an opportunity to capture site data.
- Primary CTA: **Schedule Walkthrough**
- Detail CTA: **Create Scope from Walkthrough**

---

### 3.5 Scope Builder

**Component tree**

- **Page:** SalesPageShell + PageHeader (title: “Scope Builder”, description: “Define areas, frequencies, tasks, staffing, and supplies. Generate proposal when ready.”, primaryCta: “Generate Proposal” or “Save”, secondaryActions: Save, Duplicate, Export PDF, **Lock**).
- **Body:** **Split pane:** Left = scope structure (zones, frequency, tasks); Right = **cost/output panel** (hours, assumptions, totals).
- **Status pill:** Draft | Final | Locked (Badge). **Lock** opens confirmation modal; modal explains: “Locking prevents edits and creates a snapshot for the proposal.”

**Layout notes**

- Two columns: e.g. `lg:grid-cols-2` or resizable; left = tree or list of zones/tasks; right = summary numbers and assumptions.
- **Change log:** Collapsible panel (e.g. below right panel or in a tab); “View change log”.

**Interactions**

- **Lock:** Button → confirmation modal (“Lock scope? You won’t be able to edit until unlocked. Proposal will use this snapshot.”) → Confirm / Cancel. On confirm, status → Locked, disable edits; show tooltip on disabled fields: “Locked for proposal.”
- **Generate Proposal:** Navigate to proposal build or open proposal creation flow (existing route).

**Copy**

- Lock modal title: **Lock scope?**
- Lock modal body: Locking prevents further edits and creates a snapshot for the proposal. You can unlock later if needed.
- Buttons: **Cancel** | **Lock scope**
- Status: **Draft** | **Final** | **Locked**
- Primary CTA: **Generate Proposal**

---

### 3.6 Proposals

**Component tree**

- **Page:** SalesPageShell + PageHeader (title: “Proposals”, description: “Sent proposals and status. When accepted, open Contract Launch to hand off to Ops.”, primaryCta: “New Proposal”).
- **Body:** List/table: Account, Amount, Status, Last sent, Created; optional Version column. Row click → **Proposal detail** (full page or drawer).
- **Proposal detail:** **Center:** Document preview. **Right:** Config/status panel (version, status, send settings). **Send modal:** Recipients, message, link settings.
- **Accepted state:** **Banner:** “This proposal has been accepted.” + prominent CTA: **Go to Contract Launch**.

**Layout notes**

- List: same density as other tables; status Badge (draft, sent, accepted, rejected).
- Detail: main area = preview (iframe or PDF viewer); right sidebar = metadata + actions. Accepted banner at top of page or above preview, high contrast.

**Interactions**

- **Opens detail:** Row click → full page `/app/sales/proposals/[id]` or drawer (design choice: drawer for speed, page for deep focus).
- **Send:** Button → Send modal (recipients, message, link); on success toast “Proposal sent.”
- **Accepted:** Banner CTA → Contract Launch (launch packet for this deal).

**Copy**

- Empty state: **No proposals yet** — Build one from a walkthrough or scope.
- Primary CTA: **New Proposal**
- Accepted banner: **Proposal accepted.** **Go to Contract Launch** (primary button).
- Send modal title: **Send proposal**

---

### 3.7 Win/Loss

**Component tree**

- **Page:** SalesPageShell + PageHeader (title: “Win/Loss”, description: “Closed opportunities: win rate, deal size, cycle time, and reason codes.”, no primary CTA or “Export”).
- **Body:** **KPI strip** (compact) → **Filters** (date range, outcome: Won/Lost) → **Insights** (optional: top loss reasons, top win sources) → **Table** (Opportunity, Outcome, Value, Closed, Reason/notes, Actions).
- **Loss reason modal:** When capturing or editing loss reason: structured **reasons** (dropdown or chips) + **notes** (textarea). Tone: coaching, not punitive.

**Layout notes**

- KPI strip: Win rate %, Avg deal size, Avg cycle (days), Top loss reasons, Top win sources — reuse KpiCard or compact Card row.
- Table: same as existing; “Reason / notes” column editable or “Add reason” link → modal.
- Visual tone: neutral, data-focused; avoid “cemetery” feel (use “Learn from losses” or “Improve next time” in empty state or modal).

**Interactions**

- **Filters:** Apply to table and KPIs.
- **Loss reason:** “Add reason” or “Edit” → modal (reasons + notes) → Save; toast “Reason saved.”
- **Won:** Optional “Add to nurture” or “Next attempt” for lost deals (link or button).

**Copy**

- Empty state: **No closed opportunities yet** — Mark deals Won or Lost in Pipeline to see them here.
- Loss modal title: **Why did we lose this deal?**
- Loss modal body: Help the team learn. Choose a reason and add notes if helpful.
- Button: **Save reason**

---

### 3.8 Contract Launch (Sales → Ops handoff)

**Component tree**

- **Page (list):** SalesPageShell + PageHeader (title: “Contract Launch”, description: “Ready-for-launch checklist → Submit to Operations. Ops reviews in Launch Intake.”, primaryCta: “New launch packet” if applicable).
- **Body:** List of launch packets with status (Draft, Review, Ready, Submitted); **missing items** or “Ready” badge per row.
- **Page (detail):** **Mission-control layout — 3 columns:**
  - **Column 1:** Deal summary (account, value, key dates).
  - **Column 2:** **Checklist** (required items with validation). Each item: label, done/not done, optional “Fix” link. When all complete → status becomes **Ready**.
  - **Column 3:** **Ops preview** (what Ops will see: scope summary, schedule summary, contacts).
- **Primary CTA:** “Submit to Operations” (enabled when status = Ready). **Status progression UI:** Draft → Ready (all checklist complete) → Submitted.
- **After submit:** **Success screen** (or inline success state): “Submitted to Operations.” + link to **Launch Intake** + short “What happens next” (Ops will review, accept or request changes).

**Layout notes**

- Reuse ContractLaunchThreeColumn pattern: grid `lg:grid-cols-3`, cards per column.
- Checklist: checkmarks or badges; incomplete items clearly marked; “Submit” disabled until Ready.
- **Locked state (after submit):** Same as existing: Alert banner “Submitted to Ops. Scope and proposal edits are locked.” Disabled fields + tooltip: “Locked; contact Ops to request changes.”

**Interactions**

- **Submit:** Button “Submit to Operations” → confirmation if desired → submit → show success + link to Launch Intake; toast “Submitted to Operations.”
- **After submit:** “View in Launch Intake” link; optional “What happens next” expandable or short list.

**Copy**

- Primary CTA: **Submit to Operations**
- Success title: **Submitted to Operations**
- Success body: Ops will review in Launch Intake. You can track status there.
- Button: **View in Launch Intake**
- Locked banner: **This launch has been submitted to Ops.** Scope and proposal edits are locked; contact Ops to request changes.

---

### 3.9 Operations — Launch Intake

**Component tree**

- **Page:** Standard app layout (not Sales shell). Header: “Launch Intake” + short description. **Queue list:** Packets in status Ready or Sent to Ops; **missing items** or validation badges per row.
- **Detail:** **Handoff artifacts** (deal summary, scope, schedule, contacts). **Actions:** **Accept Intake** | **Request Changes** (with message). **Assign ops owner** (dropdown or field). Visual emphasis: “No surprises” — everything Ops needs is visible before accept.

**Layout notes**

- List: packet name/account, status, “Missing: X items” or “Ready” badge; link to detail.
- Detail: same 3-column or stacked layout as Sales view (read-only for Ops); Accept and Request Changes prominent; reason/message for Request Changes in modal or inline.

**Interactions**

- **Accept:** Button → confirm if desired → accept → success + “Account activated” or next steps.
- **Request Changes:** Button → modal or inline: message to Sales, optional reason; on submit, packet status updated, Sales notified (logic out of scope for this spec).

**Copy**

- Page description: **Review Launch Packets from Sales. Accept to activate the account and create schedules; reject to send back with a reason.**
- Empty state: **No packets in queue** — Sales will send packets when they mark them Ready.
- Accept CTA: **Accept Intake**
- Request CTA: **Request Changes**
- Assign: **Assign ops owner**

---

## 4. States and interactions (explicit)

### 4.1 Loading

- **Tables / boards:** Skeleton rows (e.g. 5–10 rows with Skeleton component); no full-page spinner. Reuse `LoadingSkeleton` or table-row skeletons.
- **Drawer:** When drawer opens and data is loading: drawer title “Loading…”, body with skeleton blocks or single “Loading…” text.
- **Detail pages:** Section-level skeletons for each major block (e.g. summary, tabs content).

### 4.2 Empty states

- **Per module:** Use `EmptyState` (icon, title, description, action). Copy per module listed above.
- **Tables:** Single empty row with message + primary action (e.g. “No leads yet. Create one to get started.” + New Lead).

### 4.3 Stalled / at risk

- **Pipeline cards / rows:** Badge or label when last activity &gt; N days (e.g. “No activity 7d”). Style: `text-muted-foreground` or `text-amber-600` (subtle).
- **Launch packet list:** “Missing: 2 items” or “Incomplete” badge when checklist not done.

### 4.4 Toasts (inline, soft)

- **Convert lead:** “Lead converted to opportunity.”
- **Stage change:** “Stage updated.”
- **Generate proposal:** “Proposal created.”
- **Send proposal:** “Proposal sent.”
- **Submit to Ops:** “Submitted to Operations.”
- **Loss reason saved:** “Reason saved.”
- Use existing toast pattern (e.g. `useToast` from shadcn).

### 4.5 Soft lock (submitted to Ops)

- **Contract Launch detail:** When status = Submitted (or Sent to Ops): disabled inputs for scope/proposal sections; tooltip on hover: “Locked; contact Ops to request changes.” Alert banner at top (existing pattern).

---

## 5. File and component reference (for implementers)

| Area | Existing components | New or enhanced |
|------|--------------------|------------------|
| Shell | SalesPageShell, PageHeader | Optional SalesStepperRail (stepper links). |
| Leads | LeadsTableWithDrawer, RightDrawer, ConvertLeadToOpportunityModal | Table row hover quick actions (optional); 2-step convert modal already exists — align steps to Account → Opportunity. |
| Pipeline | PipelineBoardTableWithDrawer, RightDrawer | Stale badge on cards/rows; drawer next actions (links). |
| Accounts | AccountsListWithFilter, AccountSalesTabs | Account Summary Strip; ensure tabs feel nested. |
| Walkthroughs | WalkthroughsTableCalendar | Detail layout (left data, right photos); sticky “Create Scope from Walkthrough”. |
| Scope | ScopeBuilderSplitView | Lock confirmation modal; change log collapsible; right panel = cost/output. |
| Proposals | Table on proposals page | Proposal detail layout (preview + sidebar); Send modal; Accepted banner + CTA. |
| Win/Loss | Existing cards + table | KPI strip compact; filters; Loss reason modal (structured reasons + notes). |
| Contract Launch | ContractLaunchThreeColumn, SendToOpsButton | Status progression (Draft → Ready → Submitted); success screen with link to Launch Intake. |
| Launch Intake | Current list + detail | Queue list with missing-item badges; detail Accept / Request Changes; assign ops owner. |

Use **existing** tokens (`--background`, `--foreground`, `--card`, `--border`, `--muted-foreground`, `--primary`), **existing** spacing (`p-4 md:p-6`, `space-y-6`, `gap-4`), and **existing** components (Card, Badge, Button, Table, Sheet/Drawer, EmptyState, Skeleton). No new design system — only structure, hierarchy, and copy as above.
