# Activations AI Recommendations — UI/UX Design

**Scope:** Ops Activations workflow with route-aware AI crew recommendations. Operator-only; all suggestions are **recommendations** (override always available). Copy uses "Recommended", "Suggested" per JaniBear OS.

**Design goals:** AI feels like a true operations manager; Ops trusts the recommendation quickly; staffing fit and route efficiency are both visible; override is easy and safe; interface stays premium, clean, and fast.

---

## 1. Activations List Layout

### 1.1 Page Structure

- **Breadcrumb:** Ops / Activations
- **Page title:** Activations
- **Subtitle:** One line. e.g. "New accounts from Sales. Review AI staffing suggestions and accept to go live."
- **Summary strip:** Awaiting: **N** · With recommendations: **M** · Accepted this week: **K**
- **Primary action:** None on list (actions on each row or in detail). Optional filter: "All" | "Awaiting" | "Has recommendation"
- **Main content:** **Table** (primary) or **card list** (mobile or optional view)

### 1.2 Table Layout (Desktop)

| Column | Content | Width / behavior |
|--------|--------|-------------------|
| Account | Name (link to detail); optional location count | min 180px |
| Status | Chip: Awaiting review \| Accepted \| Changes requested | 120px |
| **AI summary** | **Recommended crew** (name or "—"); **Route fit** (score 0–100 or "—"); **Confidence** (pill: High \| Medium \| Low or %) | 200px |
| Labor | Weekly hrs (e.g. 28h) or "—" | 80px |
| Risk | 0–3 risk flags as small icons or "—"; tooltip list | 80px |
| Received | Date (ready_at or created_at) | 100px |
| Action | "Review" button (primary outline) → detail | 100px |

- **AI summary column:** One line or two. e.g. "Crew Alpha · Fit 87 · High confidence" or "No recommendation yet". Click row or "Review" → detail.
- **Empty recommendation state:** "Recommendation pending" or "Analyzing…" with subtle loading indicator; link still goes to detail where reasoning can appear when ready.

### 1.3 Card Layout (Mobile / Optional)

- One **card per activation**. Order: newest first.
- **Card content:**
  - Row 1: Account name (link), Status chip
  - Row 2: **Recommended:** [Crew name] · **Fit** [score] · **Confidence** [pill]
  - Row 3: Labor estimate (e.g. 28h/wk), Risk (icons or "None"), Received date
  - Row 4: "Review" button (full-width or right-aligned)
- **Visual:** `bg-card border border-border rounded-lg`; hover: subtle `border-primary/20`. No heavy shadows.

### 1.4 List Copy and Legal

- Use "Recommended crew", "Suggested headcount", "Route fit score" (not "Assigned" or "Required").
- Optional helper text under table: "Suggestions are based on scope, location, and existing routes. You can override any recommendation when accepting."

---

## 2. Activation Detail Layout

### 2.1 Page Structure (Single scroll or tabs)

- **Breadcrumb:** Ops / Activations / [Account name]
- **Header row:**
  - Left: Account name (h1), Requested start date (if any), Status chip
  - Right: **Accept & go live** (primary), **Request changes** (secondary outline)
- **Content order (top to bottom):**
  1. **Alert strip** (if any): Missing payload items, start-date risk, or "Recommendation not yet ready".
  2. **AI recommendation card** (see §3) — primary focus so Ops sees suggestion first.
  3. **Staffing split** (see §4) — day-by-day or nightly view.
  4. **Route fit** (see §5) — map or list view of route efficiency.
  5. **Confidence & risk** (see §6) — compact block.
  6. **Compare options** (see §7) — expandable or secondary section.
  7. **Approve / override** (see §8) — inline with recommendation or sticky footer.
  8. **Packet payload** (existing): Scope, Schedule draft, Contacts, Supplies (read-only cards).
  9. **Timeline:** Submitted → [Accepted \| Changes requested] (optional).

### 2.2 Layout Grid

