# Account Intelligence Profile — Product Design

**Goal:** AI quietly prepares and maintains an evolving **Account Intelligence** profile per account so sales reps don’t waste time compiling handoff packets and Ops can instantly understand a new account. One brain, many surfaces.

**Design goals:** Clean, low clutter, premium SaaS, action-oriented, confidence-building, easy for Sales and Ops to trust quickly.

---

## 1. Mental Model

### 1.1 What It Is

- **Account Intelligence** = one evolving profile per account (and optionally per lead, merged when lead → account).
- **Sources:** Emails, calls, walkthrough notes, proposals, scope, locations, contacts, inspections, schedules. AI infers, fills gaps, and keeps a structured summary + readiness + recommendations.
- **Surfaces:** No single "Intelligence" page. Intelligence **surfaces in context** during Hunt, Stalk, Kill, Launch to Ops (Sales) and Activations, Accounts, Mapping, Inspections (Ops).
- **Trust:** Clear **estimated vs confirmed**, **confidence/verification**, and **missing items** so users know what’s solid vs inferred.

### 1.2 Principles

- **Quiet:** AI works in the background; users see results, not "AI is thinking" unless loading.
- **Progressive:** Early (Hunt) = thin slice (contact, intent, next step). Later (Kill, Launch, Activations) = full slice (scope, staffing, route, readiness).
- **Action-oriented:** Every surface answers: what’s ready, what’s missing, what to do next.
- **One source of truth:** Same profile feeds list summaries, detail headers, and handoff/activation flows. No duplicate "intelligence" screens; intelligence is embedded.

---

## 2. Shared Components (Design Spec)

These components are reused across Sales and Ops surfaces. Same look and behavior everywhere.

### 2.1 Account Intelligence Summary Card

**Purpose:** One compact card that gives "everything you need in 10 seconds" for this account.

**Layout:**
- **Container:** Single card, `bg-card border border-border rounded-xl`. Optional soft left accent: `border-l-4 border-primary` when profile is mature; muted when thin.
- **Header:** "Account intelligence" (small label, `text-xs font-medium uppercase tracking-wider text-muted-foreground`) + optional "Updated [relative time]" right-aligned.
- **Body (grid or list):**
  - **One-line summary:** AI-generated 1–2 sentence summary. e.g. "2 locations, 18k sq ft total. Contract signed; start in 2 weeks. Suggested crew: Alpha (route fit 88)."
  - **Key facts row (optional):** Locations · Sq ft · Start date · Contract status · Suggested crew (or "—"). Use pills or short labels so it scans.
- **Footer:** "View full profile" link or "See details" → expands inline / goes to dedicated section. No button unless it’s the primary CTA of the page.

**Variants:**
- **Collapsed (list/dashboard):** Summary only (one line) + readiness pill. Tap/click to expand or navigate to detail.
- **Expanded (detail):** Summary + key facts + optional "What we know" bullets (sources: proposal, walkthrough, email).

**Copy:** Neutral. "Account intelligence" not "AI summary." Summary in third person or passive: "Contract signed…" not "We think…"

---

### 2.2 Confidence / Verification Strip

**Purpose:** Show how much of the profile is **verified** (user- or system-confirmed) vs **estimated** (inferred). Builds trust without clutter.

**Layout:**
- **Strip:** Single horizontal bar or row, below summary card or at top of intelligence section.
- **Content:**
  - **Verified:** "X of Y fields verified" or "Scope · Start date · Contacts verified." Use checkmark icon; color success (green) or muted.
  - **Estimated:** "Sq ft · Labor estimate from proposal." Use soft icon (e.g. dash or estimate); color muted.
  - **Confidence (optional):** One word or pill: "High" | "Medium" | "Low" for overall profile. Only show when meaningful (e.g. post-walkthrough).

**Visual:**
- Minimal. Small text `text-xs text-muted-foreground`. Optional: two segments in a slim bar (verified % vs estimated %); no heavy chart.
- **Do not** block actions on "low confidence"; show the strip so users can decide.

**Where:** Detail pages (Lead, Opportunity, Account, Launch packet, Activation). Optionally in list as tooltip or column "Profile: 80% verified."

---

### 2.3 Readiness Indicators (Proposal / Handoff / Activation)

**Purpose:** At a glance, is this account **ready for proposal**, **ready for handoff**, or **ready for activation**? One indicator per context.

