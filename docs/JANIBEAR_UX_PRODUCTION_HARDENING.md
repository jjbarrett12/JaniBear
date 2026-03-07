# JANIBEAR — Production-Hardening UX Audit

**Focus:** Stable, clear, trustworthy product UI for beta customers.  
**Out of scope:** Marketing/landing redesign.

---

## 1. Onboarding Clarity

### Current state
- **Seat onboarding wizard** (`/onboarding/wizard`): Multi-step org + seat + payment; error state is inline text; no progress persistence message.
- **Import flow** (`/onboarding/import/upload` → confirm → review → done): Clear 3-step strip; upload and Migration Command Center are well structured. Post-import done has clear “Invite Your Crew” and secondary actions.

### Page-level recommendations
| Page | Recommendation |
|------|----------------|
| `/onboarding/wizard` | Add one-line “Progress is saved” or step indicator that survives refresh. Show “Step X of 5” in header. On step 1 error, show recovery hint (e.g. “Try a different org name” or “Check you’re not already in an org”). |
| `/onboarding/import/upload` | Add optional “Skip import” link for users who want to start empty, with short explanation. |
| `/onboarding/import/done` | Add single “Next: Invite your crew” as the primary path; keep secondary actions but visually secondary. |

### Component recommendations
- **Shared onboarding step indicator:** Reusable step strip (1–5 or 1–3) with current step and “saved” state.
- **Wizard error block:** Use a small `Alert` with title “Couldn’t complete this step” and description + retry, instead of plain `setError` text.
- **Import “Skip”:** Small text link + tooltip: “Start without importing data. You can import later from Settings.”

---

## 2. Empty States

### Current state
- **Admin:** `AdminEmptyState` (icon, title, description, action). Used in invites, audit, etc.
- **Enterprise:** `EmptyState` and `EmptyStatePanel` (icon, title, description, action). Used in CRM, accounts, supplies, etc.
- **Ad-hoc:** Many pages use custom empty blocks (e.g. Inspections “No inspections yet”, Launch Intake “No launches in queue”, Coverage Gaps “No coverage gaps right now”).

### Page-level recommendations
| Area | Recommendation |
|------|----------------|
| Inspections | Empty state: “No inspections yet” + “Start your first inspection” + one line: “Inspections help you track quality and compliance at each location.” |
| Launch Intake | Keep “No launches in queue”; add: “When Sales submits a launch packet, it will appear here for you to accept or request changes.” |
| Leads / Pipeline / Proposals | Use consistent empty state component with icon, title, one-sentence explanation, and single primary CTA. |
| Accounts / Crews / Schedules | Every list empty state should answer: what this list is, why it’s empty, and the one best next action. |

### Component recommendations
- **Unified `AppEmptyState`:** Single component used across app (not just admin): `icon`, `title`, `description` (1–2 sentences), `action` (ReactNode), optional `secondaryAction`. Reuse in inspections, launch intake, leads, pipeline, proposals, accounts, crews.
- **Empty state copy registry:** Central list of titles/descriptions per route (e.g. `inspections.empty`, `launchIntake.empty`) so copy is consistent and easy to tune for beta.

---

## 3. Error States

### Current state
- **Route-level:** `error.tsx` at app root and under `dashboard`, `admin`, `university`. They show “Something went wrong”, error message, Try again, and Go home / Back to dashboard.
- **Inline:** Many forms use `error && <p className="text-destructive">…</p>` with no title or recovery hint.
- **API:** Some API routes return 403 with “Forbidden”; client often just shows raw message.

### Page-level recommendations
| Context | Recommendation |
|--------|----------------|
| Route error (error.tsx) | Keep Try again + safe exit (Dashboard/Home). Add one line: “If this keeps happening, try refreshing or contact support.” |
| Form/action errors | Always show: short title (“Couldn’t save” / “Request failed”), the message, and one recovery (e.g. “Check your connection and try again” or “Make sure all required fields are filled.”). |
| 403 / permission denied | Do not show raw “Forbidden”. Show friendly “You don’t have access to this” and a clear next step (e.g. “Go to Dashboard” or “Ask your admin for access.”). |

