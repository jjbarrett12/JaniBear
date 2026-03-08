# Account Intelligence Profile — Production Architecture

**Business goal:** Sales reps focus on hunting and closing; AI quietly prepares the account from lead stage so that when a contract is signed, Ops receives an activation-ready account with minimal manual effort.

**Canonical lifecycle:** Lead → Walkthrough → Proposal → Account → Active Account → Cancelled Account → Attrition.

**Language rules:** “Account” = primary customer object after close; “Service Address” = physical location; “Area” / “Zone” / “Floor” / “Space” = subdivisions; avoid “site”/“location” in UX; no risky full DB rename of site/location tables.

**Critical rule:** The profile begins at lead stage and evolves through walkthrough, proposal, close, Launch to Ops, activation, and active service. It must not only exist after close.

**AI principle:** Sales hunts. AI prepares the battlefield. Ops executes.

---

# PART 1 — ARCHITECTURE

## 1.1 What the profile answers

The central Account Intelligence Profile is the system’s internal brain for what JANIBEAR knows about each lead/account, how confident it is, what still needs confirmation, and what AI recommends next. It is implemented as a **hybrid data model**: structured columns for critical queryable/scorable data, JSON for raw AI output, extraction details, evidence, and confidence.

### (1) What kind of account/building is this?

| Concept | Structured column / JSON | Notes |
|--------|---------------------------|--------|
| Industry | `industry` (text) | From lead/enrichment |
| Building type | `building_type` (text) | Existing |
| Square footage | `square_footage_estimate` (numeric) | Existing |
| Floor count | `floor_count` (int) | Existing |
| Occupancy pattern | `occupancy_pattern` (text) or `extracted_data.occupancy` | e.g. 9–5, 24/7, weekend-only |
| Service window constraints | `service_window` (evening/day/mixed) | Existing |
| Complexity tier | `complexity_tier` (text) or `extracted_data.complexity_tier` | low/medium/high; from LiDAR or scope |

### (2) What cleaning/service work is likely required?

| Concept | Structured / JSON | Notes |
|--------|--------------------|--------|
| Flooring mix | `flooring_mix` (jsonb) or `extracted_data.flooring_mix` | e.g. { "carpet_pct": 40, "hard": 60 } |
| Restroom count | `restroom_count` (int) | Existing |
| Kitchen/breakroom count | `kitchen_breakroom_count` (int) | New column |
| Trash volume | `trash_volume` (text) or in extracted_data | low/medium/high |
| Touchpoint density | `touchpoint_density` (text) or extracted_data | For task planning |
| Special cleaning requirements | `special_cleaning_requirements` (text) | New |
| Frequency recommendation | `frequency_recommendation` (text) | AI-recommended; may differ from signed frequency |

### (3) What operational effort does it likely require?

| Concept | Structured / JSON | Notes |
|--------|--------------------|--------|
| Labor per visit | `estimated_labor_hours_per_visit` (numeric) | Existing |
| Labor per week | `estimated_labor_hours_per_week` (numeric) | New |
| Recommended headcount | `recommended_headcount` (int) | Existing |
| Likely crew type | `likely_crew_type` (text) | e.g. standard, specialty, multi-site |
| Equipment/supply implications | `equipment_supply_implications` (text or jsonb) | New |
| Inspection zone suggestions | `inspection_zone_suggestions` (jsonb) | From spaces / LiDAR; for QC zones |

### (4) How good is the fit operationally?

| Concept | Structured / JSON | Notes |
|--------|--------------------|--------|
| Route cluster fit | `recommended_cluster_id` (uuid → route_clusters) | Existing |
| Travel burden | `travel_burden_minutes` (numeric) or in scores_jsonb | From assignment engine |
| Staffing fit | `staffing_fit_score` (int 0–100) or in confidence_metadata | New |
| Activation readiness | `activation_readiness` (text) | Existing |
| Risk indicators | `risk_flags` (jsonb array) | Existing |