- **Main:** Single column, max-width 900px for reading; or two-column on large: left 2/3 (recommendation + staffing + route + actions), right 1/3 (payload summary + timeline).
- **Sticky (optional):** "Accept with recommendation" / "Accept with overrides" bar at bottom when user scrolls past recommendation card.

### 2.3 Loading and Empty States

- **Recommendation loading:** Skeleton for AI card (placeholder lines for crew, score, reasoning). Message: "Analyzing scope and routes…"
- **No recommendation:** Card with message: "No suggestion yet. You can still accept and assign crew manually after go-live." CTA: Accept (without prefill) or wait for refresh.

---

## 3. AI Recommendation Card

### 3.1 Purpose

One card that answers: **Who should do this, how much labor, how good is the route fit, and why?** Build trust with clear numbers and one short reasoning summary.

### 3.2 Card Structure

- **Container:** `Card` with `CardHeader` + `CardContent`. Optional left border accent: `border-l-4 border-primary` when confidence is high; `border-l-4 border-amber-500` when medium/low or risk present.
- **Header row:**
  - Title: "Suggested staffing" or "AI recommendation" (with small sparkle or brain icon, subtle).
  - Confidence pill (top-right): High \| Medium \| Low (color: success / default / warning).
- **Body (two-column grid or stacked on narrow):**

| Block | Content |
|-------|--------|
| **Recommended crew** | Crew name (link to crew if desired); "—" if none. |
| **Recommended supervisor** | Name or "—". |
| **Headcount** | e.g. "2" or "2–3" with unit "crew members". |
| **Weekly labor estimate** | e.g. "28 hrs" with optional "~4 hrs/night". |
| **Route fit score** | 0–100 with label "Route fit" and optional mini bar or gauge (see §5). |
| **Added travel time** | e.g. "+12 min" or "No extra travel" (vs baseline). |
| **Cluster** | e.g. "North cluster" or "With Site B, C" (cluster recommendation). |
| **Reasoning summary** | 1–3 sentences. e.g. "Crew Alpha already serves 2 sites within 1.2 mi; headcount matches scope and SLA. Low travel add." |

- **Footer row (inside card):**
  - **Backup options:** "2 other options" link → expands or opens compare view (see §7).
  - **Actions:** "Use suggestion" (primary) and "Override" (secondary) or "Edit and accept" (see §8).

### 3.3 Visual Hierarchy

- **Primary:** Recommended crew, headcount, weekly labor. Slightly larger or bold.
- **Secondary:** Supervisor, route fit, travel, cluster. Muted or normal weight.
- **Reasoning:** One block, `text-sm text-muted-foreground`; readable, no jargon.

### 3.4 Data Not Available

- If crew/supervisor not available: show "—" and still show labor, route fit, reasoning if present.
- If route fit not computed: "—" or "Not computed"; don’t show fake score.

---

## 4. Staffing Split Visualization

### 4.1 Purpose

Show **nightly or day-by-day** labor so Ops sees how the weekly estimate is distributed (e.g. Mon–Fri 4h, Sat 2h).

### 4.2 Pattern A: Bar strip (compact)

- **Horizontal bar:** One segment per day (Mon–Sun or Mon–Sat). Height or width = hours. Color: single tone (e.g. primary/muted) or gradient.
- **Labels:** Day abbreviation under each segment; hours on top or inside.
- **Total:** "28h total" at end of strip.
- **Use:** Inside AI card or directly below it.

### 4.3 Pattern B: Table (dense)

- **Columns:** Day \| Hours \| Notes (optional).
- **Rows:** Mon, Tue, Wed, Thu, Fri, Sat, Sun (or service days only).
- **Footer row:** Total hours.
- **Use:** When notes or variance matter (e.g. "Thu 6h (deep clean)").

### 4.4 Pattern C: List of nights (mobile-friendly)

- **List items:** "Mon – 4h", "Tue – 4h", … "Total – 28h".
- **Optional:** Small inline bar per row (width = hours).

### 4.5 Recommendation

