# Sales sidebar + routing + UX refactor — PR notes

## What changed

### 1. Sidebar (SALES)

- **Grouped subsections** under SALES:
  - **Prospecting:** Leads, Pipeline
  - **Active Deals:** Accounts (Prospects), Walkthroughs, Scope Builder, Proposals
  - **Conversion:** Win/Loss, Contract Launch (formerly "Launch Packet")
- "Launch Packet" is now labeled **"Contract Launch"** in the nav; route remains `/app/sales/launch-packets`.
- Nav factory: `NavSection` supports optional `groups` (subheaders + items). When present, the sidebar renders group labels and items; otherwise flat `items` as before.

### 2. Routes and redirects

- **`/app/sales/contract-launch`** → redirects to `/app/sales/launch-packets`
- **`/app/sales/contract-launch/[id]`** → redirects to `/app/sales/launch-packets/[id]`
- **`/app/sales/scope-builder`** → redirects to `/app/sales/scope`
- **`/app/sales/accounts`** — now a real page (accounts list with links to Sales account detail).
- **`/app/sales/accounts/[accountId]`** — new Sales account detail with tabs: Overview, Walkthroughs, Scope, Proposals.

### 3. Data (migration 069)

- **`opportunities.account_id`** — optional FK to `accounts` (link opportunity to account).
- **`leads.converted_opportunity_id`** — set when lead is converted to an opportunity.
- **`leads.converted_account_id`** — account created or selected on convert.

### 4. Convert Lead → Opportunity

- On **Lead detail** (`/app/sales/leads/[id]`): **"Convert to Opportunity"** button (hidden if already converted).
- Modal: create new Account or select existing, set initial stage (default "Qualified"), optional expected value.
- On submit: creates/links account, creates opportunity with `account_id`, updates lead; redirects to **Pipeline** opportunity detail (`/app/crm/opportunities/[id]`).
- Opportunity detail shows **Account** (with link to `/app/accounts/[id]`) when `account_id` is set and `client_id` is null.

### 5. Contract Launch (handoff)

- **List/detail** titles and copy use "Contract Launch" and "Submit to Operations."
- **Ready for Launch** checklist on detail (contract/scope, schedule, contacts, supplies); primary CTA **"Submit to Operations"** (same as previous "Send to Ops").
- No change to backend: still updates `launch_packets.status` to `sent_to_ops`; Ops sees items in **Launch Intake** as before.

### 6. Accounts as container (Sales)

- **Sales → Accounts** lists all org accounts; each card links to **`/app/sales/accounts/[accountId]`**.
- Sales account detail has tabs:
  - **Overview:** deal summary (opportunities, walkthroughs, bids count) + link to full account.
  - **Walkthroughs:** list for this account (via opportunities with `account_id`), link to full walkthroughs.
  - **Scope:** link to Scope Builder.
  - **Proposals:** list of bids for this account’s opportunities, link to proposals.
- Shared **AccountsListWithFilter** now accepts optional **`getAccountHref(id)`** so Sales can point detail links to `/app/sales/accounts/[id]`.

### 7. Operations

- **Launch Intake** unchanged: still shows packets with status `ready` or `sent_to_ops`; Accept/Reject as before.
- No new routes; handoff is Sales → Contract Launch → Submit to Ops → Launch Intake.

## How to verify

1. **Nav:** Open app → SALES section shows Prospecting / Active Deals / Conversion with correct items. "Contract Launch" label (not "Launch Packet"). Active state for Contract Launch when on `/app/sales/launch-packets` or `/app/sales/contract-launch`.
2. **Redirects:** Visit `/app/sales/contract-launch` → redirects to `/app/sales/launch-packets`. Visit `/app/sales/scope-builder` → redirects to `/app/sales/scope`.
3. **Convert Lead:** Open a lead (e.g. `/app/sales/leads/[id]`). Click "Convert to Opportunity". Create new account or select existing, set stage → Submit. Should land on `/app/crm/opportunities/[id]`; opportunity has `account_id` set; lead has `converted_opportunity_id` and `converted_account_id`.
4. **Contract Launch:** Open a launch packet in draft/review. See "Ready for Launch" checklist and "Submit to Operations" button. Submit → status `sent_to_ops`; packet appears in Ops → Launch Intake.
5. **Sales Accounts:** Sales → Accounts shows list. Click an account → Sales account detail with Overview / Walkthroughs / Scope / Proposals tabs. "Full account" link goes to `/app/accounts/[id]`.
6. **Permissions:** Same as before; no new roles. Nav built from existing shell + feature flags; Pro Gear visibility unchanged.

## Files touched (summary)

- **Nav:** `src/lib/nav/navFactory.ts`, `src/lib/nav/shellNav.ts`, `src/lib/app-translations.ts`, `src/components/app/app-sidebar-nav.tsx`
- **Routes:** `src/app/app/sales/contract-launch/page.tsx`, `src/app/app/sales/contract-launch/[id]/page.tsx`, `src/app/app/sales/scope-builder/page.tsx`, `src/app/app/sales/accounts/page.tsx`, `src/app/app/sales/accounts/[accountId]/page.tsx`
- **Actions:** `src/actions/leads.ts` (new), `src/actions/crm.ts` (getOpportunityDetail + account)
- **Components:** `src/components/sales/convert-lead-to-opportunity-modal.tsx`, `src/components/sales/account-sales-tabs.tsx`, `src/components/accounts/accounts-list-with-filter.tsx` (getAccountHref), `src/components/launch/launch-packet-detail.tsx` (checklist), `src/components/launch/send-to-ops-button.tsx` (label)
- **Pages:** `src/app/app/sales/leads/[id]/page.tsx`, `src/app/app/sales/launch-packets/page.tsx`, `src/app/app/sales/launch-packets/[id]/page.tsx`, `src/app/app/crm/opportunities/[id]/page.tsx`
- **DB:** `supabase/migrations/069_sales_leads_conversion_and_opportunity_account.sql`