### Component recommendations
- **`AppErrorBlock`:** Small block for inline errors: optional `title`, `message`, optional `recovery` string, optional `onRetry`. Use in forms and mutation handlers.
- **Forbidden page:** Add “What you can do” section: “Go to Dashboard”, “Switch organization”, “Contact your admin if you believe you should have access.”

---

## 4. Loading States

### Current state
- **Dashboard:** Dedicated `loading.tsx` with skeleton matching layout (header, KPI strip, cards).
- **Admin:** Route-level `loading.tsx` (e.g. users, compliance) with skeletons.
- **Generic:** `LoadingFallback` (spinner + “Loading…” + dots). Some tables/lists have no loading state (data fetches in parent).

### Page-level recommendations
| Area | Recommendation |
|------|----------------|
| All data-heavy app routes | Provide a `loading.tsx` that mirrors the main content structure (skeleton for header + main content area). |
| Tables and lists | While loading, show table skeleton (rows) or a compact “Loading…” row; avoid flash of empty then data. |
| Buttons that trigger mutation | Use `disabled={loading}` and change label (e.g. “Saving…”, “Submitting…”). Already done in many places; audit for consistency. |

### Component recommendations
- **Route loading convention:** Every `page.tsx` under `/app/app/*` that fetches data should have a sibling `loading.tsx` with a skeleton that matches the page (e.g. title bar + content skeleton).
- **`AppTableSkeleton`:** Reusable skeleton for table (header row + N body rows) for leads, inspections, launch intake, etc., so empty state doesn’t flash before data.

---

## 5. Permission Denied States

### Current state
- **App forbidden:** `/app/forbidden` — “Access denied”, “You don’t have permission to view this page”, single “Back to dashboard” button.
- **Redirect:** Pages that use `requirePermission` redirect to `/app/forbidden` on 403.
- **Platform forbidden:** `/platform/forbidden` for platform-admin-only areas.

### Page-level recommendations
| Page | Recommendation |
|------|----------------|
| `/app/forbidden` | Add: “What you can do” with links: “Go to Dashboard”, “Switch organization” (if multiple orgs), “Contact your admin if you need access.” Do not expose permission keys or technical details. |
| Platform forbidden | Keep as-is; already clear. |

### Component recommendations
- **Forbidden layout:** Icon + title + one sentence + list of 2–3 actions (Dashboard, Switch org, Contact admin). Same pattern for app and platform if desired, with different copy.

---

## 6. Launch-to-Ops Handoff Clarity

### Current state
- **Sales:** Launch packets list; “Launch to Ops” / “Submit to Operations” via `SendToOpsButton`; copy on launch packet detail: “Deal handoff to Operations…”
- **Ops:** Launch Intake list and detail; “Accept Intake” / “Request Changes” in `AcceptRejectLaunchForm`; header explains “Review Launch Packets from Sales…”

### Page-level recommendations
| Page | Recommendation |
|------|----------------|
| Sales launch packet detail | At top, add a one-line status strip: “Sales → Ops: [Draft | Ready | Submitted].” Explain what “Submit to Operations” does: “Sends this packet to the Ops team to activate the account and create schedules.” |
| Ops Launch Intake list | Keep “Review Launch Packets from Sales…” Add subline: “Accept to activate the account; Request changes to send feedback to Sales.” |
| Ops Launch Intake detail | Above Accept/Request Changes, add: “Accepting will activate this account and create schedules. Requesting changes sends your feedback to Sales.” |
| After Submit to Ops | `SendToOpsButton` already redirects to `/app/ops/launch-intake?highlight=…`. Add a toast or inline success: “Packet sent to Ops. They’ll see it in Launch Intake.” |

### Component recommendations
- **Handoff status badge:** Reusable badge for Draft | Ready | Submitted | Accepted | Changes requested.
- **Handoff copy module:** Central strings for “what happens when you submit” and “what happens when you accept/reject” so Sales and Ops messaging is consistent.

---

## 7. Crew Change Workflow UX