**Layout:**
- **Single row or pill.** Label + status.
  - **Proposal readiness:** "Proposal: Ready" | "Proposal: Missing scope" | "Proposal: 3 of 5". Color: success when ready, warning when missing, default when in progress.
  - **Handoff readiness:** "Handoff: Ready" | "Handoff: Missing schedule" | "Handoff: 4 of 5". Same logic.
  - **Activation readiness:** "Activation: Ready" | "Activation: Missing crew" | "Activation: Pending Ops". Same logic.
- **Interaction:** Click/tap → scroll to **Missing-items panel** or open it. Readiness and missing items are linked.

**Placement:**
- **Sales:** On Lead/Opportunity/Account detail and on Launch packet detail. Show "Proposal readiness" in Stalk/Kill; "Handoff readiness" in Launch to Ops.
- **Ops:** On Activation detail. Show "Activation readiness" (ready for accept vs missing items / pending).

**Visual:** Pill or inline. e.g. `Ready` in green pill; `3 of 5` in amber pill; `Missing scope` in muted + link. Same component everywhere: `<ReadinessIndicator stage="handoff" value="4" total="5" missing={["schedule"]} />`.

---

### 2.4 Missing-Items Panel

**Purpose:** Clear list of what’s **missing** to reach the next milestone (proposal, handoff, or activation). Action-oriented.

**Layout:**
- **Container:** Card or bordered block. Title: "Missing for [Proposal | Handoff | Activation]".
- **List:** Bullets or checklist. Each line: short label + optional "Add" / "Complete" link to the right place (e.g. "Scope → Add from proposal", "Schedule → Set in packet").
- **Empty state:** "Nothing missing. Ready for [next step]." with checkmark. Muted text.
- **When to show:** Only when there are missing items, or when readiness is not 100%. If ready, show compact "All set" in the readiness indicator and hide or collapse the panel.

**Visual:** Simple list. `text-sm`. Links use `text-primary hover:underline`. No icons unless it helps (e.g. scope, calendar, user).

**Placement:** Below readiness indicator on the same page (Lead, Opportunity, Account, Launch packet, Activation). Keep it short (3–7 items max); if more, group or summarize.

---

### 2.5 AI Recommendation Panels

**Purpose:** Surfaces for **suggested** crew, route, labor, or next step. Always "Suggested" / "Recommended"; never "Assigned" (JaniBear OS).

**Pattern:**
- **Panel:** Card with header "Suggested [crew | route | next step]" and optional confidence pill.
- **Body:** 2–5 key values (e.g. crew name, route fit, weekly hrs). One short **reasoning line** if helpful.
- **Action:** "Use suggestion" or "Override" (or inline in Activations flow). No auto-apply.

**Variants by surface:**
- **Sales (Stalk/Kill):** "Suggested proposal scope" or "Suggested start date" — thin; link to proposal/packet.
- **Sales (Launch to Ops):** "Suggested crew" + route fit (preview); full recommendation lives in Ops Activations.
- **Ops (Activations):** Full panel per Activations AI doc (crew, supervisor, headcount, labor, route fit, reasoning).
- **Ops (Accounts):** "Suggested crew" + "Route fit" for live account; link to Schedules or Crews.

**Visual:** Same card style as rest of app. Left border accent optional. Reasoning in `text-sm text-muted-foreground`.

---

### 2.6 Staffing and Route-Fit Summaries

**Purpose:** One-line or compact block for **labor** and **route** so Ops (and Sales at handoff) see fit without opening full recommendation.

**Staffing summary:**
- **Content:** e.g. "28 hrs/wk · 2 crew · Crew Alpha (suggested)."
- **Display:** Single line or two. Use "suggested" when from AI; no label when from contract/proposal (confirmed).
- **Where:** Account detail, Launch packet, Activation detail, Command Center widgets.

**Route-fit summary:**
- **Content:** e.g. "Route fit 88 · +6 min travel · North cluster."
- **Display:** Pills or short line. Same 0–100 and color rules as Activations (green/default/amber).
- **Where:** Same as staffing; Mapping view can show route-fit layer or tooltip per account.

**Estimated vs confirmed:** If labor is from **proposal/contract**, show no "est." and optionally "From contract." If from **AI**, show "Est." or "Suggested" so it’s clear.

---

### 2.7 Estimated vs Confirmed Values

**Purpose:** Users must instantly see whether a value is **confirmed** (from contract, walkthrough, user input) or **estimated** (AI or proposal draft).

**Rules:**
- **Display:** No extra UI for confirmed; it’s the default. For **estimated** values, use one of:
  - **Label:** "Est." or "Suggested" next to the value (e.g. "28h (est.)", "Crew Alpha (suggested)").
  - **Typography:** Estimated in slightly muted color; confirmed in default foreground.
  - **Icon:** Small dash or "~" before number; tooltip "Estimated from proposal."
