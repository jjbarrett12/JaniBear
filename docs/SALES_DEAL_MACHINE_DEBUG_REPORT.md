# Sales Deal Machine — Debug Report & Verification

## 1) Top 10 likely failure points (and fixes applied)

| # | File(s) / Component(s) | Why it fails | Fix strategy | Status |
|---|-------------------------|--------------|--------------|--------|
| 1 | `src/app/app/sales/accounts/[accountId]/page.tsx` | **`activities` was never defined** — passed to `AccountSalesTabs` as `activities={activities}` causing ReferenceError and crash on Account detail → Activity tab. | Fetch `crm_activities` for the account’s opportunities (org-scoped, by `opportunity_id IN oppIds`), pass array to tabs. | **Fixed** |
| 2 | `src/components/sales/convert-lead-to-opportunity-modal.tsx` + `src/actions/leads.ts` | After convert, user was sent to **CRM opportunity page** (`/app/crm/opportunities/…`) instead of **Pipeline**; Pipeline wasn’t revalidated so new opp could be missing. | Redirect to `/app/sales/pipeline?highlight=<oppId>`; add `revalidatePath('/app/sales/pipeline')` in convert action. | **Fixed** |
| 3 | Backward compat `/app/sales/launch-packet` | Spec requires **/sales/launch-packet** to still work. Only `/sales/launch-packets` and `/sales/contract-launch` existed; old links would 404. | Add route segments `app/sales/launch-packet/page.tsx` and `app/sales/launch-packet/[id]/page.tsx` that redirect to `…/launch-packets` and `…/launch-packets/[id]`. Extend sidebar active logic so `launch-packet` and `launch-packet/[id]` highlight Contract Launch. | **Fixed** |
| 4 | Pipeline post-convert UX | User lands on Pipeline but new opportunity isn’t surfaced. | Pass `searchParams.highlight` as `initialHighlightOppId` to the board; open drawer for that opp on load. | **Fixed** |
| 5 | RLS / org scoping | Any query missing `org_id` or relying only on client could leak cross-org data. | All touched server code uses `requireOrg()` and `.eq('org_id', org.org_id)` (or RLS). `getOpportunityDetail(org_id, opportunity_id)` and lead conversion already scoped. **No change.** | Verified |
| 6 | Null / empty states | Lead with no phone/email, opportunity with no account, account with no opps — drawers or tabs could throw. | Drawer uses `account?.name ?? client?.name ?? '—'`; `getOpportunityDetail` returns empty arrays and nulls; Account tabs handle `opportunities.length === 0` and empty activities. **No change.** | Verified |
| 7 | Duplicate launch submissions | Submitting the same deal twice could create two launch packets if a “create” flow exists. | No **create** launch_packet flow found in repo (only list + detail + Send to Ops update). If one is added later: use upsert or unique constraint `(account_id, org_id)` for non-terminal statuses. **Optional migration below.** | Documented |
| 8 | Send to Ops / Accept Intake errors | User sees raw error; no “Try again” or debug hint. | SendToOpsButton and convert modal already show error text. Dev-only `console.warn` added for conversion and send-to-ops. For production toasts with “Try again” + debug id, extend existing toast usage in those components. | Partial (logging added) |
| 9 | Pipeline board `clients` vs `accounts` | Opportunities may have `client_id` (legacy) or `account_id` (069); select uses both; board uses `clients` and `accounts` in `oppName`. | Already defensive: `oppName` uses `clients?.name ?? accounts?.name ?? 'No account'`. **No change.** | Verified |
| 10 | Launch intake list “missing items” | `LaunchIntakeList` expects `missingItems` per item; backend must supply it. | Ops launch-intake page builds items from `launch_packets`; if payload_jsonb checklist isn’t computed into `missingItems`, badges stay empty. **Verify** data shape in `app/ops/launch-intake/page.tsx` matches `LaunchIntakeItem`. | Verify in QA |

---

## 2) Minimal patches applied (exact paths)

- **`src/app/app/sales/accounts/[accountId]/page.tsx`**  
  - Fetched `crm_activities` for `opportunity_id IN oppIds`, org-scoped; passed as `activities` to `AccountSalesTabs`.

- **`src/actions/leads.ts`**  
  - After successful convert: `revalidatePath('/app/sales/pipeline')`; dev-only `console.warn('[convertLeadToOpportunity]', …)`.

- **`src/components/sales/convert-lead-to-opportunity-modal.tsx`**  
  - On success: `router.push(\`/app/sales/pipeline?highlight=${result.opportunityId}\`)`.

- **`src/app/app/sales/launch-packet/page.tsx`** (new)  
  - `redirect('/app/sales/launch-packets')`.

- **`src/app/app/sales/launch-packet/[id]/page.tsx`** (new)  
  - `redirect(\`/app/sales/launch-packets/${id}\`)`.

- **`src/components/app/app-sidebar-nav.tsx`**  
  - `getSectionIdForPath` and `isItemActive`: treat `pathname === '/app/sales/launch-packet'` and `pathname.startsWith('/app/sales/launch-packet/')` like launch-packets for section and active state.

- **`src/app/app/sales/pipeline/page.tsx`**  
  - Read `searchParams.highlight`; pass `initialHighlightOppId` to `PipelineBoardTableWithDrawer`.

