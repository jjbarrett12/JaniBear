# JANIBEAR AI Control Center — Complete UI/UX Spec

**Principal product design.** Enterprise SaaS dashboard; mission control (not a basic settings form). Next.js + Tailwind + shadcn. Dark theme, high clarity, minimal clutter, premium feel.

**Design goals**
1. Immediately communicates: “AI is running the business.”
2. Fast scan: user sees what’s on, what it costs, what it’s doing.
3. Safe + controllable: budget cap, hard cap, alerts, privacy, audit.
4. Locked/plan states ready (even if not enabled yet).
5. Consistent with enterprise patterns: chips, tables, drawers, empty states.

---

## 1. Design tokens (implementation reference)

| Token | Value | Notes |
|-------|--------|--------|
| **Max width** | 1280–1400px | e.g. `max-w-[1320px]` or `max-w-7xl`; center with `mx-auto` |
| **Grid** | 12 columns | Use CSS grid or Tailwind `grid-cols-12` |
| **Section spacing** | 24–32px | `space-y-6` (24px) or `space-y-8` (32px) between major sections |
| **Card radius** | 16–20px | `rounded-2xl` (16px) or `rounded-[20px]` |
| **Card border** | Subtle | `border border-border`; avoid heavy weight |
| **Card shadow** | Soft | `shadow-sm` only; no large drop shadows |
| **H1** | 28–32px | `text-2xl md:text-3xl`, `font-semibold`, `tracking-tight` |
| **Section headers** | 16–18px | `text-base` or `text-lg`, `font-semibold` |
| **Body** | 13–14px | `text-sm` |
| **Muted / secondary** | — | `text-muted-foreground` for labels, helper text |
| **Primary actions** | — | Right-aligned at section headers; `Button` primary variant |

Use existing JANIBEAR tokens: `--background`, `--foreground`, `--card`, `--border`, `--muted-foreground`, `--primary`, `--radius`, `--health-green`, `--health-amber`, `--health-red`.

---

## 2. Page structure (wireframe-level)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  A) HEADER (full width)                                                      │
│  [H1 + subtext]                    [Status pill] [Usage chip] [Usage Log]   │
├─────────────────────────────────────────────────────────────────────────────┤
│  B) USAGE + BUDGET (one large card)                                          │
│  [Progress bar: Spent vs Limit]                                              │
│  [4 KPI tiles]                    [Hard cap] [Notify 80%] [Channel] [Budget]│
├─────────────────────────────────────────────────────────────────────────────┤
│  C) AI MODULES          [Search ________] [Filter ▼]                          │
│  [Module Card] [Module Card] [Module Card]                                  │
│  [Module Card] [Module Card] [Module Card]                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  D) AUTOMATION RULES                                                         │
│  ┌─────────────────────────────────────┐  ┌──────────────────┐             │
│  │ Rules table        [Create rule]     │  │ Rule templates    │             │
│  │ [toggle|Name|Trigger|Actions|...]   │  │ • Template 1      │             │
│  │ ...                                 │  │ • Template 2      │             │
│  └─────────────────────────────────────┘  └──────────────────┘             │
├─────────────────────────────────────────────────────────────────────────────┤
│  E) PRIVACY + DATA ACCESS                                                    │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                  │
│  │ Data access (checkboxes)│  │ Retention + redaction    │                  │
│  └─────────────────────────┘  └─────────────────────────┘                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  F) MODEL BEHAVIOR (compact single row / wrap)                               │
│  [Preset] [Temperature] [Length] [Confidence] [Cheaper drafts]              │
├─────────────────────────────────────────────────────────────────────────────┤
│  G) PROVIDER / KEY STATUS                                                    │
│  [Managed | BYOK]  [Status line] [Test connection if BYOK]                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  H) AUDIT LOG [Accordion collapsed]                                          │
│  ▼ AI audit log                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Section-by-section spec

### A) Header (full width)

**Layout:** Single row; left: title block; right: status + chip + button. Flex wrap on small screens.

**Left**
- **H1:** “AI Control Center”  
  - Typography: 28–32px, font-semibold, tracking-tight, text-foreground.
