# GRIZZLY Sales Module — Workflow Hardening Audit

**Date:** 2025-03-03  
**Scope:** Leads, Accounts, Contacts, Opportunities, Walkthroughs, Proposals, Map. Revenue flow, conversion, handoff, UX, permissions.

---

## Executive Summary

The sales module has **two conversion implementations**: a robust, unused one (`convertLeadToSalesObjects` in `lib/sales/convertLead.ts`) and a thin one in use (`convertLeadToOpportunity` in `actions/leads.ts`) that does not create contacts, does not create walkthroughs, does not check for duplicate accounts, and does not log conversion activity. Pipeline and “Launch to Operations” navigation are fragmented; there is **no UI to create launch packets**; and walkthrough scheduling from leads is absent. These issues directly hurt pipeline clarity, conversion quality, and handoff reliability.

---

## 1. INFORMATION ARCHITECTURE

### 1.1 Redundant / confusing pipeline entry points
- **Severity:** High  
- **Why it hurts revenue:** Reps looking for “Opportunities” hit Sales → Pipeline, which redirects to `/app/kpis?tab=pipeline`. The real pipeline board is at `/app/crm/pipeline`. Two mental models (Sales vs CRM) and an extra redirect slow deal movement.  
- **Root cause:** `navFactory` points “Opportunities” to `/app/sales/pipeline`; that page only redirects to KPIs.  
- **Fix:** Point Sales nav “Opportunities” / “Pipeline” to `/app/crm/pipeline` (single source of truth), or make `/app/sales/pipeline` render the same pipeline board (e.g. shared component).  
- **Files:** `src/lib/nav/navFactory.ts`, `src/app/app/sales/pipeline/page.tsx`, `src/app/app/crm/pipeline/page.tsx`  
- **Risks:** Rep confusion, slower movement to close.

### 1.2 “Schedule walkthrough” copy with no one-click action
- **Severity:** High  
- **Why it hurts revenue:** Lead → Walkthrough is the critical step; copy promises it but there is no “Schedule walkthrough” button from lead detail or drawer.  
- **Root cause:** `SALES_COPY.leadDetail.scheduleWalkthrough` exists; `LeadDetailQuickActions` and drawer only offer Convert, Mark qualified, Log call (disabled), Add note (disabled).  
- **Fix:** Add “Schedule walkthrough” that goes to `/app/walkthroughs/new?leadId=<id>` and pre-fill from lead (company, contact, address). Alternatively, add a conversion path that creates opportunity + walkthrough in one step.  
- **Files:** `src/components/sales/lead-detail-quick-actions.tsx`, `src/components/sales/leads-table-with-drawer.tsx`, `src/app/app/walkthroughs/new/page.tsx`, `src/components/walkthroughs/walkthrough-form.tsx`  
- **Risks:** Lost walkthroughs, rep friction.

### 1.3 Disabled placeholders (Log call, Add note, Create task)
- **Severity:** Medium  
- **Why it hurts revenue:** Reps cannot log calls or tasks from the lead drawer; follow-up discipline and activity history suffer.  
- **Root cause:** Buttons are present but `disabled` with “(TODO)”.  
- **Fix:** Implement Log call (e.g. `lead_touch_log` or `lead_activities`) and Add note; or remove the buttons until implemented to avoid clutter.  
- **Files:** `src/components/sales/leads-table-with-drawer.tsx`, `src/components/sales/lead-detail-quick-actions.tsx`  
- **Risks:** Rep confusion, weak activity trail.

---

## 2. LEADS FLOW

### 2.1 Saved view “needs_follow_up” uses raw timestamp
- **Severity:** Medium  
- **Why it hurts revenue:** Overdue follow-ups are correct in concept but timezone/date boundaries can be wrong; no “due today” vs “overdue” distinction in the view label.  
- **Root cause:** Query uses `lte('next_follow_up_at', new Date().toISOString())`; list shows “Next follow-up” but no visual emphasis for overdue in table.  
- **Fix:** Keep query; in table/drawer show overdue (e.g. red or “Overdue”) when `next_follow_up_at < start of today`; consider “Due today” view.  
- **Files:** `src/app/app/sales/leads/page.tsx`, `src/components/sales/leads-table-with-drawer.tsx`  
- **Risks:** Missed follow-ups.