### (5) What is still unknown or unverified?

| Concept | Stored as | Notes |
|--------|-----------|--------|
| Missing LiDAR | `missing_data_flags` + task type `missing_lidar` | |
| Uncertain flooring | task `verify_flooring`; confidence_metadata | |
| No confirmed service window | task `confirm_service_window` | |
| No verified restroom count | task `confirm_restroom_count` or missing_data | |
| No signed service frequency | task `verify_scope` / proposal_readiness | |
| No confirmed start date | task or activation_readiness | |

Confidence/verification: **verification_state** on profile (ai_estimated | human_confirmed | contract_confirmed | inferred | stale). **confidence_metadata** (jsonb) for field-level source and confidence.

---

# PART 2 — DATA MODEL

## 2.1 Canonical tables (DB names for compatibility)

- **account_intelligence_profiles** — Main canonical intelligence record. Linked to lead_id, account_id, opportunity_id (at least one of lead_id or account_id). Hybrid: structured columns + raw_ai_output, evidence_summary, confidence_metadata, extracted_data.
- **profile_sources** (conceptual: *account intelligence sources*) — Evidence records: lead_form, enrichment, lidar, photo_upload, voice_note, walkthrough_form, proposal, contract, manual_edit, ai_inference. DB table name remains `profile_sources` for compatibility.
- **extracted_spaces** (conceptual: *account intelligence spaces*) — Rooms/zones/areas/floors for mapping, LiDAR, inspection zones, floor-care, task planning. DB table name remains `extracted_spaces`.
- **ai_recommendations** (conceptual: *account intelligence recommendations*) — Recommendations over time (proposal, staffing, assignment, activation, route_fit, risk, schedule). DB table name remains `ai_recommendations`.
- **ai_readiness_tasks** (conceptual: *account intelligence tasks*) — Missing-data/readiness tasks: missing_lidar, confirm_sqft, verify_flooring, confirm_service_window, assign_supervisor, finalize_schedule, verify_scope. DB table name remains `ai_readiness_tasks`.

All tables are **org-scoped** (org_id), with RLS enforcing `is_org_member(org_id, auth.uid())` or `is_site_admin(auth.uid())`. Tenant isolation is strict; no cross-org reads/writes.

## 2.2 Extended profile columns (migration 128)

Add to **account_intelligence_profiles**:

- **Account/building:** industry (text), occupancy_pattern (text), complexity_tier (text)
- **Cleaning/scope:** kitchen_breakroom_count (int), flooring_mix (jsonb), trash_volume (text), touchpoint_density (text), special_cleaning_requirements (text), frequency_recommendation (text)
- **Operational:** estimated_labor_hours_per_week (numeric), likely_crew_type (text), equipment_supply_implications (text), inspection_zone_suggestions (jsonb)
- **Fit:** travel_burden_minutes (numeric), staffing_fit_score (int), start_date_risk (text) — optional

Verification: **verification_state** and **confidence_metadata** already exist.

## 2.3 Source types (profile_sources.source_type)

Allowed values (application-level; DB can keep TEXT): lead_form, enrichment, lidar, photo_upload, voice_note, walkthrough_form, proposal, contract, manual_edit, ai_inference, plus event names: lead_created, lead_enriched, walkthrough_scheduled, lidar_uploaded, photos_uploaded, voice_note_uploaded, walkthrough_completed, proposal_generated, proposal_sent, contract_uploaded, deal_closed_won, launch_to_ops_requested, ops_activation_started, account_activated, inspection_failed, complaint_received, crew_changed.

## 2.4 Task types (ai_readiness_tasks.task_type)

Extend beyond missing_data, proposal_readiness, activation_readiness to: missing_lidar, confirm_sqft, verify_flooring, confirm_service_window, confirm_restroom_count, assign_supervisor, finalize_schedule, verify_scope, and keep generic missing_data, proposal_readiness, activation_readiness.