- **Subtext:** “Control AI modules, automation, privacy, and spend.”  
  - Typography: 13–14px, text-muted-foreground, one line.

**Right (flex, gap 12–16px, align center)**
- **Status pill:**  
  - When AI is enabled: “AI Enabled” — Badge (default or outline), optional green dot (e.g. 8px circle, health-green).  
  - When AI is paused (e.g. hard cap): “AI Paused” — Badge muted or amber.
- **Usage chip:** “This month: $X • Y tokens”  
  - X = estimated cost (month), Y = token count (month).  
  - Compact; tabular-nums; text-sm text-muted-foreground; can be a small bordered pill or inline.
- **Button:** “Usage Log”  
  - Variant: outline; size: sm.  
  - Action: opens right drawer (see Interactions).  
  - Do not navigate away.

**Responsive:** On narrow viewports, stack right block below title; keep status pill and Usage Log button visible.

---

### B) Usage + Budget (full width, prominent)

**Container:** One Card, full width, padding 24px, rounded-2xl, border, shadow-sm.

**Layout:** Two main areas: (1) progress + KPIs row, (2) right-side controls.

**Row 1 — Budget progress**
- **Label (left):** “Budget”  
- **Label (right):** “$X / $Y” or “X% used” (spent vs limit).  
- **Component:** Horizontal progress bar (e.g. shadcn Progress).  
  - Color: default until &gt;80% (amber), &gt;100% (red).  
  - If no budget set: show bar at 0 and “Set a limit” CTA (see states).

**Row 2 — Two columns**
- **Left: 4 KPI tiles in a row (grid, equal width, gap 16px)**  
  Each tile: label (small, muted) + value (larger, semibold, tabular-nums).  
  - **Requests (month)** — label: “Requests (month)”, value: number.  
  - **Tokens (month)** — label: “Tokens (month)”, value: number.  
  - **Estimated cost (month)** — label: “Est. cost (month)”, value: “$X”.  
  - **Budget limit** — label: “Budget limit”, value: “$X” or “Not set”.

- **Right column (stacked, gap 16px):**  
  - **Toggle:** “Hard cap (pause AI at limit)” — Switch + label.  
  - **Toggle:** “Notify at 80%” — Switch + label.  
  - **Dropdown:** “Notify channel” — Select: options e.g. “In-app”, “Email”, “Slack” (or org-configured channels).  
  - **Inline edit:** “Monthly budget ($)” — Input (number) or inline-editable value; placeholder “Set limit”.

**States**
- **No budget set:** Progress area shows “No spending limit set.” + primary CTA “Set a limit” (opens inline edit or small modal).  
- **Budget exceeded (and hard cap on):** Within card, show warning banner (e.g. Alert): “AI paused — monthly budget reached. Increase limit or wait until next period.” Header status pill shows “AI Paused”.  
- **Loading:** Skeleton for progress bar + 4 KPI placeholders + disabled toggles.

**Microcopy**
- Hard cap: “Pause all AI when budget limit is reached.”  
- Notify at 80%: “Send alert when usage reaches 80% of budget.”  
- Notify channel: “Where to send budget alerts.”

---

### C) AI Modules (full width)

**Section header row**
- **Left:** Title “AI Modules” — section header typography (16–18px, semibold).  
- **Right:** Search + Filter.  
  - **Search:** Input, placeholder “Search modules…”, with search icon, max-width ~240px.  
  - **Filter:** Select or segmented control: “All” | “Enabled” | “Disabled” | “Locked”.

**Grid:** 3 columns desktop, 2 tablet, 1 mobile; gap 16–24px.

**Module card (per module)**  
One Card per module; padding 20px; rounded-2xl.

**Top row (flex, space-between, align start)**
- **Left:** Icon (e.g. 40×40, rounded-lg, bg-muted/60) + **Name** (font-medium, foreground).  
- **Right:** Toggle (Switch). Disabled when module is Locked.

**Body**
- **Description:** One line, max 2 lines clamp; text-sm text-muted-foreground.  
  Use the descriptions below per `module_key`.

**Footer (small, muted)**
- “Used: {usage_month_count}” • “Last run: {Never | Xm ago | Xh ago | Xd ago}”.  
  - If no runs: “Last run: Never”.

