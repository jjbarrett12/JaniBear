# JANIBEAR AI Control Center — Enterprise UI Layout Spec

**Principal product design.** Dark theme, high contrast, modern, minimal clutter. shadcn components. Feels like **mission control**, not settings.

---

## Design constraints

- **Stack:** Tailwind + shadcn/ui; use existing tokens (`--background`, `--foreground`, `--card`, `--border`, `--muted-foreground`, `--primary`, `--radius`, `--health-*`).
- **Dark theme:** Primary; ensure sufficient contrast (foreground on card, borders visible).
- **No new design system:** Reuse `Card`, `Button`, `Badge`, `Switch`, `Slider`, `Select`, `Table`, `Accordion`, `Sheet`/drawer, `Progress`, `Tabs` where applicable.
- **Tone:** Operational, authoritative; meaningful icons; stats feel live, not marketing.

---

## Grid & layout

| Token | Value |
|-------|--------|
| Max width | 1200–1400px (`max-w-[1400px]` or `max-w-6xl` + padding) |
| Grid | 12 columns |
| Section spacing | 24–32px (`space-y-6` or `space-y-8`) |
| Card radius | 16–20px (`rounded-2xl`) |
| Card border | Subtle: `border border-border` |
| Card shadow | Soft: `shadow-sm` (no heavy drop shadows) |

**Page wrapper:** Single column, centered, e.g. `max-w-[1320px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8`.

---

## A) Header (full width)

**Layout:** Flex row, full width within max-width container. Left: title block. Right: status + usage chip + action.

**Left**
- **H1:** “AI Control Center” — `font-heading text-2xl md:text-3xl font-semibold tracking-tight text-foreground`.
- **Subtext:** “Control AI features, automation, privacy, and spending” — `text-sm text-muted-foreground mt-0.5`.

**Right (flex wrap, gap-3, items-center)**
- **Status pill:** “AI Enabled” — `Badge` variant default or outline; green dot optional (`h-2 w-2 rounded-full bg-[hsl(var(--health-green))]`). If disabled: “AI Paused” with muted/amber.
- **Chip:** “This month: $___ • ____ tokens” — compact, `text-sm text-muted-foreground` with tabular-nums for numbers; can be a small `Card` or bordered span.
- **Button:** “Usage Log” — `Button variant="outline" size="sm"`; links to usage log view or opens drawer.

**Responsive:** Stack right block below title on small screens; keep status pill and Usage Log visible first.

---

## B) Usage & Budget Bar (full width, prominent)

**Container:** One large `Card` full width, `rounded-2xl border border-border bg-card`, padding `p-6`.

**Layout:** Two main rows.

**Row 1 — Progress**
- **Horizontal progress bar:** Budget consumed vs limit. Use shadcn `Progress`; color from tokens (e.g. default until >80% then amber, >100% red). Label above: “Budget” with “X% used” or “$X / $Y” right-aligned.

**Row 2 — Two columns (e.g. grid 3fr 1fr or flex)**
- **Left: 4 KPIs in a row** (grid 4 cols, gap-4). Each KPI:
  - Label: small, `text-xs font-medium text-muted-foreground`.
  - Value: `text-lg font-semibold tabular-nums text-foreground`.
  - Items: **Tokens (month)**, **Est cost (month)**, **Budget limit**, **Requests (month)**.
- **Right column:** Vertical stack (gap-4):
  - **Toggle:** “Hard cap” — `Switch` + label “Hard cap when limit reached”.
  - **Toggle:** “Notify at 80%” — `Switch` + label “Notify at 80%”.
  - **Dropdown:** “Notify channel” — shadcn `Select`: e.g. Email, Slack, In-app.

**Visual:** KPIs should feel operational (numbers prominent, labels secondary). No decorative icons in the bar; optional small icon per KPI only if it adds meaning.

---

## C) Modules Grid (full width)

**Title row (flex justify-between items-center, mb-4)**
- **Title:** “AI Modules” — `text-lg font-semibold text-foreground`.
- **Right:** Filter + search:
  - **Filter:** `Select` or segmented control: “All” | “Enabled” | “Locked”.
  - **Search:** `Input` with search icon, placeholder “Search modules…”, `max-w-xs`.