### 2.2 Lead list default view
- **Severity:** Low  
- **Why it hurts revenue:** Default “my_new_leads” is reasonable; “hot_leads” could be default for revenue-first behavior.  
- **Fix:** Consider making “Hot” or “Follow-Up Due” the default when non-empty; or leave as-is and ensure hot/follow-up are one click away.  
- **Files:** `src/app/app/sales/leads/page.tsx` (default `view`)

---

## 3. CONVERSION LOGIC

### 3.1 Two conversion implementations; only the weak one is used
- **Severity:** Critical  
- **Why it hurts revenue:** The used conversion does not create a Contact, does not create a Walkthrough, does not check for duplicate accounts, and does not write conversion activity. That weakens data quality, creates duplicate accounts, and breaks the intended flow (Lead → Walkthrough → Opportunity).  
- **Root cause:** `convertLeadToSalesObjects` (lib/sales/convertLead.ts) is never called; UI and server use `convertLeadToOpportunity` (actions/leads.ts) only.  
- **Fix (recommended):**  
  1. In `convertLeadToOpportunity`, add: (a) duplicate account lookup by company name (reuse or inline logic from convertLead.ts); (b) create a Contact from lead (company, contact_name, email, phone) linked to the account; (c) optional “schedule walkthrough” with `scheduledAt` and create walkthrough linked to opportunity + lead; (d) write to `lead_activities` or equivalent with activityType `converted`.  
  2. Or: introduce a single conversion API that uses `convertLeadToSalesObjects` with real Supabase deps and call it from the modal.  
- **Files:** `src/actions/leads.ts`, `src/lib/sales/convertLead.ts`, `src/components/sales/convert-lead-to-opportunity-modal.tsx`  
- **Risks:** Duplicate accounts, no contact/activity trail, orphan opportunities, lost walkthrough linkage.

### 3.2 No contact created on conversion
- **Severity:** Critical  
- **Why it hurts revenue:** Proposals and handoffs need a contact; opportunity has no primary_contact_id set; lead email/phone/name are not persisted to a contact record.  
- **Root cause:** `convertLeadToOpportunity` only creates account + opportunity; no contact insert.  
- **Fix:** Create a contact (e.g. in `contacts` or `client_contacts` / account-contact model) from lead and set `primary_contact_id` on opportunity if schema supports it; otherwise link contact to account and show on opportunity.  
- **Files:** `src/actions/leads.ts`, schema for contacts / client_contacts  
- **Risks:** Broken proposal and handoff flows, no single contact record.

### 3.3 No duplicate account check on conversion
- **Severity:** High  
- **Why it hurts revenue:** Two reps converting “Acme Corp” create two accounts; pipeline and reporting fragment.  
- **Root cause:** Only the unused `convertLeadToSalesObjects` calls `findDuplicateAccount`; `convertLeadToOpportunity` does not.  
- **Fix:** Before creating a new account, query accounts by org + normalized company name (trim, lower); if found, offer “Use existing Acme Corp” or auto-use and show in UI.  
- **Files:** `src/actions/leads.ts`, `src/components/sales/convert-lead-to-opportunity-modal.tsx`  
- **Risks:** Duplicate accounts, split pipeline.

### 3.4 Post-convert redirect sends rep to KPIs, not opportunity
- **Severity:** High  
- **Why it hurts revenue:** Rep expects to land on the new opportunity to set next step, proposal, or walkthrough; instead lands on KPIs with a highlight param.  
- **Root cause:** Modal submits then `router.push(\`/app/kpis?tab=pipeline&highlight=${result.opportunityId}\`)`.  
- **Fix:** Redirect to `/app/crm/opportunities/${result.opportunityId}` so rep lands on the new deal.  
- **Files:** `src/components/sales/convert-lead-to-opportunity-modal.tsx`  
- **Risks:** Lost momentum, delayed next action.

### 3.5 Conversion does not set lead_id on opportunity
- **Severity:** Medium  
- **Why it hurts revenue:** Traceability from opportunity back to lead is only via `leads.converted_opportunity_id`; opportunity has no `lead_id` (if schema has it).  
- **Root cause:** Migration 112 adds many opportunity columns; need to confirm if `lead_id` exists on opportunities. If yes, set it on insert.  
- **Fix:** If `opportunities.lead_id` exists, set it in `convertLeadToOpportunity` insert.  
- **Files:** `src/actions/leads.ts`, `supabase/migrations/`  
- **Risks:** Weaker reporting and lineage.

