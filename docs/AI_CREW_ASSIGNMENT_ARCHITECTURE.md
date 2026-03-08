# AI Crew / Operator Assignment Recommendation — Architecture & Implementation

**Business goal:** Ops should not manually guess which crew takes a new account. JANIBEAR recommends: best crew/operator, best supervisor, headcount, labor hours per visit, evening/day split, backup options, and assignment risk level — for new activations, crew changes, recovery, expansions, and restarts.

---

## 1. Architecture Overview

### 1.1 Hybrid Assignment Engine (three layers)

| Layer | Purpose | Inputs | Outputs |
|-------|---------|--------|--------|
| **Rules** | Eligibility filter: who can be assigned | Territory, max capacity, service window, required skills/certs | Eligible crew set (or empty + reason) |
| **Weighted scoring** | Rank eligible crews by operational fit | Account requirements, operator_performance, operator_capacity, proximity, reliability, complaint history, similar-account fit | Score per crew; ranked list |
| **AI** | Reasoning summary, confidence, risk narrative | Scores + account context + crew context | reasoning_summary, confidence_score, risk_flags[] |

- Rules run first; scoring runs on eligible crews only; AI consumes scores + context to produce human-readable summary and confidence.
- Existing `suggestOperator` (performance + capacity + proximity) becomes the **scoring layer** foundation; extend with workload, reliability, inspection score, complaint rate, and account-requirement fit.

### 1.2 Scoring Model (weighted factors)

| Factor | Weight (tunable) | Source | Notes |
|--------|------------------|--------|--------|
| Performance (QC, response, leadership) | 0.25 | operator_performance | total_score or composite |
| Capacity headroom | 0.20 | operator_capacity (active/max accounts, sqft) | Penalize near-capacity |
| Proximity / route fit | 0.20 | geo_entities + distance | Reuse territoryProximityScoreFromDistanceMiles |
| Reliability | 0.15 | crew_reliability_snapshots | attendance, no_show_rate, shift_completion |
| Complaint / issue history | 0.10 | account_complaints, issues | Lower score if complaints |
| Similar-account fit | 0.10 | Same vertical/building_type/size band | Optional: match to existing assignments |
| Inspection / QC consistency | (in performance) | operator_performance.qc_score | Already in total_score |

- **Supervisor:** Pick from crew’s assigned supervisor or highest leadership_score in operator_performance for that crew.
- **Headcount / labor hours:** Derive from account requirements (sqft, restrooms, frequency, scope) via rules or lookup table (e.g. hours_per_sqft by building type); AI can refine narrative.
- **Evening/day split:** From service_days + service window in requirements; optional field in recommendation.

### 1.3 Event Triggers

| Event | Trigger | Entity | Action |
|-------|---------|--------|--------|
| New account activation (from Sales) | Launch packet status → ready or sent_to_ops | launch_packet_id | Compute recommendation; store in activation_recommendations |
| Crew change request | User requests crew change for facility | facility_id / service_assignment_id | Compute for replacement crew |
| Recovery activation | Account/reactivation flow | account_id | Compute for re-assignment |
| Account expansion | New facility or new service line added | account_id / facility_id | Compute for new scope |
| Restarted account | Account status → active after pause | account_id | Compute for restart |

- **Implementation:** API or server action `computeActivationRecommendation(activationType, entityId)` called when Ops opens the activation detail (e.g. launch-intake/[id]) or when packet reaches ready/sent_to_ops. Optionally background job for batch.

---

## 2. Data Model

### 2.1 Existing Tables (no schema change for Phase 1)

- **Account/facility:** accounts, facilities (facility has address; add square_footage, restroom_count, building_type, service_frequency, service_days on facilities or in payload).
- **Crew/operator:** crews, operator_performance, operator_capacity, crew_reliability_snapshots, account_complaints.
- **Risk:** account_risk_snapshots (recommended_backups), risk_settings.
- **Handoff:** launch_packets (payload_jsonb: scope, schedule_draft, service_locations, service_frequency, service_days).
- **Execution:** service_agreements, service_assignments, service_lines.

### 2.2 New / Extended Tables

**account_requirements (new)**  
- Normalized account/facility requirements for scoring. Populated from launch_packet payload + facility + walkthrough/LiDAR when available.  
- `id`, `org_id`, `account_id`, `facility_id` (nullable), `source_type` ('launch_packet' | 'facility' | 'manual'), `source_id` (e.g. launch_packet_id), `square_footage`, `building_type`, `room_restroom_count`, `kitchen_breakroom_count`, `service_frequency`, `service_days` (jsonb array), `service_window` (e.g. evening/day), `estimated_labor_hours_per_visit`, `complexity_score` (LiDAR-derived nullable), `special_requirements` (text), `created_at`, `updated_at`.