- **Do not** use both label and icon; pick one and stay consistent.

**Where:** Any surface showing sq ft, labor, start date, crew, route fit. Apply in summary card, recommendation panels, staffing/route summaries, and tables.

**Copy:** "Confirmed" only when you need to stress it (e.g. "Start date confirmed"). Otherwise "Est." / "Suggested" on the uncertain ones.

---

### 2.8 Premium Dashboard-Level Presentation

**Principles:**
- **Cards:** Same `Card` component; `rounded-xl`; `border-border`; no heavy shadows. One clear hierarchy: title → key content → optional footer link.
- **Spacing:** Generous padding (`p-5`/`p-6`); consistent `space-y-4` between sections. No cramped blocks.
- **Typography:** Section titles `font-heading font-semibold`; body `text-sm`; labels `text-xs text-muted-foreground`. One-line summaries in normal weight.
- **Density:** Summary card and readiness = compact. Missing-items and AI panels = scannable list, not paragraphs.
- **Loading:** Skeleton for summary card (2–3 lines); no spinner unless critical. "Updating…" in strip or muted if refresh in background.

---

## 3. Sales-Side Intelligence Surfaces

### 3.1 Hunt (Leads)

**Where:** Lead list (optional column); Lead detail (main place).

**Surfaces:**
- **List (optional):** Column "Intelligence" or "Profile": pill "Thin" | "Ready" | "—" or one-line "Contact + intent" when AI has something. Tooltip: one-line summary.
- **Lead detail:**
  - **Account Intelligence summary card (collapsed):** One-line summary. e.g. "Contact from Acme Corp. Intent: office cleaning. No site visit yet." + "View full profile."
  - **Confidence strip:** "1 of 4 fields verified (contact, company). Est.: intent, size."
  - **Readiness:** "Proposal: Not ready" or "Proposal: Missing scope, site visit." Link to **Missing-items panel**.
  - **Missing-items panel:** "Missing for proposal: Scope, Site visit, Contact confirmation." Each with short "Add" CTA (e.g. Schedule walkthrough, Add contact).
  - **AI recommendation panel (optional):** "Suggested next step: Schedule walkthrough" or "Suggested contact: [name] at [role]." Thin; one line + optional CTA.

**Density:** Low. One card + strip + readiness + missing. No staffing/route yet.

---

### 3.2 Stalk (Pipeline / Opportunities)

**Where:** Opportunity list (optional column); Opportunity detail; Account detail (when viewing from pipeline).

**Surfaces:**
- **List (optional):** "Profile" column: "Ready for proposal" | "3 of 5" | "—". Or tooltip with one-line summary.
- **Opportunity detail:**
  - **Account Intelligence summary card (expanded):** One-line summary + key facts (locations, sq ft est., next step). e.g. "2 locations, ~18k sq ft. Walkthrough done; proposal drafted. Suggested start: Feb 1."
  - **Confidence / verification strip:** "Scope · Walkthrough notes verified. Est.: sq ft, labor."
  - **Readiness:** "Proposal: Ready" or "Proposal: Missing pricing." Links to missing-items.
  - **Missing-items panel:** "Missing for proposal: Pricing, Signature." With links to Proposals, Contacts.
  - **AI recommendation panel (optional):** "Suggested proposal scope" (2–3 bullets) or "Suggested start date: Feb 1 (est. from scope)." Link to Proposal.

**Account detail (when in pipeline context):** Same as opportunity if one primary opportunity; or summary card + "View in Pipeline" for each opportunity.

**Density:** Medium. Summary + strip + readiness + missing + one thin AI panel.

---

### 3.3 Kill (Closing)

**Where:** Opportunity detail (closing stage); Account detail; Proposal detail.

**Surfaces:**
- **Opportunity / Account detail:**
  - **Account Intelligence summary card:** Richer. "2 locations, 18k sq ft. Contract signed. Start Feb 15. Ready for handoff." + key facts.
  - **Confidence strip:** "Scope · Contract · Start date verified. Est.: labor (from proposal)."
  - **Readiness:** "Handoff: 4 of 5" or "Handoff: Ready." Drives Launch to Ops.
  - **Missing-items panel:** "Missing for handoff: Schedule draft, Contacts in packet." Links to Launch packet.
  - **AI recommendation panel:** "Suggested crew: Alpha (route fit 88). 28h/wk (est.)." Preview only; full recommendation in Ops. Link "Pack for Ops →" to Launch packet.
  - **Staffing/route summary (one line):** "28h/wk · Fit 88 · North cluster (suggested)."

