# Sales Module — Implementation Notes (GRIZZLY)

## GRIZZLY Plan Additions

### Migration 113 (`113_grizzly_sales_engine.sql`)
- **Leads**: assigned_to, source_detail, source_campaign, legal_business_name, dba_name, contact_first_name/last_name/full_name, department, alternate_email, mobile, google_place_id, industry, subindustry, building_type, company_size, annual_revenue, est_monthly_cleaning_value, service_frequency_guess, pain_points, address_line_1/2, postal_code, country, enrichment_last_run_at, duplicate_group_key, duplicate_flags_json, is_possible_duplicate, first_touched_at, last_activity_at, next_action, next_action_due_at, converted_at, converted_contact_id, converted_walkthrough_id, lost_reason, lost_notes, is_archived.
- **lead_activities**: user_id, outcome, due_at, completed_at, updated_at; expanded activity_type CHECK.
- **lead_import_batches**: file_name, total_rows, created_rows, updated_rows, skipped_rows, duplicate_rows, failed_rows, status, mapping_json, summary_json, started_at, completed_at.
- **lead_enrichment_snapshots**: provider_record_id, normalized_payload_json, confidence_score.
- **walkthroughs**: contact_id, assigned_to, title, building_name, address_line_1/2, postal_code, country, latitude, longitude, scheduled_start, scheduled_end, timezone, square_footage_estimate, target_service_frequency, special_notes, parking_notes, access_notes, contact_name/phone/email, outcome, next_step, next_step_due_at, scope_ready, lidar_ready, linked_scope_packet_id.
- **opportunities**: contact_id, lead_id, name, status, location_name, address_line_1, postal_code, building_type, service_frequency, estimated_sqft, est_monthly_revenue, est_annual_value, weighted_value, probability_percent, current_vendor, competitor_name, loss_notes, next_action_due_at, last_stage_changed_at, last_activity_at, is_stale.
- **proposals**: opportunity_id, account_id, contact_id, proposal_number, title, total_value, monthly_value, annual_value, sent_at, viewed_at, accepted_at, declined_at, revision_count, follow_up_due_at, created_by.

### Types & duplicate detection
- **types.ts**: ENRICHMENT_STATUSES, LOST_REASONS, LOST_REASON_LABELS, WALKTHROUGH_STATUSES + canceled, NormalizedLeadEnrichment, extended LeadRecord, LEAD_SAVED_VIEWS + needs_first_touch, referrals, possible_duplicates.
- **duplicateDetection.ts**: duplicateGroupKey(), findDuplicateCandidates() by company+location, website, email, phone, address, google_place_id.

### Sales Command
- **sales-command-data.ts**: Leaderboard (by rep: won revenue, win rate, proposals sent), Source performance (leads by source), Lost reason snapshot, Recent wins. KPI strip includes win rate.
- **sales-command-view.tsx**: Bottom section with Rep leaderboard, Source performance, Lost reason snapshot, Recent wins. Seven KPI cards including Win Rate.

### Leads
- **Saved views**: My New, Hot, Needs First Touch, Needs Follow-Up, Ready for Walkthrough, Unworked Imports, High Value, Referrals, Possible Duplicates.
- **Copy**: SALES_COPY.leads.savedViews extended; kpi.winRate, kpi.weightedPipeline.
- **assignLeadAction** in actions/leads.ts for GRIZZLY assign flow.

### Integrations
- **zoominfo.ts**: zoomInfoToNormalized() mapping to NormalizedLeadEnrichment; TODO for live ZoomInfo/Google/LinkedIn.

### Seed
- **scripts/seed-grizzly-sales.ts**: Placeholder for representative leads, walkthroughs, opportunities, proposals, stale/duplicate examples.

---

## Delivered (pre-GRIZZLY)

### 1. SQL migration (`112_sales_revenue_module.sql`)
- **Leads**: Expanded `source` and `status` CHECK values; added columns: `title`, `linkedin_url`, `website`, `lat`/`lng`, `estimated_sq_ft`, `estimated_locations`, `employee_count`, `current_cleaning_provider`, `lead_score`, `qualification_score`, `next_follow_up_at`, `last_contact_at`, `enrichment_status`, `duplicate_of_lead_id`, `import_batch_id`.
- **lead_activities**: Timeline (call, email, note, touch, status_change, converted).
- **lead_import_batches**: For CSV import tagging and "Unworked Imports" view.
- **lead_enrichment_snapshots**: Optional cache for ZoomInfo/Google/LinkedIn (do not hard-wire vendors).
- **walkthroughs**: `lead_id`, `account_id`, `building_address`, `sqft_estimate`, etc.
- **opportunities**: `primary_contact_id`, `service_frequency`, `building_size_sqft`, `probability`, `expected_close_date`, `source`, `walkthrough_id`, `proposal_id`, `competitor_current_vendor`, `loss_reason`, `next_action`, `next_action_due`.
- **proposals**: `last_follow_up_at`, `viewed_at`, `status_detail`.