### Current state
- **Coverage Gaps (Ops):** `CoverageGapsWidget` — “Recommended backup” loads suggestions; “Assign” assigns backup. Empty state: “No coverage gaps right now.”
- **Risk / account-level:** Assign backup from risk detail; request coverage via API.

### Page-level recommendations
| Context | Recommendation |
|--------|----------------|
| Coverage Gaps | When loading recommendations, show “Finding backup options…” and disable Assign until loaded. On assign success, show brief success feedback (toast or inline “Assigned”) and refresh list. |
| Assign backup | Make it clear this is “Add backup” (not necessarily “Replace”). One line: “This adds a backup; the primary assignment stays.” if that’s the model. |
| Request coverage | If there’s a “Request coverage” flow in UI, make the outcome clear: “Request sent. A manager will assign coverage.” |

### Component recommendations
- **Loading state for “Recommended backup”:** Skeleton or spinner in the gap row while `loadRecommendations` runs.
- **Post-assign feedback:** Use toast (or inline) “Backup assigned” so the user doesn’t rely only on list refresh.

---

## 8. Inspection Workflow Clarity

### Current state
- **List:** Inspections page with “New Inspection”, recent list or empty “No inspections yet” + “Start your first inspection”.
- **Start flow:** Link to `/app/inspections/start`; inspection runner exists.

### Page-level recommendations
| Page | Recommendation |
|------|----------------|
| Inspections list | Add one line under the title: “Run quality checks at locations and track scores over time.” Empty state: add “Inspections help you track quality and compliance at each location.” |
| Inspection start | Ensure the start flow has a clear “Choose location” → “Choose template” (or equivalent) and “Start inspection” so the sequence is obvious. |
| In-progress vs completed | List clearly distinguishes “In progress” vs score; keep current treatment. Consider “Due” or “Scheduled” if inspections can be scheduled. |

### Component recommendations
- **Empty state:** Use shared `AppEmptyState` with inspection-specific copy and primary CTA “Start your first inspection”.
- **Start flow:** If multi-step, add a slim step indicator (e.g. “Step 1 of 2”) so users know how many steps remain.

---

## 9. Dashboard Trust Signals

### Current state
- **Executive/Ops dashboard:** KPI strip, alert rail, cockpit panels, franchisee banner when applicable.
- **Data source:** Data from `getCommandCenterData` and similar; no explicit “last updated” or “data as of” on the dashboard.

### Page-level recommendations
| Element | Recommendation |
|---------|----------------|
| Dashboard header | Add a subtle “Data as of [time]” or “Last updated [relative time]” so users know the numbers are fresh. |
| KPI tiles | No change to layout; ensure loading and error states don’t show stale or wrong numbers (skeleton until loaded). |
| Franchisee banner | Already clear (“You’re viewing your franchise location…”). Optional: add “Switch to [org name]” if multiple orgs. |
| Alert rail | When there are no actions, show a calm “All caught up” or hide the rail; avoid an empty urgent strip. |

### Component recommendations
- **Data freshness:** Optional `DataFreshness` component (e.g. “Updated 2 min ago”) in dashboard header, fed by same fetch that loads dashboard data.
- **Alert rail empty state:** If `actionCount === 0`, show “All caught up” with a checkmark or hide the rail instead of an empty box.

---

## 10. Reducing Confusion in Sales vs Ops Boundaries

### Current state
- **Nav:** Sidebar built from shell/role; separate sections for Executive, Sales, Launch, Operations. Launch appears under both Sales (launch packets) and Ops (launch intake).
- **Routing:** Sales rep → `/app/sales-dashboard`; others → dashboard or ops. Permission checks redirect to `/app/forbidden`.

### Page-level recommendations
| Area | Recommendation |
|------|----------------|
| Sidebar | Ensure section labels are clear: “Sales”, “Launch” (or “Launch & handoff”), “Operations”. Consider a short tooltip or aria-description: “Sales: leads, pipeline, proposals. Ops: deployments, launch intake, risk.” |
| Breadcrumbs / context | On Sales pages, show a slim “Sales” or “GRIZZLY” context; on Ops pages, “Operations” or “Ops Command Center” so users always know which world they’re in. |
| Launch | Label so it’s obvious: Sales side = “Launch packets” (what you send); Ops side = “Launch intake” (what you receive). Optional: same “Launch” section with sub-items “Packets (Sales)” and “Intake (Ops)” if both visible. |
| Dashboard vs Sales dashboard | When redirecting sales rep to “Sales dashboard”, ensure that page has a clear “Sales” or “GRIZZLY” header so they don’t think they’re in the main ops dashboard. |