## 2.5 Recommendation types (ai_recommendations.recommendation_type)

Application-level: proposal, staffing, assignment, activation, route_fit, risk, schedule. No DB enum change; store as text.

---

# PART 3 — EVENT-DRIVEN AUTOMATION

For each trigger: what updates in the profile, which recommendation jobs run, which tasks created/updated, what is recalculated, whether a new recommendation version is persisted.

| Event | Profile updates | Recommendation jobs | Tasks created/updated | Recalculated | New recommendation persisted |
|-------|-----------------|---------------------|------------------------|--------------|------------------------------|
| lead_created | Create profile; merge lead form (building_type, industry, address, etc.) | — | — | — | No |
| lead_enriched | Merge enrichment (industry, company size, etc.) into structured + evidence | building intelligence | — | — | Optional (building) |
| walkthrough_scheduled | Attach source | — | — | — | No |
| lidar_uploaded | Attach source; merge extracted_data, extracted_spaces; sqft, floor_count, complexity | building, labor, spaces | missing_lidar → done if processed | labor, headcount | Yes (staffing, schedule) |
| photos_uploaded | Attach source; optional AI merge (flooring, restrooms) | building, scope | confirm_sqft, verify_flooring | — | Optional |
| voice_note_uploaded | Attach source; transcribe → merge pain points, budgets, scope, flooring in extracted_data | scope, labor | — | labor, frequency | Optional |
| walkthrough_completed | Merge scope, sqft, restrooms, service window; attach source | proposal readiness, labor | confirm_sqft, confirm_service_window | labor, headcount | Yes (proposal, labor) |
| proposal_generated | proposal_readiness; attach source | — | proposal_readiness → done | — | No |
| proposal_sent | proposal_readiness = sent | — | — | — | No |
| contract_uploaded | verification_state → contract_confirmed where applicable; attach source | — | verify_scope, finalize_schedule | — | No |
| deal_closed_won | Set account_id, opportunity_id; attach source | activation, staffing | activation_readiness tasks | — | Yes (activation) |
| launch_to_ops_requested | activation_readiness = launch_requested; attach source | activation, route_fit | finalize_schedule, assign_supervisor | route fit, crew rec | Yes (assignment) |
| ops_activation_started | activation_readiness = in_progress | — | — | — | No |
| account_activated | activation_readiness = activated; attach source | — | — | — | No |
| inspection_failed | risk_flags; evidence_summary | risk | — | risk | Yes (risk) |
| complaint_received | risk_flags; evidence_summary | risk | — | risk | Yes (risk) |
| crew_changed | evidence_summary; attach source | assignment (replacement) | — | route fit | Optional |

Implementation: application-layer event handlers call profile service (attach source, merge, update readiness, create tasks, enqueue or run recommendation jobs). No requirement to persist “recommendation version” as a separate table; “new recommendation persisted” means upsert into ai_recommendations for the relevant type.

---

# PART 4 — AI + AUTOMATION RESPONSIBILITIES

## Sales / Grizzly (Hunt, Stalk, Kill, Launch to Ops)

- **Hunt:** Profile created at lead; enrichment and lead form feed building_type, industry, address. AI: lead enrichment, building intelligence (initial).
- **Stalk:** Walkthrough scheduled → source attached. LiDAR/photos/voice → extraction into profile (sqft, floors, spaces, flooring, restrooms, scope). AI: walkthrough analysis, LiDAR/photo extraction, labor estimation, proposal readiness.
- **Kill:** Proposal generated/sent, contract uploaded → proposal_readiness, verification_state. AI: proposal readiness, labor/staffing recommendation.
- **Launch to Ops:** Sales submits launch packet → launch_to_ops_requested. Profile already holds building intelligence, scope, labor, frequency; AI has prepared activation-ready data. AI: activation readiness, staffing/route-fit recommendations for Ops.

