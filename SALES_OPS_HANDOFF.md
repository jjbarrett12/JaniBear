# Sales → Ops Handoff

When a deal is **won** (opportunity stage = `won`) or a **proposal is accepted**, ops needs the site and a clear handoff state so they can create schedules and start service.

## Data model (after migration 020)

- **opportunities**
  - `stage` = `'won'` when deal is closed won.
  - `closed_at` = when opportunity was closed.
  - `won_at` = when marked won (set at same time as `stage = 'won'`); used for handoff.
  - `ops_handoff_status` = `'pending' | 'acknowledged' | 'scheduled'`.
  - `site_id` = the site for this deal (may exist from walkthrough; create if missing).

- **sites**
  - `source_opportunity_id` = set when the site was created/confirmed from a won opportunity.
  - `ops_handoff_at` = when the site was handed off to ops (e.g. when marking opportunity won).

## Flow

1. **Sales marks opportunity won**
   - Set `opportunities.stage = 'won'`, `closed_at = NOW()`, `won_at = NOW()`.
   - Ensure `opportunities.site_id` is set:
     - If walkthrough was at a site, use that site (or create from walkthrough address).
     - If no site yet, create a new site (client_id from opportunity, org_id, name/address from opportunity or proposal).
   - Set `sites.source_opportunity_id = opportunity.id`, `sites.ops_handoff_at = NOW()` (for the site linked to this opportunity).
   - Set `opportunities.ops_handoff_status = 'pending'`.

2. **Ops “new from sales” list**
   - Query: sites where `source_opportunity_id IS NOT NULL` and `ops_handoff_at IS NOT NULL`, optionally filter by `opportunities.ops_handoff_status = 'pending'` (join via `source_opportunity_id`).

3. **Ops acknowledges / schedules**
   - When ops has seen the handoff: set `opportunities.ops_handoff_status = 'acknowledged'`.
   - When first schedule (or inspection) is created for that site: set `opportunities.ops_handoff_status = 'scheduled'`.

## Proposal-accepted path

When a **proposal** is accepted (e.g. via electronic signature):

- If the proposal has `opportunity_id`, treat the same as “mark opportunity won”:
  - Set opportunity `stage = 'won'`, `closed_at`, `won_at`, ensure `site_id`, set site `source_opportunity_id` and `ops_handoff_at`, set `ops_handoff_status = 'pending'`.
- If the proposal is lead-only (no opportunity_id), either create an opportunity from the lead and then run the above, or create the site and record the handoff in another way (e.g. a “lead_won” table or a note on the site).

## API / UI suggestions

- **Sales:** “Mark as won” action → server action or API that updates opportunity + site as above.
- **Ops:** “Sites from sales” or “New handoffs” view → filter sites by `source_opportunity_id` / `ops_handoff_status`.
- **Ops:** “Acknowledge” and “First schedule created” actions → update `ops_handoff_status` to `acknowledged` / `scheduled`.