**activation_recommendations (new)**  
- One row per activation event: recommended crew, backup, supervisor, headcount, labor, split, reasoning, confidence, risk.  
- `id`, `org_id`, `activation_type` ('new_account' | 'crew_change' | 'recovery' | 'expansion' | 'restart'), `entity_type` ('launch_packet' | 'crew_change_request' | 'account' | 'facility'), `entity_id` (uuid), `primary_crew_id`, `primary_supervisor_id`, `secondary_crew_ids` (uuid[]), `backup_crew_ids` (uuid[]), `recommended_headcount`, `weekly_labor_hours`, `evening_day_split` (text or jsonb), `reasoning_summary` (text), `confidence_score` (0–100), `risk_level` ('low'|'medium'|'high'), `risk_flags` (jsonb array), `scores_jsonb` (full factor breakdown), `computed_at`, `created_at`.  
- Unique on (org_id, activation_type, entity_type, entity_id) with upsert on recompute.

**Optional:**  
- **crew_capacity_snapshots** — optional cache of operator_capacity + workload at compute time (e.g. for audit). Can use operator_capacity as-is and snapshot in scores_jsonb.

### 2.3 Launch Packet Payload Extensions (in code only)

- Extend `LaunchPacketPayload` with optional: `square_footage`, `building_type`, `room_restroom_count`, `service_window`, `estimated_labor_hours_per_visit`, `complexity_score`.  
- Read from payload when building account_requirements or when passing context to the engine.

---

## 3. Inputs the Engine Considers

### 3.1 Account requirements

- Square footage, flooring types, building type, room/restroom counts, kitchens/breakrooms.  
- Service frequency, service days, service window (evening/day).  
- Special scope, LiDAR-derived complexity, estimated labor burden.  
- **Source:** launch_packet.payload_jsonb, facilities (if columns added), account_requirements table.

### 3.2 Crew/operator data

- Current workload (active accounts, current_sqft), open capacity (operator_capacity).  
- Inspection/QC score, complaint history (operator_performance, account_complaints).  
- Missed-task rate, reliability (crew_reliability_snapshots).  
- Leadership/supervisor strength (operator_performance.leadership_score).  
- Proximity/route fit (geo_entities + distance).  
- Similar-account fit (same vertical/building type — optional).

### 3.3 Constraints

- Territory/franchise boundaries (reuse suggestOperator territory filter).  
- Max capacity (operator_capacity.max_accounts, max_sqft).  
- Service window compatibility (optional time-window match).  
- Required skills/certifications (optional future; not in current schema).  
- Schedule feasibility (service_days vs crew’s existing schedule — optional).

---

## 4. Outputs per Activation

- **Primary crew recommendation** (primary_crew_id).  
- **Secondary recommendation** (secondary_crew_ids, ordered).  
- **Backup recommendation** (backup_crew_ids).  
- **Supervisor recommendation** (primary_supervisor_id).  
- **Recommended headcount** (recommended_headcount).  
- **Weekly labor estimate** (weekly_labor_hours).  
- **Evening/day split** (evening_day_split).  
- **Reasoning summary** (reasoning_summary, from AI or rule-based template).  
- **Confidence score** (0–100).  
- **Risk flags** (risk_flags: e.g. "high_sqft", "crew_at_capacity", "no_backup_in_territory").

---

## 5. Integration Points

- **Activations:** Launch-intake detail page shows “AI Recommended Assignment” card; Accept flow can prefill recommended crew.  
- **Accounts:** Account detail or activation flow can show recommendation for expansion/restart.  
- **Operator performance engine:** Use operator_performance + operator_capacity (recalculateOperatorScores).  
- **Account risk engine:** Use risk_snapshots.recommended_backups; optionally feed into backup_crew_ids.  
- **Launch to Ops / handoff:** Launch packet payload (scope, frequency, days) + account/facility as input; write recommendation to activation_recommendations linked to launch_packet_id.  
- **LiDAR / account intelligence:** complexity_score or scope from walkthrough_scans; optional field in account_requirements.

---

## 6. UI for Ops