## Ops / Kodiak (Command Center, Activations, Accounts, Crews, Mapping, Inspections, Issues, Performance)

- **Activations:** Profile feeds activation_recommendations (account requirements, labor, headcount, route fit). AI: staffing recommendation, crew recommendation, route-aware assignment, start-date risk, missing setup items.
- **Accounts / Mapping:** Profile + extracted_spaces feed mapping and inspection zones. Service Address = facility; Area/Zone/Floor/Space from extracted_spaces.
- **Inspections / Issues:** inspection_zone_suggestions, risk_flags; complaint_received/inspection_failed update profile and risk recommendations.
- **Performance:** Profile is read-only intelligence spine; no direct write from performance module.

## AI responsibilities (summary)

Lead enrichment, building intelligence, walkthrough analysis, LiDAR/photo extraction, proposal readiness, labor estimation, staffing recommendation, route-fit recommendation, activation readiness, missing-data detection, ongoing account health (risk, complaints). **Rule:** LiDAR-derived and walkthrough-derived operational intelligence should be in the profile before or when the signed contract arrives so Sales does not compile handoff materials manually.

---

# PART 5 — LAUNCH TO OPS / ACTIVATIONS INTEGRATION

- **Launch to Ops** = Sales-owned final handoff (submit packet to Ops). One shared underlying model: account_intelligence_profiles + launch_packets + activation_recommendations.
- **Activations** = Ops-owned intake and setup (receive packets, accept, assign crew, schedule). Same profile and launch_packet; Ops view shows activation readiness, AI crew/route recommendations, missing setup tasks.
- **No duplicate launch pages:** Sales sees “Launch to Ops” (launch-packets, submit); Ops sees “Activations” (launch-intake, accept, assign). Same data; role-specific views.
- Profile supports: Launch to Ops readiness (proposal_readiness, activation_readiness, missing_data_flags, tasks), Ops activation readiness, AI staffing/crew/route recommendations, start-date risk, missing setup items (tasks). Audio/voice: transcribe walkthrough → pain points, budgets, scope, expectations, flooring in extracted_data/evidence_summary.

---

# PART 6 — AI ASSIGNMENT + ROUTE FIT SUPPORT

Profile feeds the assignment engine via:

- **account_requirements** (or profile fields): square_footage, restroom_count, building_type, service_frequency, service_days, service_window, estimated_labor_hours_per_visit, complexity_tier, recommended_cluster_id.
- **Building complexity:** complexity_tier, flooring_mix, special_cleaning_requirements → labor and crew fit.
- **Labor estimation:** estimated_labor_hours_per_visit, estimated_labor_hours_per_week, recommended_headcount → staffing split and headcount.
- **Route-aware assignment:** recommended_cluster_id, travel_burden_minutes (optional), route_fit in activation_recommendations (already implemented).
- **Activation planning:** activation_readiness, missing_data_flags, ai_readiness_tasks (assign_supervisor, finalize_schedule, verify_scope).

Engine outputs (already in activation_recommendations): primary crew, backup crews, supervisor, headcount, labor hours per visit/week, day-by-day or evening split, route cluster, route fit score, added drive time, risk flags, confidence, reasoning. Schema and service layer allow the profile to be the single source for account requirements and building/labor inputs; no need to build a full route optimizer here beyond existing assignment engine.

---

# PART 7 — IMPLEMENTATION DELIVERABLES

## 7.1 Architecture summary

Single central profile per lead/account (account_intelligence_profiles), hybrid structured + JSON, linked to lead, walkthrough, proposal, account. Supporting tables: profile_sources (evidence), extracted_spaces (zones/rooms/floors/areas), ai_recommendations (over time), ai_readiness_tasks (missing-data/readiness). Profile starts at lead; evolves via events; feeds proposals, Launch to Ops, Activations, and AI assignment. Verification and confidence tracked; event-driven updates and task/recommendation creation defined per event.

## 7.2 Exact schema design

