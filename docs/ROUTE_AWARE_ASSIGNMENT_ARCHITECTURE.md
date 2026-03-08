# Route-Aware AI Assignment Engine — Architecture & Implementation

**Business goal:** When recommending the best crew for a new account or activation, JANIBEAR should evaluate not only quality and capacity but also **route efficiency** and **cluster fit**, and answer: which crew is best suited, how many people, how to split evening/day, which route cluster should absorb the account, how much travel burden this adds, and whether it improves or damages operational efficiency.

---

## 1. Architecture Overview

### 1.1 Four score groups

| Group | Purpose | Factors |
|-------|---------|--------|
| **Capability fit** | Quality, skills, reliability | Performance (QC, leadership), reliability score, complaint history, similar-account fit |
| **Capacity fit** | Headroom and workload | Active vs max accounts, current_sqft vs max_sqft, growth_capacity |
| **Route fit** | Route efficiency and cluster alignment | Distance from assigned accounts, added drive time, route fragmentation, neighborhood/territory alignment, service window compatibility, route compactness, cluster fit |
| **Risk fit** | Assignment risk and backup | Low match score, crew near capacity, no backup options, high fragmentation |

- **Final score** = weighted sum of the four groups (e.g. capability 0.30, capacity 0.25, route 0.30, risk 0.15), with risk as a penalty or inverse so higher risk lowers the score.
- **Route fit** is the new focus: it answers “how much travel burden does this add?” and “does this improve or damage efficiency?”

### 1.2 Route-fit factors

| Factor | Description | Source / computation |
|--------|-------------|----------------------|
| **Distance from assigned accounts** | Miles from new account to crew’s currently assigned facilities | service_assignments → facilities → geo_entities/facility_geo; min/avg distance to new account |
| **Added drive time** | Extra minutes per visit or per week if we add this account | distance_miles × drive_time_per_mile (e.g. 2.4 min/mile urban) |
| **Route fragmentation** | Whether crew’s route becomes more spread out | Std dev of facility distances or “span” (max − min distance); penalty if adding account increases span |
| **Neighborhood/territory alignment** | Whether account lies in crew’s existing territory or service area | territory_id, service_areas, or cluster membership |
| **Service window compatibility** | Evening vs day vs mixed; match to crew’s existing pattern | account_requirements.service_window vs crew_route_profile.service_window |
| **Route compactness** | How tight the crew’s current route is | Centroid of assigned facilities; distance from new account to centroid |
| **Cluster fit** | Whether a route cluster exists that should absorb this account | route_clusters; recommend cluster and best crew within it |

---

## 2. Data model

### 2.1 New tables

**route_clusters**  
- Logical grouping of facilities/accounts for route planning (e.g. “North zone”, “Downtown”).  
- `id`, `org_id`, `name`, `description`, `territory_id` (optional), `is_active`, `created_at`, `updated_at`.  
- Optional: `centroid_lat`, `centroid_lng`, `facility_ids` (jsonb) or separate cluster_members table.

**crew_route_profiles**  
- Snapshot of a crew’s current “route”: assigned facilities, centroid, drive metrics, service window.  
- `id`, `org_id`, `crew_id`, `facility_ids` (uuid[] or jsonb), `facility_count`, `centroid_lat`, `centroid_lng`, `avg_drive_minutes_per_visit`, `service_window` (evening/day/mixed), `computed_at`, `created_at`, `updated_at`.  
- Unique on (org_id, crew_id); recomputed when assignments change or on demand.

**crew_capacity_snapshots**  
- Point-in-time capacity for audit and comparison.  
- `id`, `org_id`, `crew_id`, `active_accounts`, `max_accounts`, `current_sqft`, `max_sqft`, `snapshot_at`, `created_at`.  
- Optional: append-only or upsert by (org_id, crew_id).

**account_service_profiles**  
- Service-level view for an account/facility: frequency, days, window, labor. Can alias or extend `account_requirements`.  
- Reuse `account_requirements` plus facility/service_agreement data; or add `account_service_profiles` view/table with `account_id`, `facility_id`, `service_frequency`, `service_days`, `service_window`, `estimated_labor_hours`, `source`.

**shift_staffing_plans**  
- Nightly or day-by-day staffing (headcount, evening vs day split).  
- `id`, `org_id`, `activation_recommendation_id` (optional), `entity_type`, `entity_id`, `plan_type` ('nightly'|'day_by_day'), `schedule_jsonb` (e.g. { "Mon": { "evening": 2, "day": 0 }, ... }), `created_at`, `updated_at`.