- **AI Recommended Assignment card** (on launch-intake/[id], and optionally account/activation pages):  
  - Primary crew + supervisor, secondary and backup crews.  
  - Headcount, weekly labor hours, evening/day split.  
  - Reasoning summary, confidence score, risk level and risk flags.  
- **Actions:** Accept recommendation (prefill crew in Accept form), Override (choose different crew; recommendation remains visible), Compare (show side-by-side with another crew’s scores — Phase 2).

---

## 7. File-Level Implementation Plan

### Phase 1 (foundation)

| File | Purpose |
|------|--------|
| `supabase/migrations/124_activation_recommendations.sql` | Tables: account_requirements, activation_recommendations. |
| `src/types/activation-recommendation.ts` | Types: AccountRequirements, ActivationRecommendation, ActivationType, recommendation output shape. |
| `src/lib/launch-packet-payload.ts` | Extend LaunchPacketPayload with square_footage, building_type, room_restroom_count, service_window, estimated_labor_hours_per_visit (optional). |
| `src/lib/assignment-engine/rules.ts` | Eligibility: territory, capacity, optional service window. |
| `src/lib/assignment-engine/scoring.ts` | Weighted scoring using operator_performance, operator_capacity, reliability, proximity; output ranked list + factor breakdown. |
| `src/lib/assignment-engine/recommendation.ts` | Orchestrate rules → scoring → build ActivationRecommendation; optional AI stub (template reasoning). |
| `src/app/api/app/ops/activation-recommendation/route.ts` | GET?activation_type=&entity_id= or POST body; returns recommendation (compute or from activation_recommendations). |
| `src/components/launch/ai-recommended-assignment-card.tsx` | Card: primary/secondary/backup, supervisor, headcount, labor, split, reasoning, confidence, risk; Accept / Override. |
| `src/app/app/ops/launch-intake/[id]/page.tsx` | Fetch recommendation; render AiRecommendedAssignmentCard when status is ready/sent_to_ops. |

### Phase 2

- AI layer: call LLM with scores + account/crew context; fill reasoning_summary, risk_flags.  
- account_requirements: backfill from launch_packets and facilities; LiDAR complexity_score.  
- Compare view: side-by-side crew comparison.  
- Triggers: on packet ready/sent_to_ops auto-compute and store.

### Phase 3

- Crew change request flow: compute recommendation for replacement crew.  
- Recovery / expansion / restart: same engine, different activation_type and entity_id.

---

## 8. QA Plan

- **Rules:** Crew over max capacity excluded; crew in wrong territory excluded (when territory_id provided).  
- **Scoring:** Same inputs produce stable ranking; weights configurable.  
- **API:** GET activation-recommendation?activation_type=new_account&entity_id=<launch_packet_id> returns 200 with primary_crew_id, reasoning_summary, confidence_score.  
- **UI:** On launch-intake/[id], card appears when packet status is ready or sent_to_ops; Accept prefills recommended crew when implemented.  
- **Persistence:** Recompute overwrites activation_recommendations row for same (activation_type, entity_type, entity_id).  
- **Edge cases:** No eligible crews → recommendation with empty primary and reasoning “No eligible crews (territory/capacity).”  
- **Permissions:** Only org members with ops access can call recommendation API and see card.

---

## 9. Rollback

- Drop activation_recommendations and account_requirements if needed; engine and UI are feature-flagged or optional (card only renders if recommendation exists or API returns data).  
- Remove card from launch-intake detail and delete API route; restore suggestOperator as sole suggestion path.

---

## 10. Phase 1 Implementation Summary (Done)

- **Migration 125:** `account_requirements`, `activation_recommendations` tables with RLS.
- **Types:** `src/types/activation-recommendation.ts` (ActivationType, AccountRequirementsInput, CrewCandidateScore, ActivationRecommendationResult, ActivationRecommendationRow).
- **Engine:** `src/lib/assignment-engine/rules.ts` (getEligibleCrews), `scoring.ts` (scoreCrews), `recommendation.ts` (computeActivationRecommendation, getActivationRecommendation).
- **API:** `GET /api/app/ops/activation-recommendation?activation_type=&entity_type=&entity_id=&force_compute=1` (ops.read).
- **UI:** `AiRecommendedAssignmentCard` on launch-intake/[id] with primary/secondary/backup, reasoning, confidence, risk, "Accept with recommended crew"; `LaunchIntakeActions` wraps card + AcceptRejectLaunchForm.
- **Accept flow:** `acceptLaunchPacket(packetId, options?: { initialCrewId })` passes initialCrewId to `activateLaunchPacket` for first assignment.