See Part 2 and migration 127 + 128. Central table: account_intelligence_profiles with identity (org_id, lead_id, account_id, opportunity_id), building/scope/service/labor/route/readiness/risk structured columns, verification_state, raw_ai_output, evidence_summary, confidence_metadata, extracted_data, last_event_at. Supporting: profile_sources (profile_id, source_type, source_entity_type, source_entity_id, captured_at, meta), extracted_spaces (profile_id, name, space_type, sort_order, geo_json, meta), ai_recommendations (profile_id, recommendation_type, content, content_jsonb, status, resolved_at), ai_readiness_tasks (profile_id, task_type, title, description, status, due_at, meta).

## 7.3 SQL migrations

- **127** (existing): account_intelligence_profiles (base columns), profile_sources, extracted_spaces, ai_recommendations, ai_readiness_tasks, RLS.
- **128** (new): ALTER account_intelligence_profiles ADD industry, occupancy_pattern, complexity_tier, kitchen_breakroom_count, flooring_mix, trash_volume, touchpoint_density, special_cleaning_requirements, frequency_recommendation, estimated_labor_hours_per_week, likely_crew_type, equipment_supply_implications, inspection_zone_suggestions, travel_burden_minutes, staffing_fit_score; expand ai_readiness_tasks.task_type CHECK to include missing_lidar, confirm_sqft, verify_flooring, confirm_service_window, confirm_restroom_count, assign_supervisor, finalize_schedule, verify_scope.

## 7.4 RLS / tenant-safety

All tables have org_id. RLS policies: SELECT/INSERT/UPDATE/DELETE allowed only where is_org_member(org_id, auth.uid()) OR is_site_admin(auth.uid()). No cross-org access. FK to leads/accounts/opportunities/route_clusters; cascade/delete behavior defined in 127.

## 7.5 TypeScript types

AccountIntelligenceProfile (with new optional fields), ProfileSource, ExtractedSpace, AIRecommendation, AIReadinessTask; VerificationState, source type and task type unions; ProfileEventType extended for all events.

## 7.6 Repository / service layer

Repository: getByLeadId, getByAccountId, getById, create, update (partial), ensureForLead, attachSource, listSources, addExtractedSpace, listExtractedSpaces, addAIRecommendation, addAIReadinessTask, listReadinessTasks. Service: ensureProfileForLead, mergeFromLead, mergeFromWalkthrough, mergeFromProposal, updateReadiness, linkAccountToProfile, getProfileForLeadOrAccount; optional mergeFromLidar, mergeFromVoiceNote. Events: onLeadCreated, onLeadEnriched, onWalkthroughScheduled, onLidarUploaded, onPhotosUploaded, onVoiceNoteUploaded, onWalkthroughCompleted, onProposalGenerated, onProposalSent, onContractUploaded, onDealClosedWon, onLaunchToOpsRequested, onOpsActivationStarted, onAccountActivated, onInspectionFailed, onComplaintReceived, onCrewChanged.

## 7.7 Event-trigger design

See Part 3. Triggers are application-layer: call event handlers from lead create, enrichment job, walkthrough lifecycle, proposal/contract flows, launch packet send, ops accept, account activate, inspection/complaint/crew change. No DB triggers required for business logic; optional DB trigger only for last_event_at/updated_at on source insert.

## 7.8 Backfill strategy

- **Phase 1:** New leads get profile on create (already wired). On conversion, profile gets account_id (already wired).
- **Phase 2:** Backfill: for each existing lead without a profile, create profile (lead_id set, account_id from converted_account_id if any). For each account without a profile but with converted_lead_id, create profile with account_id and lead_id. Seed structured fields from leads (building_type, service_frequency_guess, industry, address), from walkthroughs (square_footage_estimate, etc.), from launch_packets payload. Attach profile_sources for existing walkthroughs/proposals/contracts where entity ids exist.
- **Phase 3+:** Populate extracted_spaces from LiDAR/scope where available; create ai_readiness_tasks for missing_lidar, confirm_sqft, etc.; generate initial ai_recommendations from existing data.