**Proposal detail:** Same summary card (compact) + "Handoff readiness" + link to Launch to Ops if won.

**Density:** Medium–high. Everything needed to close and hand off without leaving the page.

---

### 3.4 Launch to Ops (Handoff)

**Where:** Launch packet list; Launch packet detail.

**Surfaces:**
- **Launch packet list:** Row or card can show: "Intelligence: Ready" | "Intelligence: 1 missing" + tooltip one-line summary (account, suggested crew, fit).
- **Launch packet detail:**
  - **Account Intelligence summary card (expanded):** Full one-line + key facts (locations, start, contract, suggested crew + route fit). "Everything Ops needs in one place."
  - **Confidence strip:** "Handoff packet: Scope · Schedule · Contacts verified. Est.: labor, crew (suggested)."
  - **Readiness:** "Handoff: Ready to submit" | "Handoff: Missing schedule." Tied to checklist (contract, scope, schedule, contacts, supplies).
  - **Missing-items panel:** Same as Launch refactor doc (checklist items incomplete). Links to edit payload.
  - **AI recommendation panel:** "Suggested crew: Alpha. Route fit 88. 28h/wk. Reasoning: …" Compact; full version in Ops Activations. "Submit to Ops" CTA.
  - **Staffing/route summary:** One line below recommendation. All values labeled "Est." or "Suggested" unless from contract.

**Principle:** Sales sees the same intelligence that Ops will see; no re-keying. "Estimated" and "Suggested" keep expectations clear.

---

## 4. Ops-Side Intelligence Surfaces

### 4.1 Activations

**Where:** Activations list; Activation detail.

**Surfaces:**
- **List:** Already defined in Activations AI doc: AI summary column (crew, route fit, confidence), labor, risk. Each row is a slice of account intelligence (recommendation + readiness).
- **Activation detail:**
  - **Account Intelligence summary card:** "2 locations, 18k sq ft. Start Feb 15. Contract signed. Suggested crew: Alpha (fit 88)." Same as Sales handoff view so Ops sees continuity.
  - **Confidence strip:** "Packet: Scope · Schedule verified. Est.: crew, labor (suggested)."
  - **Readiness:** "Activation: Ready to accept" | "Activation: Missing crew assignment." Links to missing-items or override.
  - **Missing-items panel:** "Missing for activation: Crew (suggested: Alpha), Start confirmation." Or "Nothing missing. Accept to go live."
  - **AI recommendation panel:** Full panel per Activations AI doc (crew, supervisor, headcount, labor, route fit, reasoning, backup options, Accept with suggestion / Override).
  - **Staffing/route summary:** Inline in recommendation panel; estimated vs confirmed as in §2.7.

**Principle:** Ops lands on one page with summary + recommendation + actions. No hunting.

---

### 4.2 Accounts

**Where:** Account list (optional column); Account detail (live accounts).

**Surfaces:**
- **List (optional):** "Intelligence" column: "Crew Alpha · 28h · Fit 88" or "—" for new/unassigned. Tooltip: one-line summary.
- **Account detail:**
  - **Account Intelligence summary card:** "2 locations, 18k sq ft. Live since Feb 15. Crew: Alpha. 28h/wk. Route fit 88." For live accounts, more "confirmed" than "estimated."
  - **Confidence strip:** "Crew · Schedule · Locations verified. Est.: route fit (refreshed weekly)."
  - **Readiness:** Only if relevant. e.g. "Inspection: Due next week" or "No issues."
  - **Missing-items panel:** Only when actionable. e.g. "Missing: Latest inspection" or "Contract renewal in 30 days."
  - **AI recommendation panel (optional):** "Suggested crew change: Beta (better route fit 92)." Only when AI suggests a change; link to Schedules/Crews. Otherwise hide.
  - **Staffing/route summary:** One line. "28h/wk · Crew Alpha · Fit 88 · North cluster." Confirmed values not labeled; only "Est." when from AI.

**Principle:** Live account = intelligence as current state + optional "suggested improvement." No duplicate "activation" UI.

---

### 4.3 Mapping

**Where:** Map view (accounts/locations as markers or list).

**Surfaces:**
- **Map markers/layer:** On hover or click, **tooltip or popover** with:
  - **Account Intelligence summary (one line):** Account name, locations, crew, route fit. e.g. "Acme · 2 sites · Crew Alpha · Fit 88."
  - **Staffing/route summary:** One line. "28h · +6 min · North cluster."
  - Optional "View profile" link → Account or Activation.
- **Side panel (if map has list):** Same summary card (collapsed) per account; click → detail or expand.
- **No** long paragraphs on the map. Only scannable one-liners and links.