- **Default:** Pattern A (bar strip) below the main recommendation block. Same card or adjacent card "Suggested weekly split".
- **Expandable:** "Show by day" toggles to Pattern B or C if needed.
- **Tokens:** Use `bg-primary/20` or `bg-muted` for bars; `text-muted-foreground` for labels.

---

## 5. Route-Fit Visualization Patterns

### 5.1 Route Fit Score (primary)

- **Display:** Number 0–100 with label "Route fit".
- **Visual options:**
  - **Pill + color:** Score in a pill; green (80+), default (50–79), amber (below 50). e.g. `87` in `bg-emerald-500/15 text-emerald-600 dark:text-emerald-400`.
  - **Mini horizontal bar:** Length = score%; same color rules.
  - **Gauge (optional):** Semicircle or circle gauge for "premium" feel; keep subtle.
- **Tooltip or subtitle:** "Based on existing routes and travel time." Do not overload the card.

### 5.2 Added Travel Time

- **Display:** "+12 min" or "No extra travel" or "−5 min (efficient add)".
- **Placement:** Next to route fit in AI card. Color: green if negative or zero, muted if positive but low, amber if high positive.

### 5.3 Cluster Recommendation

- **Display:** Text: "North cluster" or "With Site B, C" or "Standalone".
- **Optional:** Small list of "Fits with: [Site B], [Site C]" with links. Keeps route context without a full map.

### 5.4 Map Snippet (optional, detail only)

- **Use:** When map is available: small static or interactive map showing this location + recommended crew’s other sites. "Suggested cluster" highlighted.
- **Placement:** Below route-fit block or in a "Route context" card. Link "Open in Map" to full map with same context.

### 5.5 Consistency

- Route fit score and added travel appear in **list** (summary) and **detail** (full). Same scale (0–100) and same color rules everywhere.

---

## 6. Confidence and Risk UI

### 6.1 Confidence Score

- **Display:** Pill or badge: **High** \| **Medium** \| **Low** (no raw % in primary UI to avoid false precision; optional in tooltip).
- **Colors:** High = success (green); Medium = default/muted; Low = warning (amber).
- **Placement:** AI card header (top-right) and/or next to "Use suggestion" so Ops sees it before accepting.
- **Tooltip (optional):** "Based on data quality and route coverage."

### 6.2 Risk Flags

- **Display:** List of 1–5 short labels. e.g. "Start date in 3 days", "No backup crew", "New crew", "Peak night conflict".
- **Visual:** Small tags or icon + label. Semantic colors: warning (amber) for time/backup, destructive (red) only for critical (e.g. "Start date passed").
- **Placement:** Below confidence in AI card or in a small "Risks" row. Optional: "View details" to expand or show in compare view.
- **Empty:** "No risk flags" (muted) or hide row.

### 6.3 Combined Block (compact)

- **One row:** Confidence: [pill] · Risks: [count] or [first 2 flags] "+N more".
- **Expandable:** Click to see full risk list and short mitigation hints (e.g. "Consider confirming backup crew").

---

## 7. Compare-Options Interaction

### 7.1 Purpose

Let Ops see **backup options** (e.g. Crew Beta, Crew Gamma) with same metrics (route fit, labor, travel) so they can choose without leaving the page.

### 7.2 Trigger

- **Link in AI card:** "2 other options" or "Compare options".
- **Behavior:** Expands inline **or** opens a slide-over panel (recommended for many options).

### 7.3 Compare View Content

- **Table or cards:** Each row/card = one option (recommended + alternatives).
- **Columns/fields:** Crew · Supervisor · Headcount · Weekly hrs · Route fit · Travel · Confidence · (optional) Short reason.
- **Recommended row:** Highlight with left border or "Suggested" badge.
- **Selection:** Radio or "Use this" per row. On "Use this", close compare and set override (see §8).

### 7.4 Interaction

- **Slide-over:** From right, width 400–500px. Title "Compare staffing options". Close on "Use suggestion" (top option), "Use this" (another row), or X.
- **Inline:** Accordion or collapsible "Backup options" below main card; same table/cards.