**Cards grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` (or gap-6).

**ModuleCard (each card)**
- **Container:** `Card rounded-2xl border border-border bg-card p-5`; relative (for overlay).
- **Top row:** Flex justify-between items-start.
  - **Left:** Icon (e.g. 40×40 rounded-lg bg-muted/60) + module name (`font-medium text-foreground`).
  - **Right:** `Switch` for enabled/disabled (disabled when locked).
- **Description:** One line, `text-sm text-muted-foreground line-clamp-2` (max ~80 chars).
- **Action:** “Configure” — `Button variant="secondary" size="sm"` (or ghost).
- **Footer (mini-stats):** Small row, `text-xs text-muted-foreground`:
  - “Used: 124”
  - “Last run: 2h ago”
  - Separate with dot or pipe.

**Locked state**
- **Overlay:** Absolute inset-0 rounded-2xl bg-background/80 flex items-center justify-center (or top stripe with message).
- **Message:** “Upgrade to enable” — `text-sm font-medium`.
- **Toggle:** Disabled, with `Tooltip`: “Available on [Plan name]” or “Upgrade to enable this module.”
- **CTA:** “View plans” — `Button variant="outline" size="sm"`.

---

## D) Automation Rules (two-column)

**Layout:** `grid grid-cols-1 lg:grid-cols-12 gap-6`. Left 8 cols, right 4 cols.

**Left (8 cols) — Rules table card**
- **Card:** `Card rounded-2xl`, full height.
- **Header:** “Automation rules” + “Create rule” `Button` (primary) top right.
- **Content:** shadcn `Table` — compact rows:
  - Columns: Name, Trigger summary, Status (toggle), Last run, Actions (e.g. Edit, Delete).
  - Row height: compact (`py-3`); `Switch` in Status column.
- **Optional:** Bulk actions bar when rows selected: “Enable selected” / “Disable selected”.

**Right (4 cols) — Rule templates card**
- **Card:** `Card rounded-2xl`.
- **Title:** “Rule templates”.
- **List:** Clickable items (e.g. `button` or `Link`), each:
  - Title: e.g. “Inspection below 75% → action plan”.
  - One line description if needed.
  - Selecting opens Rule Builder drawer with template prefilled.

**Suggested template labels**
- “Inspection below 75% → action plan”
- “Invoice overdue 30d → follow-up draft”
- “SLA breach → escalation summary”

**Rule Builder Drawer (Sheet/drawer from right)**
- **Stepper at top:** 5 steps — Trigger → Conditions → Actions → Notify → Review. Use small step indicators (e.g. dots or “1 → 2 → 3”); current step highlighted.
- **Content:** Form sections per step; “Back” / “Next” or “Save” at bottom.
- **Live preview sentence:** Prominent line that updates as user configures, e.g.  
  “When inspection score below 75% on any account, generate action plan and create task assigned to Ops Manager.”
- Use existing `SlideOverDrawer` or shadcn `Sheet`; width `max-w-lg` or `max-w-xl`.

---

## E) Privacy & Data Access (two cards side-by-side)

**Layout:** `grid grid-cols-1 md:grid-cols-2 gap-6`.

**Card 1 — Data Access**
- **Title:** “Data access”.
- **Subtext (optional):** “Which data AI can read for this org.”
- **Content:** Checkbox list grouped by domain:
  - **Sales** (e.g. Leads, Opportunities, Accounts — checkboxes).
  - **Ops** (e.g. Schedules, Inspections, Issues — checkboxes).
  - **Finance** (e.g. Invoices, Contracts — checkboxes).
- **Sensitive items:** Warning icon (e.g. `AlertTriangle`) next to label; optional tooltip “Contains PII or financial data”.

**Card 2 — Prompt retention + redaction**
- **Title:** “Prompt retention & redaction”.
- **Retention:** Toggle “Retain prompts for debugging” + “Days” `Select` (e.g. 7, 14, 30, 90).
- **Redaction:** Label “Redaction level” + **Segmented control** or `Select`: “None” | “Basic” | “Aggressive”.
- **Action:** “Show redaction preview” — `Button variant="outline" size="sm"` opens **Modal** with:
  - Before: sample prompt text (e.g. placeholder).
  - After: same text with redaction applied.
  - Short explanation of what each level does.

---

## F) Model Config (full width, compact)

**Container:** One `Card` or a slim bar; single row on desktop, wrap on small.

- **Model:** `Select` “Model” — options plan-gated; locked option shows “Upgrade for GPT-4” or similar.
- **Temperature:** `Slider` with label “Temperature” and min/max labels (e.g. 0–1); value shown.
- **Response length:** Segmented control — e.g. “Short” | “Medium” | “Long”.
- **Confidence threshold:** Segmented control — e.g. “Low” | “Medium” | “High” (or numeric slider).
- **Toggle:** “Cheap drafts” — `Switch` + label “Use faster/cheaper model for drafts”.

**Layout:** Flex wrap, gap-4 or gap-6; each control with a short label above. Keep vertical space minimal (single row if possible).

---

## G) Provider & Keys (full width)

**Container:** `Card rounded-2xl`.

- **Provider choice:** **Radio group** — “Managed” (JANIBEAR keys) | “BYOK” (Bring your own key).
- **If Managed:** Read-only message: “Using organization-managed keys.” + optional usage warning line.
- **If BYOK:**
  - **Key input:** Password-like `Input` (masked) with “Reveal” toggle (eye icon).
  - **Button:** “Test connection” — primary or secondary.
  - **Status line:** `text-sm text-muted-foreground` — “Last validated: 2h ago” or “Invalid key” (error state).

---

## H) Audit Log (collapsed by default)

**Container:** shadcn `Accordion` (single item or multiple).

- **Trigger:** “AI audit log” (and optional short line “Who changed what, when”).
- **Content:** Timeline list:
  - Each row: who (user/role), what changed (short description), time (relative or absolute).
  - Compact rows; alternating or bordered separators.
- **Footer (optional):** “Export CSV” — `Button variant="ghost" size="sm"` or link.

---

## Microinteractions

| Scenario | Behavior |
|----------|----------|
| Toggling a module (Enable/Disable) | Immediate UI update; optional short loading shimmer on the card (e.g. skeleton overlay 0.5s) then new state. |
| Budget cap reached | **Banner at top of page** (below app header): “AI paused due to budget limit” — `Alert` or bar, dismissible or persistent until budget increased; use destructive or amber. |
| Locked module | **Tooltip** on disabled Switch: “Available on [Plan name]” or “Upgrade to enable.” |
| Rule template click | Open Rule Builder drawer with template id; stepper at step 1; form prefilled. |
| Test connection (BYOK) | Button shows loading state; then success toast “Connection OK” or inline error “Invalid key”. |

---

## Visual tone

- **Avoid large empty space:** Use compact but readable density; cards and sections should feel purposeful.
- **Meaningful icons:** Use Lucide (or existing set) consistently — e.g. Zap for automation, Shield for privacy, Key for keys, FileText for audit.
- **Stats operational:** Numbers in tables and KPIs should feel live (tabular-nums, clear hierarchy); avoid marketing-style “big number” hero stats unless it’s the primary metric.
- **Mission control:** Headers and section titles are clear and imperative; actions (Create rule, Configure, Test connection) are primary or secondary buttons, not buried.

---

## Component checklist (shadcn)

- **Card**, **CardHeader**, **CardTitle**, **CardDescription**, **CardContent**
- **Button** (default, outline, secondary, ghost)
- **Badge**
- **Switch**
- **Progress**
- **Select**, **SelectTrigger**, **SelectContent**, **SelectItem**
- **Input** (text, password with reveal)
- **Slider**
- **Table**, **TableHeader**, **TableBody**, **TableRow**, **TableCell**
- **Accordion**, **AccordionItem**, **AccordionTrigger**, **AccordionContent**
- **Sheet** or **SlideOverDrawer** (Rule Builder)
- **Dialog** or **AlertDialog** (e.g. redaction preview modal)
- **Tooltip** (locked module, sensitive data)
- **RadioGroup**, **RadioGroupItem**
- **Tabs** (optional for Rule Builder steps instead of stepper)
- **Alert** (budget cap banner)

---

## File / route suggestion

- **Route:** `/app/app/admin/ai-control-center` or reuse `/app/app/admin/ai-settings` and replace content.
- **Structure:** One page component; sections can be client components (toggles, drawer, form). Server component for initial data (usage, budget, module list, rules, audit entries) if needed.
- **State:** URL params for drawer open (e.g. `?rule=new` or `?template=inspection`) optional for deep link.

This spec is implementation-ready: use existing JANIBEAR tokens and shadcn only; no new design system. Build so it feels like mission control — clear, authoritative, minimal clutter.