## 7.9 File-by-file implementation plan

| File | Purpose |
|------|--------|
| docs/ACCOUNT_INTELLIGENCE_PROFILE_PRODUCTION.md | This doc (architecture, schema, events, QA, rollout). |
| supabase/migrations/127_account_intelligence_profiles.sql | Base tables; already done. |
| supabase/migrations/128_account_intelligence_profiles_extend.sql | Extended profile columns; expanded task_type CHECK. |
| src/types/account-intelligence-profile.ts | AccountIntelligenceProfile extended fields; AIReadinessTaskType expanded; ProfileEventType + ProfileSourceType. |
| src/lib/account-intelligence/profile-repository.ts | mapProfileRow + update() support all new columns. |
| src/lib/account-intelligence/profile-service.ts | mergeFromLead (industry, occupancy_pattern); mergeFromLidar; mergeFromVoiceNote. |
| src/lib/account-intelligence/events.ts | onLeadEnriched, onPhotosUploaded, onVoiceNoteUploaded, onProposalSent, onContractUploaded, onInspectionFailed, onComplaintReceived, onCrewChanged, onOpsActivationStarted. |
| src/actions/leads.ts | Already calls onLeadCreated. |
| src/lib/sales/convert-and-launch.ts | Already calls onDealClosedWon. |
| (Future) Lead enrichment job, walkthrough complete, launch send, inspection/complaint/crew change | Call corresponding event handlers. |

## 7.10 QA / test checklist

- [ ] Profile created when lead is created (lead_id set, account_id null).
- [ ] Profile lookup by lead_id and by account_id; after conversion same profile has both.
- [ ] attachSource creates row and updates last_event_at.
- [ ] Extended columns (industry, occupancy_pattern, complexity_tier, kitchen_breakroom_count, flooring_mix, labor_per_week, likely_crew_type, equipment_supply_implications, inspection_zone_suggestions, travel_burden_minutes, staffing_fit_score) persist and read.
- [ ] Task types: missing_lidar, confirm_sqft, verify_flooring, confirm_service_window, assign_supervisor, finalize_schedule, verify_scope can be inserted and listed.
- [ ] Source types: lead_form, enrichment, lidar, photo_upload, voice_note, walkthrough_form, proposal, contract, manual_edit, ai_inference accepted.
- [ ] RLS: only org members (or site admin) can read/write; cross-org forbidden.
- [ ] Backfill: existing leads get one profile each; no duplicate profiles per lead/account.

## 7.11 Risks / compatibility concerns

- **Risk:** Backfill or event handlers run before migration 128; new columns missing. **Mitigation:** Add columns with ADD COLUMN IF NOT EXISTS / nullable; code checks for presence.
- **Compatibility:** Table names profile_sources, extracted_spaces, ai_recommendations, ai_readiness_tasks kept; no rename of site/location tables. Code and docs use “account intelligence sources/spaces/recommendations/tasks” as conceptual names.
- **Risk:** Expanding task_type CHECK can fail if existing rows have old values. **Mitigation:** 128 adds new values to CHECK; existing values (missing_data, proposal_readiness, activation_readiness) remain valid.

## 7.12 Phased rollout

- **Phase 1:** Schema (127 + 128), types, repository, service, event functions, backfill hooks (ensureForLead on lead create; onDealClosedWon on convert). No UI.
- **Phase 2:** Backfill profiles from current leads/accounts; attach sources from existing walkthrough/proposal/contract data; generate readiness tasks and summary recommendations where data exists.
- **Phase 3:** Read-only intelligence panels in Sales (lead/account detail) and Ops (activation detail) showing profile summary, sources, tasks, recommendations.
- **Phase 4:** Use profile to power proposal automation, Launch to Ops payload prefill, Activations intake, and AI assignment (account_requirements + assignment engine).
- **Phase 5:** Deeper optimization (smarter labor model, route optimization, ongoing health scoring).