---

## 4. WALKTHROUGHS

### 4.1 Walkthroughs not created at conversion
- **Severity:** Critical  
- **Why it hurts revenue:** Desired flow is “qualify → schedule walkthrough → complete → opportunity → proposal → close.” Conversion skips walkthrough creation; rep must manually create from a different place.  
- **Root cause:** Used conversion path does not create walkthrough; modal has no “Schedule walkthrough” option or date.  
- **Fix:** In convert modal, add optional “Schedule walkthrough on” (date/time); when provided, create walkthrough linked to new opportunity + lead and set status. Reuse or mirror `convertLeadToSalesObjects` walkthrough creation.  
- **Files:** `src/actions/leads.ts`, `src/components/sales/convert-lead-to-opportunity-modal.tsx`, `src/actions/walkthroughs.ts` or walkthrough insert  
- **Risks:** Walkthroughs buried, missed scheduling.

### 4.2 New walkthrough form not pre-filled from lead
- **Severity:** High  
- **Why it hurts revenue:** Rep scheduling from lead must re-type company, contact, address.  
- **Root cause:** `/app/walkthroughs/new` uses `WalkthroughForm` with empty state; no `leadId` or pre-fill.  
- **Fix:** Support `?leadId=`; load lead and pre-fill company, contact, email, phone, address (and optionally create/link opportunity).  
- **Files:** `src/app/app/walkthroughs/new/page.tsx`, `src/components/walkthroughs/walkthrough-form.tsx`  
- **Risks:** Friction, data re-entry errors.

### 4.3 Walkthrough list under Sales vs global Walkthroughs
- **Severity:** Low  
- **Why it hurts revenue:** Sales → Walkthroughs lists walkthroughs; “New” goes to `/app/walkthroughs/new` (outside sales). Consistency is acceptable but could be `/app/sales/walkthroughs/new` for clarity.  
- **Fix:** Optional: add sales-scoped new walkthrough route that accepts leadId and redirects to walkthroughs/new with query.  
- **Files:** `src/app/app/sales/walkthroughs/page.tsx`, nav  
- **Risks:** Minor confusion.

---

## 5. OPPORTUNITY PIPELINE

### 5.1 Pipeline stage list vs opportunity insert stages
- **Severity:** Medium  
- **Why it hurts revenue:** Convert modal uses stages: qualified, prospect, walkthrough, drafted, delivered, negotiating, verbal_yes. CRM pipeline uses: new, prospect, walkthrough, drafted, delivered, negotiating, verbal_yes, signed, won, lost. “new” and “qualified” can diverge; “signed” may be missing in modal.  
- **Root cause:** Two hardcoded stage lists.  
- **Fix:** Single source of stages (constant or DB); use same list in modal and pipeline; ensure “qualified” and “new” map correctly and “signed”/“won”/“lost” are present where needed.  
- **Files:** `src/components/sales/convert-lead-to-opportunity-modal.tsx`, `src/app/app/crm/pipeline/page.tsx`  
- **Risks:** Deals in inconsistent stages.

### 5.2 No expected_close_date or probability on new opportunity
- **Severity:** Medium  
- **Why it hurts revenue:** Forecast and “revenue this month” depend on expected_close_date and probability; new opportunities lack them.  
- **Root cause:** Insert only sets stage, est_value, owner_id, created_by; schema has expected_close_date, probability.  
- **Fix:** In modal, add optional expected close date (default e.g. +30d); set probability from stage if desired. Insert these in `convertLeadToOpportunity`.  
- **Files:** `src/actions/leads.ts`, `src/components/sales/convert-lead-to-opportunity-modal.tsx`  
- **Risks:** Weak forecast, stale deals not flagged.

---

## 6. PROPOSAL FLOW

### 6.1 Proposals list and “Mark as won” / handoff
- **Severity:** Medium  
- **Why it hurts revenue:** Proposals page shows proposals and links to Mark as Won; after won, handoff to ops is unclear (see 10.1).  
- **Root cause:** markDealWon updates opportunity + proposals to accepted; no automatic launch packet creation.  
- **Fix:** Keep markDealWon; add post-won CTA: “Create launch packet” linking to a flow that creates a launch_packet from the won opportunity (or document that launch packets are created elsewhere).  
- **Files:** `src/components/crm/opportunity-mark-won-handler.tsx`, `src/app/app/sales/proposals/page.tsx`, `src/components/sales/mark-as-won-button.tsx`  
- **Risks:** Won deals not handed off.