**assignment_decision_logs**  
- Audit log when a recommendation is accepted, overridden, or deferred.  
- `id`, `org_id`, `activation_recommendation_id`, `entity_type`, `entity_id`, `action` ('accepted'|'overridden'|'deferred'), `chosen_crew_id`, `recommended_crew_id`, `reason` (text), `created_by`, `created_at`.

### 2.2 Extended tables

**activation_recommendations** (extend)  
- Add: `route_fit_score` (int 0–100), `added_travel_minutes` (numeric), `recommended_cluster_id` (uuid → route_clusters), `nightly_staffing_split` (jsonb, e.g. day-by-day headcount and evening/day), `score_groups_jsonb` (capability_fit, capacity_fit, route_fit, risk_fit breakdown).

**geo_entities**  
- Allow `entity_type = 'facility'` so facility lat/lng can be stored in geo_entities (entity_id = facility_id).

### 2.3 Facility geo

- Use `geo_entities` with `entity_type = 'facility'` and `entity_id = facility_id` for facility lat/lng, or add a small `facility_geo` table (facility_id, lat, lng) if preferred. Route engine reads facility coordinates from one of these.

---

## 3. Scoring model (four groups)

- **Capability fit (0–100):** Weighted mix of operator_performance.total_score, crew_reliability_snapshots.reliability_score, and complaint penalty. Normalize to 0–100.
- **Capacity fit (0–100):** Headroom: 100 − (active/max)*100 for accounts and optionally sqft; clamp 0–100.
- **Route fit (0–100):** Composite of:  
  - Proximity to nearest assigned facility (closer = higher).  
  - Inverse of added drive time (less added time = higher).  
  - Compactness: distance from new account to crew’s route centroid (closer = higher).  
  - Cluster fit: 100 if account’s recommended cluster matches crew’s cluster, else lower.  
  - Service window match: 100 if same window, else 50.  
  Formula: weighted average of sub-scores, then clamp 0–100.
- **Risk fit (0–100):** Inverse of risk: e.g. 100 − (count of risk flags × 20), or 100 when no flags and lower when flags present.

**Weights (tunable):**  
- capability_fit: 0.30  
- capacity_fit: 0.25  
- route_fit: 0.30  
- risk_fit: 0.15  

**Outputs per candidate:**  
- capability_fit_score, capacity_fit_score, route_fit_score, risk_fit_score, final_score  
- route_fit_detail: added_travel_minutes, distance_to_nearest_miles, cluster_id (if any), service_window_match

---

## 4. Trigger / event design

- **New account activation:** On launch packet ready/sent_to_ops or when Ops opens launch-intake/[id], compute recommendation (including route fit); store in activation_recommendations.
- **Crew change activation:** When user requests crew change, compute recommendation for replacement crew; consider current route and cluster.
- **Recovery / restarted account:** Same as new account; entity_type/entity_id point to account or facility.
- **Scope expansion:** New facility or new service line; compute for new scope.
- **Recompute crew route profiles:** On service_assignment insert/update/delete (trigger or nightly job); or on demand when computing recommendation.
- **Assignment decision log:** When user accepts or overrides recommendation, insert into assignment_decision_logs.

---

## 5. Engine outputs (extended)

- Primary crew recommendation, backup crews, recommended supervisor  
- Recommended headcount, weekly labor hours  
- **Nightly/day-by-day staffing split** (e.g. Mon: 2 evening / 0 day; Tue: 2 evening / 0 day)  
- **Route fit score** (0–100)  
- **Added travel time** (minutes per visit or per week)  
- **Cluster recommendation** (route_cluster id and name)  
- Confidence score, risk flags  
- **Concise reasoning summary** (including route efficiency: “Adds ~12 min drive; fits North zone cluster.”)

---

## 6. Integration

- **Activations:** Launch-intake and activation flows call same engine; show route fit, added travel, cluster, and staffing split in UI.
- **Accounts:** Account detail or activation flow can show recommendation for expansion/restart.
- **Launch to Ops:** Launch packet payload (scope, frequency, days, window) feeds account_requirements and service profile.
- **LiDAR / account intelligence:** complexity_score, sqft, restrooms feed capability/capacity; geo from walkthrough can feed facility_geo.
- **Operator performance engine:** operator_performance, operator_capacity unchanged; used for capability and capacity fit.
- **Account risk engine:** account_risk_snapshots.recommended_backups can feed backup_crew_ids; risk_fit can incorporate account risk level.

---

## 7. File-level implementation plan