### 2. Types & schemas
- `src/lib/sales/types.ts`: Lead sources/statuses, walkthrough/opportunity/proposal enums, labels, `LeadRecord`, `LeadActivityRecord`, saved view keys.
- `src/lib/sales/schemas.ts`: Zod schemas for create/update lead, log activity, convert options.

### 3. Conversion & scoring
- `src/lib/sales/convertLead.ts`: `convertLeadToSalesObjects()` with deps (getLead, findDuplicateAccount, createAccount, createContact, createOpportunity, createWalkthrough, updateLeadConverted, writeActivity). Validates minimum data, prevents double conversion, logs activity.
- `src/lib/sales/leadScoring.ts`: `computeLeadScore()` and `computeQualificationScore()` (0–100) with transparent inputs; used for list/detail display.

### 4. Integration stubs
- `src/lib/integrations/leads/zoominfo.ts`: `enrichLeadFromZoomInfo()` — TODO: wire when API key available.
- `src/lib/integrations/leads/googleBusiness.ts`: `enrichLeadFromGoogleBusiness()` — TODO: Google Places.
- `src/lib/integrations/leads/linkedin.ts`: `enrichLeadFromLinkedIn()` — TODO: LinkedIn API.

### 5. Sales Command (default sales landing)
- `src/lib/sales/sales-command-data.ts`: `getSalesCommandData(orgId, userId)` — KPIs (pipeline value, proposal value out, walkthroughs this week, deals closing this month, stalled deals, leads needing first contact, hot leads, win rate) and four sections: Hunt Now, Book Walkthroughs, Move Deals, Close Revenue.
- `src/components/sales/sales-command-view.tsx`: Action-first revenue board UI; KPI strip + four section cards with quick links.
- `src/app/app/sales/page.tsx`: Renders Sales Command as default landing for sales users.

### 6. Leads list
- Saved views: My New Leads, Hot Leads, Needs Follow-Up, Ready for Walkthrough, Unworked Imports, High Value Targets (`?view=...`).
- `src/components/sales/leads-saved-view-tabs.tsx`: Tab navigation for views.
- Leads table: added Score and Next follow-up columns; `lead_score`, `next_follow_up_at`, `import_batch_id` in query.

### 7. Lead detail
- Premium layout: SalesPageShell, header with score/qualification, quick actions (Log call, Add note, Mark qualified, Convert, View in Pipeline).
- `LeadDetailQuickActions`, `LeadDetailCompanyPanel` (sq ft, locations, employees, current provider, enrichment).
- Activity timeline from `lead_activities` when present.

### 8. Permissions
- Existing: `dashboard.sales` for sales access; owner/sales manager full; sales rep own/assigned; ops limited. No changes required for this phase.

---

## TODO / Next steps

- **Walkthroughs**: Calendar view, list view, "My walkthroughs", "This week", "Overdue follow-up". Wire to `walkthroughs` and `walkthrough_appointments`; statuses: requested, scheduled, completed, no_show, reschedule_needed, scope_ready.
- **Opportunities**: Kanban + table; drag stage; weighted pipeline; forecast by month; stale deal indicators; required reason on closed_lost. Saved views: My Pipeline, Closing This Month, Proposal Out, Stalled Deals, High Value, Needs Next Step.
- **Proposals**: List by value, sent date, days outstanding, last follow-up; states: draft, internal_review, sent, viewed, revision_requested, accepted, declined. Integrate with existing proposal builder where it exists.
- **CSV import**: Bulk import flow with column mapping, tag to `lead_import_batches`, apply "Unworked Imports" view.
- **Duplicate detection**: Before convert (or on save), detect by company/email/phone; set `duplicate_of_lead_id` or prompt merge.
- **Map**: Show leads/prospects/accounts/opportunities; create lead from map; filter by city/zip/territory; nearby customers for cross-sell.
- **Seed/mock data**: Add sample leads with scores, activities, and walkthroughs for demos.

---

## Design principles (from spec)

- Every screen answers: What is the money move? Next action? Who owns it? How close to revenue?
- No bloated forms, walls of text, useless KPI overload, admin-panel vibes, or dead-end records without action buttons.
- Emotional feel: fast, sharp, confident, aggressive, premium — "grizzly hunting, not secretary filing."