### 7.5 Copy

- "Suggested" for the top option; "Alternative" or "Backup" for others. No "Best" or "Required".

---

## 8. Approve / Override Workflow

### 8.1 Primary Path: Accept with Recommendation

- **Button:** "Accept with suggestion" or "Use suggestion & go live".
- **Behavior:** Accepts activation using AI-suggested crew, supervisor, headcount (and optional schedule split). One confirmation: "Accept and go live? This will activate the account and assign [Crew] per suggestion." Confirm → success; redirect or in-place update to "Accepted on [date]. Account is live." + link to account/schedules.

### 8.2 Override Path: Accept with Changes

- **Button:** "Override and accept" or "Edit and accept".
- **Behavior:** Opens **override form** (inline or modal):
  - **Crew:** Dropdown or search (required if overriding).
  - **Supervisor:** Dropdown (optional).
  - **Headcount:** Number input (optional).
  - **Schedule / split:** Optional day-by-day override (or "Use suggested split" checkbox).
  - **Reason (optional):** Free text "Why overriding?" for audit.
- **Submit:** "Accept with my choices" → same accept flow with overridden values. Success state same as 8.1.

### 8.3 Safety and Clarity

- **No auto-assign:** User must click "Accept with suggestion" or "Override and accept". No silent apply.
- **Confirmation:** One dialog for accept (with or without override). Summary line: e.g. "Crew: Alpha (suggested)" or "Crew: Beta (override)".
- **Audit:** Override reason and overridden fields stored for reporting; not required to block accept.

### 8.4 Button Placement

- **Detail page:** Sticky footer or inline under AI card: "Accept with suggestion" (primary), "Override and accept" (secondary). "Request changes" (outline) for send-back-to-Sales.
- **After accept:** Hide accept buttons; show "Accepted on [date]. Account is live." and link to account/schedules.

---

## 9. Command Center Widgets

### 9.1 Widget: Route Efficiency (Activations)

- **Purpose:** Surface activations where **route fit is low** or **travel add is high** so Ops can prioritize or adjust.
- **Placement:** Ops Command Center, right column (with or near Activations panel).
- **Content:**
  - Title: "Activations — route watch"
  - List: 3–5 items. Each: Account name, Route fit (score or pill), Added travel (e.g. "+15 min"). Link to activation detail.
  - Empty: "No activations with route concerns."
  - Action: "View all" → Activations list (optional filter: low route fit).
- **Data:** Activations (ready/sent_to_ops) with recommendation; filter by route_fit &lt; 70 or added_travel &gt; threshold.

### 9.2 Widget: Staffing Readiness (Activations)

- **Purpose:** Show activations that have **recommendation ready** vs **pending** so Ops knows what’s actionable.
- **Placement:** Same column as Activations panel or combined.
- **Content:**
  - Title: "Activations"
  - Summary: "N awaiting · M with suggestion ready"
  - List: Up to 5. Each: Account name, "Suggested: [Crew]" or "Pending…", "Review" link.
  - Action: "View all" → `/app/ops/launch-intake`.
- **Data:** Same as current Activations; add flag `has_recommendation` and optionally `recommended_crew_name`.

### 9.3 Widget: Activation Risk

- **Purpose:** Highlight activations with **risk flags** (start date soon, no backup, etc.) so Ops triages first.
- **Placement:** Command Center action rail ("Requires action") or a small "Activation risks" panel.
- **Content:**
  - Title: "Activation risks"
  - List: 3–5 items. Each: Account name, 1–2 risk flags (e.g. "Start in 2 days", "No backup"). Link to detail.
  - Empty: "No activation risks."
  - Action: "View all" → Activations (optional filter: has_risk_flags).
- **Data:** Activations with `risk_flags` length &gt; 0 or start_date within next 7 days.

### 9.4 Unification Option