### 6.2 Stale proposal detection
- **Severity:** Low  
- **Why it hurts revenue:** No explicit “sent X days ago, no view/follow-up” surface in Command or proposals list.  
- **Fix:** Add “Sent” age or “Follow up” badge on proposals list; in Sales Command, surface “Proposals out > 7 days” if data available.  
- **Files:** `src/app/app/sales/proposals/page.tsx`, `src/lib/sales/sales-command-data.ts`  
- **Risks:** Proposals forgotten.

---

## 7. PERMISSIONS / RLS

### 7.1 Sales module permission
- **Severity:** Low  
- **Why it hurts revenue:** Only Sales Command page explicitly checks `requirePermission(..., 'dashboard.sales')`; other sales pages rely on layout/requireOrg.  
- **Root cause:** Leads, Proposals, Walkthroughs, etc. do not re-check sales permission.  
- **Fix:** If sales should be role-gated, add requirePermission (or equivalent) to key sales routes; otherwise document that org membership is sufficient.  
- **Files:** `src/app/app/sales/page.tsx`, other `src/app/app/sales/**/page.tsx`  
- **Risks:** Possible over-access if org has mixed roles.

### 7.2 RLS on leads, opportunities, accounts
- **Assumption:** RLS is org-scoped (is_org_member). Not re-audited here; ensure all sales tables are org_id-scoped and no cross-tenant leak.  
- **Risks:** Data integrity, compliance.

---

## 8. UX / SPEED

### 8.1 Convert modal: no “Schedule walkthrough” option
- **Severity:** High  
- **Why it hurts revenue:** One-click “convert and schedule walkthrough” would shorten time to next step.  
- **Fix:** Add optional date/time; on submit create opportunity + walkthrough and redirect to opportunity (or walkthrough).  
- **Files:** `src/components/sales/convert-lead-to-opportunity-modal.tsx`  
- **Risks:** Extra clicks, dropped walkthroughs.

### 8.2 Drawer “Open full lead page” at bottom
- **Severity:** Low  
- **Why it hurts revenue:** Acceptable; full page has more actions. Consider making “Convert” and “Schedule walkthrough” visible without opening full page.  
- **Files:** `src/components/sales/leads-table-with-drawer.tsx`  
- **Risks:** Minor friction.

### 8.3 Pipeline link from converted lead
- **Severity:** Low  
- **Why it hurts revenue:** “View in Pipeline” in drawer links to `/app/crm/opportunities/${lead.converted_opportunity_id}` — correct. Lead detail “View in Pipeline” goes to `/app/crm/pipeline` — could deep-link to the opportunity card.  
- **Fix:** Optional: “View in Pipeline” → `/app/crm/opportunities/${id}` for direct deal context.  
- **Files:** `src/components/sales/lead-detail-quick-actions.tsx`  
- **Risks:** Minor.

---

## 9. REVENUE CLARITY

### 9.1 Sales Command KPIs and links
- **Severity:** Low  
- **Why it hurts revenue:** Command shows pipeline value, proposal value out, walkthroughs this week, stalled deals, follow-ups; links to pipeline and proposals. Good.  
- **Fix:** Ensure pipeline value and “revenue likely this month” pull from same source as CRM pipeline (opportunities.est_value/est_mrr, stage, expected_close_date).  
- **Files:** `src/lib/sales/sales-command-data.ts`, `src/app/app/crm/pipeline/page.tsx`  
- **Risks:** Inconsistent numbers.

### 9.2 Pipeline totals and weighted forecast
- **Assumption:** Pipeline board shows deal count per stage and values; weighted forecast may be in KPIs. Verify calculations use probability and expected_close_date where applicable.  
- **Risks:** Misleading forecast.

---

## 10. LAUNCH TO OPS HANDOFF

