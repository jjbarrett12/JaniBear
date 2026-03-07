# JANIBEAR Operations Core — Scalable Architecture

## Goal

Separate **commercial ownership** (customer/account) from **service execution** (locations, agreements, lines, assignments, events). Scale like a real janitorial SaaS without treating an account as one flat operational object.

## Target Model (Conceptual)

```
Organization (tenant)
  └── Accounts (customers / paying entities)
        └── Facilities (service locations = buildings/sites)
              └── Service Agreements (sold package per location: start, status, pricing, frequency)
                    └── Service Lines (distinct services: janitorial, floor care, porter, windows, trash, restroom)
              └── Service Assignments (crew/supervisor per line or location; effective-dated; history via effective_to)
              └── Service Events (completed/missed/partial per line, date, crew)
              └── Inspection Programs (template + cadence, optional service line)
              └── Issues / Complaints (tied to location, line, event, assignment)
  └── Crews, Crew Members
  └── Crew Change Workflow (request → approval → new assignment)
  └── Launch Packets (sales close → ops activation payload)
```

## Entity Summary

| Entity | Purpose |
|--------|--------|
| **Account** | Customer / paying entity; commercial relationship (existing `accounts`). |
| **Facility** | Service location = building/site under an account (existing `facilities`). |
| **Service Agreement** | Sold service package for a location: start/end date, status, pricing, contract ref, service frequency. |
| **Service Line** | Distinct operational service under an agreement (e.g. nightly janitorial, floor care, porter, windows, trash, restroom reset). |
| **Service Assignment** | Crew (and optional supervisor) assigned to a facility and optionally a service line; effective_from / effective_to for history; no hard deletes. |
| **Inspection Program** | Defines inspections for a location (and optional service line): template, cadence. |
| **Service Event** | One record per actual service execution: facility, service line, date, crew, status (completed/missed/partial), optional link to assignment. |
| **Issue / Complaint** | Tied to account, facility, optional service line, service event, and assignment context. |
| **Crew Change Request** | Workflow: request → approval/rejection → new assignment; continuity tracking. |
| **Launch Packet** | Sales close produces payload used to create agreements, lines, and initial assignments (ops activation). |

## Constraints

- Multi-tenant: all tables have `org_id`; RLS by org.
- RBAC and franchisor/franchisee unchanged.
- Effective-dated assignments: history by `effective_to`; no hard-delete of production-critical rows.
- Migration-safe: additive tables and columns; backfill from existing `crew_assignments`, `schedules`, `facilities`.

## How Dashboards, Inspections, and Financials Attach

- **Dashboards**: Aggregate by org → account → facility → agreement → service line; use `service_events` for completion/miss rates; use `service_assignments` for “who is assigned” at a given date.
- **Inspections**: Run from **inspection_programs** (location + optional service line, template, cadence). Existing `inspections` table gains optional `inspection_program_id` and `service_line_id`; continue to store scores/responses as today.
- **Financials**: Bill by **account**; optionally by **service_agreement** (contract). Revenue and cost can roll up from agreements → lines → events (e.g. per-event or per-line pricing). `contract_value_monthly` on `service_agreements` can drive MRR; `service_events` (completed) can drive usage-based billing if needed.

---

## Route / Action Updates

- **Launch packet accept**: After setting `launch_packets.status = 'accepted'`, call `activateLaunchPacket()` with parsed payload (facility, agreement name, start date, line types, initial crew). This creates `service_agreements`, `service_lines`, and initial `service_assignments`, and sets `launch_packets.service_agreement_id`.
- **Crew reassignment (UI)**: Use `endAssignmentAndReplace()` or `approveCrewChangeRequest()` when user confirms a crew change; do not hard-delete `service_assignments`.
- **Service event logging**: When crew or supervisor logs a completed/missed/partial service, call `createServiceEvent()`. Optionally link to current assignment via `getAssignmentsAtDate()` for the facility/service line and date.
- **Issues**: When creating an issue from an inspection or ad-hoc, set `service_line_id`, `service_event_id`, and/or `service_assignment_id` when available so complaints are tied to execution context.
- **Inspection creation**: When creating from a program, set `inspection_program_id` and `service_line_id` on `inspections`. Existing routes that create inspections should be updated to accept optional `inspection_program_id` and `service_line_id`.

---

## Backfill Strategy

1. **service_agreements**: For each `facility_id`, create one agreement per facility with `start_date` = min(crew_assignments.start_date) or facility created_at, `end_date` null, `status = 'active'`, `name = facility.name + ' Agreement'`. Use existing `facilities.service_frequency_per_week` / `service_days` if present.
2. **service_lines**: For each backfilled agreement, insert one `service_line` with `line_type = 'nightly_janitorial'` (or infer from schedules/templates if possible).
3. **service_assignments**: For each existing `crew_assignments` row, insert a `service_assignments` row: `facility_id`, `service_line_id` = (first line of the agreement for that facility), `crew_id`, `effective_from` = crew_assignments.start_date, `effective_to` = crew_assignments.end_date. This preserves history; no rows are deleted from `crew_assignments`.
4. **service_events**: Optional. Backfill from `task_completions` / inspections if there is a clear mapping (e.g. inspection completed_at → service_event for that facility/date with status 'completed'). Otherwise leave empty and start recording going forward.
5. **inspection_programs**: For each facility that has at least one inspection with a template_id, create one `inspection_program` with that template and cadence 'weekly' (or infer from schedules). Then set `inspections.inspection_program_id` and optionally `service_line_id` where matchable.
6. **issues**: Backfill `service_line_id` / `service_event_id` / `service_assignment_id` only where determinable (e.g. from inspection's facility + date); otherwise leave null.
7. Do **not** drop `crew_assignments` or `schedules` until all reads are migrated to `service_assignments` and `service_events`; keep legacy tables for read-only fallback during transition.