| File | Purpose |
|------|--------|
| `supabase/migrations/126_route_aware_assignments.sql` | route_clusters, crew_route_profiles, crew_capacity_snapshots, shift_staffing_plans, assignment_decision_logs; extend activation_recommendations; add facility to geo_entities entity_type. |
| `src/types/activation-recommendation.ts` | Extend with RouteFitDetail, ScoreGroups, nightly_staffing_split, recommended_cluster_id/name, route_fit_score, added_travel_minutes. |
| `src/lib/assignment-engine/route-fit.ts` | computeRouteFit(orgId, crewId, newAccountLat, newAccountLng, serviceWindow): distance to assigned facilities, centroid, added drive time, cluster fit, service window match; return RouteFitResult. |
| `src/lib/assignment-engine/score-groups.ts` | capabilityFitScore(), capacityFitScore(), routeFitScore(), riskFitScore(); combine into four-group weighted score. |
| `src/lib/assignment-engine/scoring.ts` | Refactor to use score-groups; call route-fit per crew; attach route_fit_score, added_travel_minutes, cluster to candidate; output four groups in candidate and in activation_recommendations.scores_jsonb. |
| `src/lib/assignment-engine/recommendation.ts` | Build nightly_staffing_split from requirements; set recommended_cluster_id from top crew’s cluster; persist route_fit_score, added_travel_minutes, score_groups_jsonb, nightly_staffing_split; optional: write assignment_decision_log on accept/override. |
| `src/lib/assignment-engine/crew-route-profile.ts` | getOrComputeCrewRouteProfile(orgId, crewId): from service_assignments + facility geo, compute centroid, facility_count, service_window; upsert crew_route_profiles. |
| API / UI | Activation recommendation API and AI card already return recommendation; extend to include route_fit_score, added_travel_minutes, cluster, nightly_staffing_split. |

---

## 8. QA plan

- **Route fit:** Crew with no assignments gets neutral route_fit (e.g. 50) or proximity-only; crew with nearby assignments gets higher route_fit and lower added_travel_minutes.
- **Four groups:** capability_fit, capacity_fit, route_fit, risk_fit all present in candidate and in stored scores_jsonb/score_groups_jsonb.
- **Cluster:** When route_clusters exist and a crew’s facilities belong to a cluster, recommendation can recommend that cluster; recommended_cluster_id stored.
- **Staffing split:** nightly_staffing_split reflects service_days and service_window from requirements.
- **Decision log:** When user accepts with recommended crew or overrides, assignment_decision_logs row created (if implemented).
- **Backward compatibility:** Existing activation_recommendations rows still valid; new columns nullable; engine works when geo or cluster data is missing.

---

## 9. Rollback

- New columns on activation_recommendations can be ignored by old clients.
- New tables can be dropped if needed; route-fit and score-groups can fall back to previous single-group scoring.

---

## 10. Phase 1 Implementation Summary (Done)

- **Migration 126:** route_clusters, crew_route_profiles, crew_capacity_snapshots, shift_staffing_plans, assignment_decision_logs; activation_recommendations extended with route_fit_score, added_travel_minutes, recommended_cluster_id, nightly_staffing_split, score_groups_jsonb; geo_entities entity_type extended to include 'facility'.
- **Types:** RouteFitDetail, ScoreGroups, NightlyStaffingSplit; CrewCandidateScore and ActivationRecommendationResult extended with route_fit, cluster, staffing split, score_groups.
- **route-fit.ts:** computeRouteFit(org_id, crew_id, account_lat, account_lng, service_window) → distance to assigned facilities, centroid, added_travel_minutes, route_fit_score, cluster_id/name, service_window_match.
- **score-groups.ts:** capabilityFitScore, capacityFitScore, routeFitScoreFromDetail, riskFitScore, combineScoreGroups with DEFAULT_WEIGHTS (0.3, 0.25, 0.3, 0.15).
- **scoring.ts:** When account_lat/account_lng present, uses four groups and route-fit; else legacy single-group weights.
- **recommendation.ts:** Builds nightly_staffing_split from requirements; sets route_fit_score, added_travel_minutes, recommended_cluster_id/name, score_groups; reasoning summary includes added travel and cluster; persist and getActivationRecommendation return new fields.
- **crew-route-profile.ts:** getOrComputeCrewRouteProfile(orgId, crewId) for backfilling crew_route_profiles (optional; route-fit works without it when facility geo exists).

**Note:** If migration 126 fails on geo_entities constraint (wrong name), find it with: `SELECT conname FROM pg_constraint WHERE conrelid = 'public.geo_entities'::regclass AND contype = 'c';` then `ALTER TABLE geo_entities DROP CONSTRAINT <conname>;` and re-add the CHECK including 'facility'.