**Principle:** Map is for geography and route context; intelligence is supporting. Estimated vs confirmed in tooltip if needed (e.g. "Fit 88 (est.)").

---

### 4.4 Inspections

**Where:** Inspection list (per account/location); Inspection detail; Schedule or Account context when starting an inspection.

**Surfaces:**
- **When starting or viewing an inspection:**
  - **Account Intelligence summary card (compact):** One line. e.g. "Acme · 2 locations · Crew Alpha. Last score 92 (Jan 15)."
  - **Confidence strip (optional):** "Last inspection verified. Est.: next due (from schedule)."
  - **Readiness:** Not "proposal/handoff/activation" but e.g. "Inspection: Ready" (template + location) or "Missing: Template."
  - **Missing-items panel (optional):** Only if "Missing: Template" or "Missing: Inspector." Short.
- **Post-inspection:** Intelligence profile updates (last score, last date); surfaces on Account and next time Ops opens this account.

**Principle:** Inspections consume and update intelligence. Show enough to run the inspection; avoid clutter.

---

## 5. Summary: Where Each Component Appears

| Component | Hunt | Stalk | Kill | Launch to Ops | Activations | Accounts | Mapping | Inspections |
|-----------|------|-------|------|----------------|-------------|----------|---------|-------------|
| Summary card | ✓ (collapsed) | ✓ (expanded) | ✓ (expanded) | ✓ (expanded) | ✓ (expanded) | ✓ (expanded) | ✓ (tooltip/panel) | ✓ (compact) |
| Confidence strip | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | optional |
| Readiness indicator | Proposal | Proposal | Handoff | Handoff | Activation | optional | — | optional |
| Missing-items panel | ✓ | ✓ | ✓ | ✓ | ✓ | when needed | — | when needed |
| AI recommendation panel | optional (next step) | optional (scope/start) | ✓ (crew preview) | ✓ (crew + route) | ✓ (full) | optional (change) | — | — |
| Staffing/route summary | — | — | ✓ | ✓ | ✓ | ✓ | ✓ (tooltip) | optional |

---

## 6. Copy and Consistency

- **"Account intelligence"** = the profile/summary. Not "AI summary" in UI (can stay in docs).
- **"Verified"** = user- or system-confirmed. **"Est." / "Suggested"** = inferred or AI.
- **Readiness:** "Proposal readiness", "Handoff readiness", "Activation readiness." Same wording in Sales and Ops.
- **Actions:** "Add", "Complete", "Use suggestion", "Override." No "AI says" or "You must."

---

## 7. Implementation Notes

### 7.1 Data

- **Profile per account (and optionally lead):** Stored or computed fields: summary, key_facts, verified_fields, estimated_fields, readiness (proposal/handoff/activation), missing_items, suggested_crew, route_fit, labor_estimate, confidence. Updated by pipeline (walkthrough, proposal, packet, activation, inspection).
- **Surfaces:** Each surface (Lead detail, Opportunity detail, etc.) fetches the slice it needs; no single "intelligence API" required if you can derive from existing APIs + a small profile store.

### 7.2 Components to Build

- `AccountIntelligenceSummaryCard` (props: summary, keyFacts, updatedAt, expanded, linkTo?)
- `ConfidenceVerificationStrip` (verifiedCount?, total?, verifiedLabels?, estimatedLabels?, confidence?)
- `ReadinessIndicator` (stage: proposal | handoff | activation, value, total, missing[], linkToMissing?)
- `MissingItemsPanel` (stage, items: { label, href? }[], emptyMessage?)
- `AIRecommendationPanel` (variant: thin | crew | full; content by variant; useSuggestionCta?, overrideCta?)
- `StaffingRouteSummary` (labor, crew, routeFit, travel?, cluster?; estimated?: boolean[])
- **Estimated vs confirmed:** Utility or component: `<Value value={x} estimated />` or `formatValue(x, { estimated: true })` used across cards and tables.

### 7.3 Files to Touch

- Sales: Lead detail, Opportunity detail, Account detail, Launch packet list/detail. Add summary card, strip, readiness, missing-items, and optional AI panel to each.
- Ops: Activations list/detail (already partially specified), Account detail, Map (tooltip/panel), Inspection start/detail. Same components.
- Shared: New `components/account-intelligence/` (or `components/intelligence/`) for the shared components above.

---

This doc is the single reference for Account Intelligence surfaces across Sales and Ops. Keep presentation premium, minimal, and action-oriented so reps and Ops trust and use the profile without feeling overloaded.