### 10.1 No way to create a launch packet in the UI
- **Severity:** Critical  
- **Why it hurts revenue:** Won deals must become launch packets for ops. Launch Packets page says “Create from a won opportunity or account” but there is **no Create button and no code path that inserts into `launch_packets`**. Handoff is broken.  
- **Root cause:** No UI or server action that inserts a row into `launch_packets`.  
- **Fix:** Add “Create launch packet” from: (1) Won opportunity detail page, or (2) Launch Packets page (e.g. “New” → select won opportunity/account). Implement server action that inserts `launch_packets` (org_id, account_id, status: 'draft', optional payload from opportunity/scope). Then existing “Send to Ops” can update status to sent_to_ops.  
- **Files:** `src/app/app/sales/launch-packets/page.tsx`, new server action (e.g. in `src/actions/launch-packet.ts`), opportunity detail or launch-packets UI  
- **Risks:** Won deals never reach ops, revenue delayed.

### 10.2 markDealWon does not create launch packet
- **Severity:** High  
- **Why it hurts revenue:** Automatic creation of a draft launch packet on “Mark won” would enforce handoff.  
- **Root cause:** markDealWon only updates opportunity and proposals; no launch_packets insert.  
- **Fix:** After marking won, optionally create a draft launch_packet for the opportunity’s account (or prompt “Create launch packet now?” with link).  
- **Files:** `src/actions/crm.ts` (markDealWon), `src/actions/launch-packet.ts`  
- **Risks:** Rep forgets to create packet.

---

## Prioritized Fix List

| Priority | Issue | Severity | Action |
|----------|--------|----------|--------|
| 1 | No launch packet creation path | Critical | Add create launch packet action + UI (won opp or Launch Packets page). |
| 2 | Conversion does not create contact | Critical | Create contact from lead in convertLeadToOpportunity; link to opportunity/account. |
| 3 | Conversion does not create walkthrough / no schedule option | Critical | Add optional walkthrough date in modal; create walkthrough on convert. |
| 4 | Duplicate account check missing | High | Inline or reuse findDuplicateAccount in convertLeadToOpportunity; show “Use existing” in modal. |
| 5 | Post-convert redirect to KPIs not opportunity | High | Redirect to `/app/crm/opportunities/${id}`. |
| 6 | Pipeline nav points to redirect not board | High | Point nav to `/app/crm/pipeline` or render board at sales/pipeline. |
| 7 | Schedule walkthrough from lead | High | Add “Schedule walkthrough” button; pre-fill from lead (e.g. ?leadId=). |
| 8 | Walkthrough form pre-fill from lead | High | Support leadId query; pre-fill company, contact, address. |
| 9 | Expected close date / probability on new opp | Medium | Add to modal and insert. |
| 10 | Single source for pipeline stages | Medium | Shared constant or config for stages. |
| 11 | Log call / Add note implemented or removed | Medium | Implement or remove disabled buttons. |
| 12 | Post-won “Create launch packet” CTA | Medium | After mark won, show CTA to create launch packet. |

---

## Test Scenarios (Validation)

- Create manual lead → qualify → convert (new account) → confirm contact exists, redirect to opportunity, optional walkthrough created.  
- Convert with “existing account” → no duplicate account.  
- Convert same lead twice → second attempt fails with “already converted”.  
- Mark opportunity won → proposals accepted; create launch packet from won deal; send to ops.  
- Sales nav “Opportunities” → lands on pipeline board.  
- Lead detail “Schedule walkthrough” → pre-fill form or create walkthrough linked to opportunity.  
- Rep with sales role only can access sales routes; no access to ops-only data.

---

## GRIZZLY Sales Engine Hardening (Round 2)

**Focus:** Revenue visibility, walkthrough booking, pipeline movement, close reliability, follow-up discipline, data safety, ownership clarity, super-admin access, multi-tenant safety, speed and usability.

### Issues found and fixed in this round