### Component recommendations
- **Section aria-labels:** Add aria-label to nav sections, e.g. “Sales: leads, pipeline, walkthroughs, proposals”.
- **Context strap:** Reuse the existing “strap” pattern (e.g. “Cockpit”, “Target board”) on Sales; add similar “Ops Command Center”, “Launch Intake” on Ops pages so the strap doubles as “you are here” context.

---

## Prioritized UX Fix List

### P0 — Ship before beta (high impact, low risk)
1. **Forbidden page** — Add “What you can do”: Dashboard, Switch org, Contact admin. Improves trust when users hit permission errors.
2. **Unified empty state** — Introduce `AppEmptyState` and use it on Inspections, Launch Intake, and one Sales list (e.g. Leads) so empty states are consistent and suggest next steps.
3. **Inline error block** — Add `AppErrorBlock` (title, message, recovery, retry) and use in 2–3 critical flows (e.g. launch plan save, accept/reject launch, onboarding wizard).
4. **Launch handoff copy** — Add one-line “what happens when you submit” on Sales and “what happens when you accept” on Ops Launch Intake detail.

### P1 — First beta iteration *(implemented)*
5. **Loading skeletons** — Add or align `loading.tsx` for Inspections, Launch Intake, Sales leads so no flash of empty. *(Done: `app/inspections/loading.tsx`, `app/ops/launch-intake/loading.tsx`, `app/sales/leads/loading.tsx`.)*
6. **Dashboard “Data as of”** — Add subtle “Last updated” or “Data as of [time]” in dashboard header. *(Done: `CommandCenterData.fetchedAt`, `DashboardHeader` shows “Data as of X min ago”.)*
7. **Onboarding wizard errors** — Use Alert + recovery hint on step 1 (and optionally other steps) instead of plain text. *(Done: `AppErrorBlock` on step 1 create-org and step 4 checkout.)*
8. **Crew assign feedback** — After assigning backup, show toast or inline “Backup assigned” and refresh. *(Done: `CoverageGapsWidget` uses `useToast` + `router.refresh()`.)*

### P2 — Polish
9. **Empty state copy registry** — Central copy for all empty states (inspections, launch intake, leads, pipeline, proposals, accounts).
10. **Inspection empty state** — Use `AppEmptyState` with the recommended copy and primary CTA.
11. **Alert rail when empty** — Show “All caught up” or hide when no actions. *(Done: `DASHBOARD_COPY.alertRail.empty` set to “All caught up”.)*
12. **Nav section labels** — Add aria-labels to sidebar sections for Sales vs Ops clarity.

### P3 — Later
13. **Onboarding “Skip import”** — Optional skip link on import upload with tooltip.
14. **Handoff status badge** — Reusable Draft | Ready | Submitted | Accepted component.
15. **Step indicators** — Reusable step strip for onboarding and inspection start flow.

---

## Summary

- **Onboarding:** Progress clarity, error recovery, optional skip import.
- **Empty states:** One shared component, consistent copy, obvious next action.
- **Errors:** Friendly route errors, structured inline errors with recovery, friendly 403 page.
- **Loading:** Route skeletons for key pages, button loading states, no empty flash.
- **Permission denied:** Forbidden page with clear next steps.
- **Launch-to-Ops:** Short “what happens” copy on Sales and Ops.
- **Crew change:** Loading and success feedback for assign backup.
- **Inspections:** Clear empty state and optional step indicator on start.
- **Dashboard:** Data freshness signal, calm “all caught up” when no alerts.
- **Sales vs Ops:** Clear section labels and context straps so users always know which side they’re on.

Implementing the P0 items will give the biggest gain in stability, clarity, and trust for beta with minimal risk.