---

# PART 8 — ROLLOUT STRATEGY (PHASES 1–5)

- **Phase 1:** Schema, types, service layer, event/update functions, backfill hooks from existing lead/walkthrough/proposal/account data. **Deliverables:** migrations 127+128, types, repository, service, events, call sites for lead_created and deal_closed_won.
- **Phase 2:** Populate profile from current records; attach LiDAR/photo/note data where available; generate readiness tasks and summary recommendations. **Deliverables:** backfill script or cron; task creation logic; optional recommendation job.
- **Phase 3:** Surface read-only intelligence panels in Sales and Ops. **Deliverables:** UI components that read profile, sources, tasks, recommendations by lead/account/activation.
- **Phase 4:** Use profile to power proposal automation, Launch to Ops, Activations, and AI assignment recommendations. **Deliverables:** proposal builder reading profile; launch packet prefill from profile; activation_recommendations using account_requirements from profile; assignment engine already uses profile-like inputs.
- **Phase 5:** Deeper optimization and smarter operational recommendations. **Deliverables:** improved labor model, route/cluster optimization, account health scoring.

---

# PART 9 — OUTPUT FORMAT (ORDER)

1. **Architecture approach**  
   Central profile per lead/account, hybrid structured+JSON, event-driven evolution from lead through activation. Profile answers: (1) what kind of account/building, (2) what cleaning/service work, (3) what operational effort, (4) how good is the fit, (5) what is unknown/unverified. Feeds Sales (Hunt/Stalk/Kill/Launch to Ops) and Ops (Activations, Accounts, Crews, Mapping, Inspections, etc.). AI prepares the battlefield; Ops executes.

2. **Proposed schema**  
   - **account_intelligence_profiles:** id, org_id, lead_id, account_id, opportunity_id; building (building_type, square_footage_estimate, restroom_count, floor_count, industry, occupancy_pattern, complexity_tier); scope (cleaning_scope_summary, kitchen_breakroom_count, flooring_mix, trash_volume, touchpoint_density, special_cleaning_requirements, frequency_recommendation); service (service_frequency, service_days, service_window); labor (estimated_labor_hours_per_visit, estimated_labor_hours_per_week, recommended_headcount, likely_crew_type, equipment_supply_implications); route/fit (recommended_cluster_id, travel_burden_minutes, staffing_fit_score, inspection_zone_suggestions, start_date_risk); readiness (proposal_readiness, activation_readiness); flags (risk_flags, missing_data_flags); verification_state; raw_ai_output, evidence_summary, confidence_metadata, extracted_data; last_event_at, created_at, updated_at.  
   - **profile_sources** (account intelligence sources): id, org_id, profile_id, source_type, source_entity_type, source_entity_id, captured_at, meta, created_at.  
   - **extracted_spaces** (account intelligence spaces): id, org_id, profile_id, name, space_type, sort_order, geo_json, meta, created_at.  
   - **ai_recommendations** (account intelligence recommendations): id, org_id, profile_id, recommendation_type, content, content_jsonb, status, created_at, resolved_at, resolved_by.  
   - **ai_readiness_tasks** (account intelligence tasks): id, org_id, profile_id, task_type, title, description, status, due_at, meta, created_at, resolved_at, resolved_by.  
   All org-scoped; RLS via is_org_member / is_site_admin.

3. **Exact files to create/edit**  
   - **Create:** `supabase/migrations/128_account_intelligence_profiles_extend.sql`, `docs/ACCOUNT_INTELLIGENCE_PROFILE_PRODUCTION.md` (this doc).  
   - **Edit:** `src/types/account-intelligence-profile.ts` (extended profile + task/source/event types), `src/lib/account-intelligence/profile-repository.ts` (map + update for new columns), `src/lib/account-intelligence/profile-service.ts` (mergeFromLead industry/occupancy; mergeFromLidar, mergeFromVoiceNote), `src/lib/account-intelligence/events.ts` (all 17 event handlers).  
   - **Already wired:** `supabase/migrations/127_account_intelligence_profiles.sql`, `src/actions/leads.ts` (onLeadCreated), `src/lib/sales/convert-and-launch.ts` (onDealClosedWon).