| # | Title | Severity | Why it hurts revenue | Root cause | Fix | Files | Risk type |
|---|--------|----------|----------------------|------------|-----|-------|-----------|
| 1 | Sales Command “Move deals” / “Close revenue” link to wrong URL | High | Rep clicks card, lands on KPIs redirect instead of opportunity. | href was `/app/sales/pipeline?opp=${id}`; sales/pipeline redirects to KPIs. | Use `/app/crm/opportunities/${id}` for opportunity cards. | `src/lib/sales/sales-command-data.ts` | Rep confusion, slower close |
| 2 | Win rate only from sales_proposals | Medium | When sales_proposals empty or missing, win rate always 0. | Win rate computed only from salesPropRows. | Add fallback: also count opportunities with stage won/lost and combine for win rate. | `src/lib/sales/sales-command-data.ts` | Revenue visibility |
| 3 | Duplicate detection never run on lead create | High | “Possible Duplicates” view always empty; duplicate leads never flagged. | findDuplicateCandidates exists but no code called it on create; is_possible_duplicate never set. | After createLead insert, fetch org leads, run findDuplicateCandidates, set is_possible_duplicate if matches. | `src/actions/leads.ts`, `src/lib/sales/duplicateDetection.ts` | Bad data, duplicate accounts |
| 4 | No “Schedule walkthrough” from lead | High | Lead → walkthrough is critical; no one-click path. | Copy existed; no button. | Add “Schedule walkthrough” button linking to `/app/walkthroughs/new?leadId=${leadId}`. | `src/components/sales/lead-detail-quick-actions.tsx` | Lost walkthroughs |
| 5 | Walkthrough form not pre-filled from lead | High | Rep re-keys company/contact/address when coming from lead. | New walkthrough page didn’t accept leadId or pass data to form. | Page reads searchParams.leadId, fetches lead, passes initialLead to WalkthroughForm; form initializes state from initialLead. | `src/app/app/walkthroughs/new/page.tsx`, `src/components/walkthroughs/walkthrough-form.tsx` | Speed, usability |

### Additional audit notes (no code change this round)

- **Import flow:** Single-lead import (paste/email/scan) works via LeadImport + createLead. No CSV bulk import found; add if needed for scale.
- **Stale deal logic:** Sales command uses STALE_DAYS=7; stalled count from sales_proposals (last_activity_at) or opportunities (next_action_due). Resilient when sales_proposals missing (stalled from opportunities only).
- **Proposal follow-up:** Proposals have sent_at; list shows “Sent”; no “days open” or “follow up due” column yet. follow_up_due_at exists in migration 113; UI can surface it.
- **Saved views:** All view keys (my_new_leads, hot_leads, needs_first_touch, needs_follow_up, ready_for_walkthrough, unworked_imports, high_value_targets, referrals, possible_duplicates) have copy and filters. possible_duplicates now populated by duplicate detection on create.
- **Super-admin / platform admin:** Plan and billing bypass already applied (isPremiumPlan(orgId, userId)); platform admins get full sales/ops access. No extra sales-specific bypass needed.
- **Multi-tenant:** Leads, opportunities, proposals, walkthroughs all scoped by org_id; RLS and requireOrg() used. No cross-tenant access identified.
- **Rep restricted access:** Only Sales Command page uses requirePermission('dashboard.sales'). Other sales routes rely on app layout; confirm if sales should be permission-gated per role.

### Test flow checklist

| Flow | Expected | Status / notes |
|------|----------|----------------|
| Create lead | Lead created; if duplicate match, is_possible_duplicate=true | ✅ createLead + duplicate check |
| Import leads | Single lead via paste/email/scan → createLead | ✅ LeadImport → createLead |
| Detect duplicates | Possible Duplicates view shows flagged leads | ✅ After create; view filters is_possible_duplicate |
| Mark qualified | Lead status → qualified | ✅ setLeadStatusAction |
| Schedule walkthrough | From lead: button → /walkthroughs/new?leadId= → form pre-filled | ✅ Button + initialLead |
| Complete walkthrough | Walkthrough status updated (form/actions) | Existing flow |
| Create opportunity | Convert lead → account + opportunity; redirect to opportunity | ✅ Redirect fixed earlier; duplicate account check in convert |
| Send proposal | Proposals list; link to build | Existing |
| Move to negotiation | Pipeline stage change (CRM opportunity detail) | Existing |
| Close won | markDealWon; create launch packet from Launch Packets page | ✅ createLaunchPacket added earlier |
| Close lost | Stage → lost; loss_reason if collected | Existing |
| Duplicate conversion attempt | Second convert same lead → “already converted” | ✅ convertLeadToOpportunity checks converted_opportunity_id |
| Simultaneous conversion | Two users convert same lead; one wins, one gets error | DB constraint / single update; “already converted” on second |
| Overdue follow-up | needs_follow_up view; table shows “Overdue” | ✅ View + table styling |
| Stale proposal | Stalled deals from next_action_due / last_activity | sales-command-data |
| Super-admin full access | No plan/billing lock; all sales/ops routes | ✅ isPremiumPlan(orgId, userId) bypass |
| Rep restricted access | If dashboard.sales required, rep without it blocked from Command only | Only Command page gated |

---

*End of audit.*