**CTA**
- **Button:** “Configure” — variant secondary, size sm.  
  - Action: opens right drawer for that module (configuration).  
- **Locked state only:** Overlay on card (or clear locked strip) with “Upgrade to enable” and link/button “View plans”. Toggle disabled; tooltip on toggle: “Available on [Plan name]” or “Upgrade to enable.”

**Module key → display name + description (real data)**

| module_key | Display name | Description (max ~2 lines) |
|------------|--------------|----------------------------|
| proposals.generator | Proposal Generator | Draft proposals from walkthrough + pricing. |
| walkthrough.scope_builder | Scope Builder | Turn walkthrough notes into scoped tasks. |
| inspections.risk_analysis | Inspection Risk Analysis | Spot risk and failure patterns. |
| accounts.health_assistant | Account Health Assistant | Detect churn risk + next-best action. |
| finance.leakage_detection | Revenue Leakage Detection | Find missed charges + scope creep. |
| comms.auto_followups | Auto Follow-ups | Draft follow-ups for invoices & leads. |
| ops.crew_optimization | Crew Optimization | Suggest staffing + routing improvements. |

**Enabled vs disabled**
- **Enabled:** Normal card; toggle on; “Configure” available.  
- **Disabled:** Same layout; toggle off; card can be slightly muted (e.g. opacity or muted border).  
- **Locked:** Overlay or strip “Upgrade to enable”; toggle disabled; “View plans”; no raw key or sensitive config exposed.

**Empty state (no modules match filter):** “No modules match your filter.” + clear filter CTA.

**Loading:** Grid of card skeletons (icon + 2 lines + footer line).

---

### D) Automation Rules (two-column)

**Layout:** Grid 12 cols; left 8 cols, right 4 cols; gap 24px.

**Left (8 cols) — Rules table card**
- **Card:** Rounded-2xl, padding 24px.  
- **Header row:** “Automation rules” (section header) + **Primary button “Create rule”** (top-right).  
- **Content:** Table, compact rows.

**Table columns**
1. **Enabled** — Switch (per row).  
2. **Rule name** — Text (e.g. “Inspection follow-up”).  
3. **Trigger** — Human-readable summary (e.g. “Inspection score &lt; 75%”).  
4. **Actions** — Compact tags (e.g. “Action plan”, “Create task”).  
5. **Cooldown** — e.g. “24h” or “None”.  
6. **Last fired** — Relative time or “Never”.  
7. **Row menu** — Dropdown or icon button: Edit, Delete.

**Empty state**
- “No rules yet.”  
- Subtext: “Create a rule or start from a template.”  
- Primary: “Create rule”; secondary or link: “Use a template” (scroll to or highlight right column).

**Loading:** Table skeleton (5–6 rows).

**Right (4 cols) — Templates card**
- **Card:** Rounded-2xl, padding 24px.  
- **Title:** “Rule templates”.  
- **List:** Clickable items (buttons or links). Each item:  
  - “Inspection below 75% → action plan + task”  
  - “Invoice overdue 30d → draft follow-up”  
  - “SLA breach → internal summary + alert”  
- **Action:** Click opens **Rule Builder** drawer with that template prefilled (trigger + actions).

**Rule Builder (right drawer)**
- **Width:** 480–560px (e.g. max-w-lg).  
- **Stepper (top):** Trigger → Conditions → Actions → Notify → Review.  
  - Current step highlighted; click to jump if allowed.  
- **Content:** Form for current step (trigger config, conditions, action pickers, notify options, review summary).  
- **Live preview (prominent):** One sentence, updated as user configures.  
  - Example: “When inspection score is below 75%, generate an action plan and create a high priority task.”  
  - Typography: text-sm or base, can be slightly muted but always visible.  
- **Footer:** “Test run” (secondary) — dry run; “Save rule” (primary).  
- **Close:** Sheet close (X or backdrop) without losing draft (optional: “Discard changes?” if dirty).

---

### E) Privacy + Data Access (two cards side-by-side)

**Layout:** Grid 2 cols desktop, 1 col mobile; gap 24px.

