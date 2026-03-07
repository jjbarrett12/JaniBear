# Service Agreements — Production-Safe Model & Integration

## Overview

Service scope historically lived in **walkthrough/proposal JSON** and **PDF contract artifacts**. The **service_agreements** table is the structured operational twin: it does not replace PDFs or contracts; it gives ops, scheduling, inspections, and reporting a single source of truth for “what we clean, how often, for whom.”

## Schema (Current)

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | PK |
| org_id | UUID | Tenant |
| account_id | UUID | Commercial customer |
| facility_id | UUID | Operational service location |
| name | TEXT | Agreement name (e.g. "Primary agreement") |
| status | TEXT | draft \| active \| paused \| ended \| cancelled |
| start_date | DATE | Effective start (alias: effective_start_date) |
| end_date | DATE | Effective end, nullable (alias: effective_end_date) |
| contract_ref | TEXT | Optional ref to contract/PDF (artifact unchanged) |
| contract_value_monthly | NUMERIC | Optional MRR |
| service_frequency | TEXT | e.g. "5x/week", "nightly" |
| service_days | TEXT[] | Days serviced (e.g. Mon, Tue, Wed) |
| **general_scope_summary** | TEXT | Human-readable scope for ops/scheduling |
| notes | TEXT | Free-form notes |
| **source_opportunity_id** | UUID | Opportunity this agreement was created from |
| **source_proposal_id** | UUID | Proposal (and PDF) this agreement was created from |
| created_at, updated_at | TIMESTAMPTZ | Audit |

- **Effective dates**: Use `start_date` / `end_date` in DB; in types/docs they are the effective window.
- **Days serviced**: Stored in `service_days` (TEXT[]); no separate `days_serviced` column.
- **Scope packages / service lines**: Handled by existing `service_lines` table (follow-on). This doc does not change that.

## Statuses and Constraints

- **Status** (existing in 115): `draft`, `active`, `paused`, `ended`, `cancelled`.
- **RLS**: Org-scoped via `is_org_member(org_id, auth.uid())`.
- **Source FKs**: `source_opportunity_id` → opportunities(id), `source_proposal_id` → proposals(id), both ON DELETE SET NULL so PDFs/contracts can be removed without dropping the agreement.

## Where Proposal / Walkthrough JSON Is Read

| Location | What is read | Agreement fallback (later) |
|----------|----------------|-----------------------------|
| **launch_packets.payload_jsonb** | locations, service_locations, service_frequency, service_days, sold_services, scope_summary, special_notes, estimated_start_date, contract_ref | **Done**: On accept we create `service_agreements` from this payload and set source_opportunity_id / source_proposal_id. |
| **launch-plan.ts** (readiness) | sales_inputs.scope_summary, ops_setup, start_date | Prefer reading scope from linked **service_agreement** when present (launch_packet.service_agreement_id → general_scope_summary). |
| **Launch intake page** | payload_jsonb (scope, schedule_draft, supplies, contacts) for display | Show agreement name, facility, general_scope_summary, service_frequency when `service_agreement_id` is set. |
| **Proposals build page** | Walkthroughs + scope for generating proposals | Keep generating PDF from walkthrough/proposal; when deal closes and launch packet is accepted, agreement is created and linked. |
| **Walkthrough detail page** | scope (e.g. scope?.customer, scope?.site) from walkthrough/scope_models | No change; walkthrough remains source for proposal generation. Agreement is created at launch accept. |
| **Scheduling / inspections** | Today: schedules, facilities, crew_assignments | Next: Prefer service_agreement.service_frequency, service_days, general_scope_summary for display and validation. |

## Wiring: Proposal / Launch / Ops Flows

1. **Create / link agreement**
   - **On launch accept** (`acceptLaunchPacket` in `src/actions/launch-packet.ts`): Builds activation payload from `payload_jsonb` (service_locations or locations, service_frequency, service_days, sold_services, scope_summary, special_notes, estimated_start_date, contract_ref). Resolves first facility for the account, fetches `proposal_id` from opportunity when `launch_packets.opportunity_id` is set. Calls `activateLaunchPacket`, which creates `service_agreements` (with source_opportunity_id, source_proposal_id, general_scope_summary) and optional service_lines, then updates `launch_packets.service_agreement_id`.
   - **Manual**: Use `createServiceAgreement` from `@/lib/ops-core/service-agreements` with optional sourceOpportunityId, sourceProposalId, generalScopeSummary.

2. **Launch packet payload**
   - `LaunchPacketPayload` includes `scope_summary`; it flows into `service_agreement.general_scope_summary` when the agreement is created at accept. `buildLaunchPayloadFromLead` supports `overrides.scope_summary`.

3. **PDFs / contract artifacts**
   - No change. Proposals and contract PDFs remain the source for legal/audit; `source_proposal_id` links the agreement to the proposal for traceability only.

## Migration and Rollout

### Migration (123)

- **123_service_agreements_production_safe.sql**: Adds `source_opportunity_id`, `source_proposal_id`, `general_scope_summary` to `service_agreements`. Additive only; no drops.

### Rollout strategy (gradual)

1. **Deploy migration and code**
   - New accepts create agreements with source and scope; existing launch packets and PDFs unchanged.

2. **Backfill (optional)**
   - For existing `launch_packets` with `status = 'accepted'` and no `service_agreement_id`, run a one-off job: for each packet with `opportunity_id` and account/facility, create a `service_agreement` with source_opportunity_id/source_proposal_id and general_scope_summary from `payload_jsonb.scope_summary` or `special_notes`, then set `launch_packets.service_agreement_id`.

3. **Read from agreement where available**
   - Launch readiness: when `launch_packet.service_agreement_id` is set, read `general_scope_summary`, `service_frequency`, `service_days` from the agreement for display/validation instead of only from sales_inputs/ops_setup.
   - Launch intake list/detail: show agreement name, facility, scope summary, frequency when present.
   - Scheduling/inspection UIs: prefer agreement fields for “what’s in scope” when the facility has an active agreement.

4. **Do not**
   - Remove or replace proposal/walkthrough JSON or PDF generation.
   - Require an agreement to exist for launch accept (agreement creation is best-effort on accept; if it fails, packet is still accepted).

## Exact Files to Update Next

| File | Change |
|------|--------|
| **src/actions/launch-plan.ts** | In `computeReadiness` or launch plan list/detail: when `launch_packet.service_agreement_id` is set, optionally read and display `general_scope_summary`, `service_frequency` from agreement. |
| **src/app/app/ops/launch-intake/page.tsx** | When rendering packet payload, if `packet.service_agreement_id` is set, fetch agreement and show name, facility, general_scope_summary, service_frequency. |
| **Scheduling / crew assignment UI** | When creating or editing schedules for a facility, if facility has an active service_agreement, prefill or suggest service_frequency and service_days from agreement. |
| **Inspection creation** | When creating inspections for a facility, optionally show agreement’s general_scope_summary as context. |
| **Reports / KPIs** | Use `service_agreements` (e.g. count active, MRR from contract_value_monthly) for “active contracts” and revenue metrics where appropriate. |

## Summary

- **service_agreements** is the structured operational record; **proposals and PDFs stay** as contract artifacts.
- **source_opportunity_id** and **source_proposal_id** give audit and traceability; **general_scope_summary** gives ops a single place for scope text.
- Agreements are created on **launch accept** from launch packet payload and linked to the packet; rollout is additive and backward-compatible.