4. **SQL migrations**  
   - **127:** account_intelligence_profiles (base), profile_sources, extracted_spaces, ai_recommendations, ai_readiness_tasks; RLS.  
   - **128:** ALTER account_intelligence_profiles ADD industry, occupancy_pattern, complexity_tier, kitchen_breakroom_count, flooring_mix, trash_volume, touchpoint_density, special_cleaning_requirements, frequency_recommendation, estimated_labor_hours_per_week, likely_crew_type, equipment_supply_implications, inspection_zone_suggestions, travel_burden_minutes, staffing_fit_score, start_date_risk; expand ai_readiness_tasks.task_type CHECK (missing_lidar, confirm_sqft, verify_flooring, confirm_service_window, confirm_restroom_count, assign_supervisor, finalize_schedule, verify_scope).

5. **Service layer plan**  
   Repository: getByLeadId, getByAccountId, getById, create, update (partial, stripUndefined), ensureForLead, attachSource, listSources, addExtractedSpace, listExtractedSpaces, addAIRecommendation, addAIReadinessTask, listReadinessTasks. Service: ensureProfileForLead, mergeFromLead, mergeFromWalkthrough, mergeFromProposal, updateReadiness, linkAccountToProfile, getProfileForLeadOrAccount, mergeFromLidar, mergeFromVoiceNote. Events: onLeadCreated, onLeadEnriched, onWalkthroughScheduled, onLidarUploaded, onPhotosUploaded, onVoiceNoteUploaded, onWalkthroughCompleted, onProposalGenerated, onProposalSent, onContractUploaded, onDealClosedWon, onLaunchToOpsRequested, onOpsActivationStarted, onAccountActivated, onInspectionFailed, onComplaintReceived, onCrewChanged, attachEventSource.

6. **Event trigger plan**  
   See Part 3 table. For each of the 17 events: profile updates (create/merge/attach source/readiness); recommendation jobs (building, labor, proposal, activation, route_fit, risk); tasks created/updated (missing_lidar, confirm_sqft, verify_flooring, etc.); recalculated (labor, headcount, route fit, risk); whether to persist a new row in ai_recommendations. All implemented as application-layer handlers in events.ts; call from lead create, conversion, and (when built) enrichment, walkthrough, proposal, contract, launch, activation, inspection, complaint, crew change.

7. **Backfill plan**  
   Phase 1 (done): new leads get profile on create; on conversion profile gets account_id. Phase 2: for each lead without profile, create profile (lead_id set); for each account without profile but with converted lead, create profile (account_id + lead_id); seed from leads (building_type, service_frequency_guess, industry, address), walkthroughs (sqft, etc.), launch_packets; attach profile_sources for existing walkthroughs/proposals/contracts. Phase 3+: populate extracted_spaces from LiDAR; create ai_readiness_tasks; generate initial ai_recommendations.

8. **QA plan**  
   See §7.10. Profile on lead create; lookup by lead_id and account_id; attachSource and last_event_at; extended columns and new task/source types; RLS and no cross-org access; backfill yields one profile per lead/account and no duplicates.

9. **Rollout recommendation**  
   Phase 1 (implemented): schema 127+128, types, repository, service, event handlers, hooks for lead_created and deal_closed_won. Phase 2: backfill from current data; attach sources; generate tasks/recommendations. Phase 3: read-only intelligence panels in Sales and Ops. Phase 4: profile powers proposal automation, Launch to Ops, Activations, AI assignment. Phase 5: deeper optimization and smarter operational recommendations.