**Card 1 — Data access**
- **Title:** “Data access”.  
- **Subtext (optional):** “Which data AI can use for this organization.”  
- **Content:** Grouped checkboxes.  
  - **Sales:** proposals, walkthroughs.  
  - **Ops:** inspections, tasks, crew_schedules, account_notes.  
  - **Finance:** contracts, invoices.  
- **Sensitive (if present):** Group or section “Sensitive” with warning icon (e.g. AlertTriangle): payroll, owner_financials.  
  - Visually separated (border-top or spacing).  
  - Helper: “Only enable if required; data is encrypted and access is logged.”

**Card 2 — Prompt retention + redaction**
- **Title:** “Prompt retention & redaction”.  
- **Toggle:** “Retain prompts” — with short helper “For debugging and improvement.”  
- **Retention:** “Retention period” — Select: e.g. 7, 14, 30, 90 days.  
- **Redaction level:** Segmented control or Select: “None” | “Basic” | “Aggressive”.  
  - Helper: “Redaction applies before storage and in logs.”  
- **Link/button:** “Preview redaction” — opens **modal**.  
  - **Modal:** Title “Redaction preview”.  
  - Two blocks: “Before” (sample prompt text), “After” (same text with redaction applied).  
  - Short note per level (None / Basic / Aggressive).  
  - Close button.

**Loading:** Two card skeletons with checkbox/skeleton lines.

---

### F) Model behavior (full width, compact)

**Container:** One Card or one bar; single row on desktop, wrap on small; gap 16–24px.

**Controls (order left → right or wrap)**
1. **Preset dropdown:** “Behavior preset” — Select: “Conservative” | “Balanced” | “Creative”.  
   - Helper: “Preset adjusts temperature and length.”  
2. **Temperature:** Slider with label “Temperature” and value shown (e.g. 0–1).  
3. **Response length:** Segmented control — “Short” | “Standard” | “Detailed”.  
4. **Confidence threshold:** Segmented control — “Low” | “Medium” | “High”.  
5. **Toggle:** “Use cheaper model for drafts” — Switch + label.

**Helper (below row or at end):** “Affects cost and quality.”

**Loading:** Skeleton row for controls.

---

### G) Provider / Key status (full width)

**Container:** One Card; padding 24px.

**Two states (radio or toggle):**
1. **Managed by JANIBEAR (default)**  
   - **Label:** “Managed by JANIBEAR”.  
   - **Content:** Status line only, e.g. “Keys are managed for this organization.”  
   - **Optional:** “Last validated: Xm ago” (no key field).  
   - No input for key; no reveal.

2. **BYOK (Bring your own key)**  
   - **Label:** “Use your own key (BYOK)”.  
   - **Input:** Masked (password type); placeholder “Enter API key”; **never show raw key**; optional “Reveal” to show masked characters only (e.g. last 4 chars).  
   - **Button:** “Test connection” — secondary or primary.  
   - **Status line:** “Last validated: 2h ago” or “Invalid key” (error state).  
   - **Security note (small):** “Key is stored encrypted and never shown in full.”

**Loading:** Skeleton for one line + optional button.

---

### H) Audit log (collapsed by default)

**Container:** Accordion (single item or one section “AI audit log”).

- **Trigger:** “AI audit log” — with optional short line “Recent changes to AI settings.”  
- **Default state:** Collapsed.  
- **Content (when expanded):** List of last 20 changes.  
  - **Row format:** Icon (e.g. Pencil or User) + **Actor** + **Action** + **Time**.  
  - **Example:** “Jason changed Budget limit to $250 — 2m ago”.  
  - Compact rows; muted text for time; tabular-nums if numbers in action.  
- **Footer (optional):** “Export CSV” link or button (ghost).

**Empty:** “No changes yet.”

**Loading:** Skeleton list (5–6 rows).

---

## 4. States summary

| State | Where | Treatment |
|-------|--------|-----------|
| **Loading** | Every section | Skeleton blocks (progress, KPI tiles, table rows, card placeholders). No full-page spinner. |
| **Empty** | Rules table, Audit log, Modules (filter) | Short message + primary or secondary CTA where relevant. |
| **Locked** | Module cards (plan-gated) | Overlay “Upgrade to enable”; disabled toggle + tooltip; “View plans” link. |
| **Error** | Toggle save, Test connection, Save rule | Revert toggle / show inline error; toast for error message. |
| **Budget exceeded** | Usage card + Header | In-card warning banner; header status “AI Paused”. |
| **No budget set** | Usage card | “Set a limit” CTA; progress at 0. |