- **`src/components/sales/pipeline-board-table-with-drawer.tsx`**  
  - Accept `initialHighlightOppId`; set initial `drawerOppId` to it so drawer opens for highlighted opp.

- **`src/actions/launch-packet.ts`**  
  - Dev-only `console.warn('[sendLaunchPacketToOps]', …)` after successful send.

---

## 3) Optional migration (duplicate launch prevention)

If you add a “Create launch packet” flow later, prevent duplicates per account with a partial unique index:

```sql
-- Optional: run only when create flow exists. Prevents duplicate draft/review/ready/sent_to_ops per account.
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_launch_packets_one_active_per_account
--   ON launch_packets(account_id)
--   WHERE status IN ('draft', 'review', 'ready', 'sent_to_ops');
```

Then create-or-fetch (upsert) by `account_id` in that status set. **Not applied** — no create flow in codebase yet.

---

## 4) Verification script (manual QA)

Use this to validate the full Deal Machine flow and regressions.

### A) Nav and routes

1. **Sidebar**  
   - Sales section shows groups: **Prospecting** (Leads, Pipeline), **Active Deals** (Accounts, Walkthroughs, Scope, Proposals), **Conversion** (Win/Loss, Contract Launch).  
   - Contract Launch item goes to `/app/sales/launch-packets`.

2. **Routes (each loads without 500)**  
   - `/app/sales/leads`  
   - `/app/sales/pipeline`  
   - `/app/sales/accounts`  
   - `/app/sales/accounts/<accountId>` (use a real UUID)  
   - `/app/sales/walkthroughs`  
   - `/app/sales/scope`  
   - `/app/sales/scope-builder` (redirects to `/app/sales/scope`)  
   - `/app/sales/proposals`  
   - `/app/sales/win-loss`  
   - `/app/sales/contract-launch` (redirects to `/app/sales/launch-packets`)  
   - `/app/sales/contract-launch/<id>` (redirects to `/app/sales/launch-packets/<id>`)  
   - `/app/sales/launch-packet` (redirects to `/app/sales/launch-packets`)  
   - `/app/sales/launch-packet/<id>` (redirects to `/app/sales/launch-packets/<id>`)  
   - `/app/ops/launch-intake`  
   - `/app/ops/launch-intake/<id>`

3. **Active state**  
   - On `/app/sales/launch-packets`, `/app/sales/contract-launch`, `/app/sales/launch-packet`, or `/app/sales/launch-packet/<id>`, the **Contract Launch** nav item is highlighted.

### B) Lead → opportunity conversion

1. Create a lead (e.g. from `/app/sales/leads/new`).
2. Open the lead; click **Convert to Opportunity**.
3. Choose **New** account, enter name; set stage/value; submit.
4. **Expect:** Redirect to **Pipeline** with drawer open for the new opportunity (or at least URL `?highlight=<oppId>`).
5. Convert the **same** lead again → **Expect:** Error “Lead already converted to an opportunity”.
6. Try convert with **Existing** account (pick one); submit → **Expect:** Success and redirect to Pipeline.

### C) Pipeline and account container

1. **Pipeline**  
   - Board loads; cards show account/client name, value, next activity.  
   - Click a card → drawer opens; **Schedule walkthrough**, **Create scope**, **Generate proposal** links work.  
   - Opportunity with no account shows “No account” (no crash).

2. **Accounts**  
   - Search on `/app/sales/accounts` works.  
   - Open an account → **Overview / Walkthroughs / Scope / Proposals / Activity** tabs all work.  
   - **Activity** tab: shows activities for that account’s opportunities (no crash; empty state if none).

### D) Contract Launch → Launch Intake

1. Open a launch packet (or create one if you add the flow): `/app/sales/launch-packets/<id>`.
2. Complete checklist as required; click **Submit to Operations**.
3. **Expect:** Redirect to `/app/ops/launch-intake?highlight=<packetId>`; new launch visible/highlighted.
4. Open Launch Intake detail; **Accept Intake** or **Request Changes** (per product rules).
5. Confirm sales artifact lock message after submit (scope/proposal edits blocked or versioned as specified).

### E) RLS and cross-org

1. With two orgs (e.g. seed data): user A in org 1, user B in org 2.  
2. As A: open leads/pipeline/accounts/launch-packets/launch-intake — only org 1 data.  
3. As B: same — only org 2 data.  
4. No way to open org 2’s record IDs as org 1 user (URL hack should 404 or empty, not show org 2 data).

### F) Empty / null

1. **No leads** → Leads page shows empty state (no crash).  
2. **Lead** with no phone/email → Drawer opens without error.  
3. **Opportunity** with no account link → Drawer shows “No account” or “Unlinked”.  
4. **Account** with no walkthroughs/proposals → Tabs show empty states.

---

## 5) Summary

- **Critical:** Sales account detail `activities` bug fixed; convert now redirects to Pipeline with revalidate and optional highlight; backward compat for `/sales/launch-packet` and nav highlighting added; pipeline highlight-from-query and drawer open on load added.  
- **Guards:** All server flows remain org-scoped; no RLS weakened; redirects are one-way (no loops).  
- **Optional:** Migration for duplicate launch prevention when a create flow exists; toasts with “Try again” + debug id can be added on top of current error display.

After these changes, the flow **Lead → Convert → Pipeline → Account → Walkthrough → Scope → Proposal → Contract Launch → Launch Intake** should work without route loops, RLS leaks, or null crashes.