- **Single "Activations" panel** with three subsections: **Awaiting (N)** | **Route watch (M)** | **Risks (K)**. Tabs or stacked lists. Reduces widget count; keeps one entry point.

### 9.5 Visual Style

- Same panel style as existing Command Center: `OpsPanelShell` or equivalent; title, short description, list, "View all" link. Use semantic tokens; no custom colors. Risk flags use warning/destructive only where appropriate.

---

## 10. Data and Copy Summary

### 10.1 Recommended Fields (per activation recommendation)

| Field | Type | List | Detail | Notes |
|-------|------|------|--------|-------|
| recommended_crew_id / name | id + name | ✓ (name) | ✓ | "—" if none |
| recommended_supervisor_id / name | id + name | — | ✓ | "—" if none |
| recommended_headcount | number | — | ✓ | e.g. 2 |
| weekly_labor_estimate_hours | number | ✓ (e.g. 28h) | ✓ | |
| nightly_staffing_split | array of { day, hours } | — | ✓ | §4 |
| route_fit_score | 0–100 | ✓ | ✓ | §5 |
| added_travel_minutes | number | — | ✓ | §5 |
| cluster_recommendation | string or ids | — | ✓ | §5 |
| confidence | high \| medium \| low | ✓ | ✓ | §6 |
| risk_flags | string[] | ✓ (count or icons) | ✓ | §6 |
| backup_options | array of option | — | ✓ (compare) | §7 |
| reasoning_summary | string | — | ✓ | §3 |

### 10.2 Copy Checklist (JaniBear OS)

- Use **"Suggested"**, **"Recommended"**, **"AI recommendation"** (not "Assigned", "Required", "Must").
- Override = **"Override and accept"** or **"Edit and accept"** (operator in control).
- Widgets: **"Route watch"**, **"Staffing readiness"**, **"Activation risks"** (informational, not commands).

---

## 11. Implementation Notes

### 11.1 Components to Add or Extend

- **Activations list:** Extend `LaunchIntakeList` or new `ActivationsListWithAI` with columns for AI summary, labor, risk; pass recommendation summary from server.
- **Activation detail:** New sections: `ActivationAIRecommendationCard`, `StaffingSplitBar`, `RouteFitBlock`, `ConfidenceRiskRow`, `CompareOptionsSlideOver`, `AcceptOverrideActions`.
- **Command Center:** Extend `UpcomingGoLivesPanel` or add `ActivationsRouteWatchPanel`, `ActivationsReadinessPanel`, `ActivationsRiskPanel`; or one `ActivationsPanel` with subsections (see §9.4).
- **Shared:** `ConfidencePill`, `RouteFitScore`, `RiskFlagsList` (reusable in list and detail).

### 11.2 API / Data

- Recommendation can be computed on-demand when opening detail, or precomputed when packet reaches ready/sent_to_ops. List needs at least: has_recommendation, recommended_crew_name, route_fit_score, confidence, risk_flags count.
- Override: accept payload includes optional overrides (crew_id, supervisor_id, headcount, split); store with activation for audit.

### 11.3 Files to Touch

- `src/app/app/ops/launch-intake/page.tsx` — fetch recommendation summary for list.
- `src/app/app/ops/launch-intake/[id]/page.tsx` — fetch full recommendation; render new sections.
- `src/components/launch/launch-intake-list.tsx` or new list component — AI columns.
- New: `src/components/activations/ActivationAIRecommendationCard.tsx`, `StaffingSplitBar.tsx`, `RouteFitBlock.tsx`, `CompareOptionsSlideOver.tsx`, `AcceptOverrideActions.tsx`.
- Command Center: `src/lib/ops/getOpsCommandCenterData.ts`, `UpcomingGoLivesPanel` or new panels (see §9).
- Copy: `src/lib/launch-handoff-copy.ts` or new `activations-ai-copy.ts`.

---

This doc is the single reference for the Activations AI recommendations UI. Keep the interface operator-only, recommendation-focused, and override-safe so it feels like a premium ops manager without implying labor control by the platform.