---

## 5. Interactions

- **Toggles (modules, rules, hard cap, notify, retention, etc.):** Optimistic update in UI; show inline spinner (e.g. on the switch or card) until request completes. On success: keep new state, optional short toast “Saved.” On failure: revert state, toast error (e.g. “Couldn’t update. Try again.”).  
- **Usage Log button:** Opens **right drawer** (Sheet), width 480–560px. Content: usage log (table or list: date, module, tokens/cost, etc.). No navigation.  
- **Configure (module):** Opens **right drawer** for that module’s config (form fields; no key display).  
- **Create rule / template click:** Opens **Rule Builder** drawer (right); template prefilled when from template.  
- **Test connection (BYOK):** Button loading state; then success toast “Connection OK” or inline error “Invalid key” + toast.  
- **All drawers:** Right-side sheet; width ~480–560px; close via X or backdrop; Escape to close.

---

## 6. Copywriting (microcopy)

**Headers / titles**
- Page: “AI Control Center” / “Control AI modules, automation, privacy, and spend.”  
- Sections: “AI Modules”, “Automation rules”, “Rule templates”, “Data access”, “Prompt retention & redaction”, “Model behavior”, “Provider & keys”, “AI audit log”.

**Empty states**
- Rules: “No rules yet.” / “Create a rule or start from a template.”  
- Modules filter: “No modules match your filter.”  
- Audit: “No changes yet.”

**CTAs**
- “Usage Log”, “Set a limit”, “Create rule”, “Configure”, “View plans”, “Preview redaction”, “Test connection”, “Save rule”, “Test run”, “Export CSV”.

**Helper text**
- Hard cap: “Pause all AI when budget limit is reached.”  
- Notify at 80%: “Send alert when usage reaches 80% of budget.”  
- Retention: “For debugging and improvement.”  
- Redaction: “Redaction applies before storage and in logs.”  
- Model behavior: “Affects cost and quality.”  
- BYOK: “Key is stored encrypted and never shown in full.”

**Warnings**
- Budget exceeded: “AI paused — monthly budget reached. Increase limit or wait until next period.”  
- Sensitive data: “Only enable if required; data is encrypted and access is logged.”

**Toasts**
- Success: “Saved.” / “Rule created.” / “Connection OK.”  
- Error: “Couldn’t update. Try again.” / “Invalid key.” / “Couldn’t save rule.”

---

## 7. Component hierarchy (for builders)

- **Page:** Single column, max-width 1280–1400px, `space-y-6` or `space-y-8`.  
- **A:** `header` (flex) → H1 + subtext | status pill + usage chip + Button.  
- **B:** `Card` → Progress + grid(KPI × 4) + column(Toggle × 2, Select, Input).  
- **C:** section header (title + Search + Filter) → grid of `Card` (Module cards).  
- **D:** grid(8 cols: Card with Table + “Create rule”; 4 cols: Card with template list).  
- **E:** grid(2 × Card): Data access checkboxes; Retention + redaction controls + “Preview redaction” modal.  
- **F:** Card or bar → Preset Select, Temperature Slider, Length segment, Confidence segment, Toggle.  
- **G:** Card → RadioGroup (Managed | BYOK) + conditional (status line | masked Input + Test + status).  
- **H:** Accordion → trigger “AI audit log” → list (icon + actor + action + time) + optional Export CSV.  
- **Drawers:** Sheet (right, 480–560px) for Usage Log, Module configure, Rule Builder.  
- **Modal:** Dialog for “Preview redaction” (before/after + note).

Use shadcn: Card, Button, Badge, Switch, Progress, Select, Input, Slider, Table, Accordion, Sheet, Dialog, Tooltip, RadioGroup, Alert. No custom design system beyond existing JANIBEAR tokens and typography.

This spec is implementation-ready; builders can implement section by section with the given structure, fields, labels, states, and copy.
