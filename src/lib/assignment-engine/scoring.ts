/**
 * Assignment engine — weighted scoring layer.
 * Uses four score groups when route-aware: capability, capacity, route, risk.
 * Falls back to legacy single-group weights when no account geo.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { distanceMiles, territoryProximityScoreFromDistanceMiles } from '@/lib/performance/distance';
import { computeRouteFit } from './route-fit';
import {
  capabilityFitScore,
  capacityFitScore,
  routeFitScoreFromDetail,
  riskFitScore,
  combineScoreGroups,
  DEFAULT_WEIGHTS,
} from './score-groups';
import type { CrewCandidateScore } from '@/types/activation-recommendation';
import type { AccountRequirementsInput } from '@/types/activation-recommendation';

/** Legacy weights when not using four groups (no account lat/lng). */
const LEGACY_WEIGHTS = {
  performance: 0.25,
  capacity: 0.2,
  proximity: 0.2,
  reliability: 0.15,
  complaint_penalty: 0.1,
};

export interface ScoringInput {
  org_id: string;
  /** Eligible crew IDs (from rules layer). */
  crew_ids: string[];
  /** Account/facility lat/lng for proximity (optional). */
  account_lat?: number | null;
  account_lng?: number | null;
  /** Optional requirements for labor/headcount estimate (not used in crew rank yet). */
  requirements?: AccountRequirementsInput | null;
}

/**
 * Get crew base lat/lng from geo_entities.
 */
async function getCrewBase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  crewId: string
): Promise<{ lat: number; lng: number } | null> {
  const { data } = await supabase
    .from('geo_entities')
    .select('lat, lng')
    .eq('org_id', orgId)
    .eq('entity_type', 'crew')
    .eq('entity_id', crewId)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .maybeSingle();
  const row = data as { lat: number; lng: number } | null;
  return row ?? null;
}

/**
 * Score and rank crews. Returns candidates with factor breakdown, sorted by final_score desc.
 */
export async function scoreCrews(input: ScoringInput): Promise<CrewCandidateScore[]> {
  const supabase = await createClient();
  const { org_id: orgId, crew_ids: crewIds, account_lat: accLat, account_lng: accLng } = input;
  if (crewIds.length === 0) return [];

  const [perfRows, capRows, relRows, crewRows, complaintCounts] = await Promise.all([
    supabase.from('operator_performance').select('operator_id, total_score, capacity_score, leadership_score').eq('org_id', orgId).eq('operator_type', 'crew').in('operator_id', crewIds),
    supabase.from('operator_capacity').select('operator_id, active_accounts, max_accounts, current_sqft, max_sqft').eq('org_id', orgId).eq('operator_type', 'crew').in('operator_id', crewIds),
    supabase.from('crew_reliability_snapshots').select('operator_id, reliability_score, shift_completion_rate').eq('org_id', orgId).eq('operator_type', 'crew').in('operator_id', crewIds),
    supabase.from('crews').select('id, name').eq('org_id', orgId).in('id', crewIds),
    supabase.from('account_complaints').select('operator_id').eq('org_id', orgId).eq('operator_type', 'crew').in('operator_id', crewIds).gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const perfByCrew = new Map<string, { total_score: number; capacity_score: number; leadership_score: number }>();
  for (const p of perfRows.data ?? []) {
    const r = p as { operator_id: string; total_score: number; capacity_score: number; leadership_score: number };
    perfByCrew.set(r.operator_id, { total_score: r.total_score, capacity_score: r.capacity_score ?? 100, leadership_score: r.leadership_score ?? 100 });
  }
  const capByCrew = new Map<string, { active: number; max: number; current_sqft: number; max_sqft: number }>();
  for (const c of capRows.data ?? []) {
    const r = c as { operator_id: string; active_accounts: number; max_accounts: number; current_sqft?: number; max_sqft?: number };
    capByCrew.set(r.operator_id, {
      active: r.active_accounts,
      max: r.max_accounts,
      current_sqft: r.current_sqft ?? 0,
      max_sqft: r.max_sqft ?? 0,
    });
  }
  const relByCrew = new Map<string, number>();
  for (const r of relRows.data ?? []) {
    const row = r as { operator_id: string; reliability_score?: number; shift_completion_rate?: number };
    relByCrew.set(row.operator_id, row.reliability_score ?? row.shift_completion_rate ?? 100);
  }
  const complaintsByCrew = new Map<string, number>();
  for (const c of complaintCounts.data ?? []) {
    const row = c as { operator_id: string };
    complaintsByCrew.set(row.operator_id, (complaintsByCrew.get(row.operator_id) ?? 0) + 1);
  }
  const crewNames = new Map<string, string>();
  for (const c of crewRows.data ?? []) {
    const row = c as { id: string; name: string };
    crewNames.set(row.id, row.name);
  }

  const useRouteAware = accLat != null && accLng != null;
  const requirements = input.requirements;
  const serviceWindow = requirements?.service_window ?? null;

  const candidates: CrewCandidateScore[] = [];

  for (const crewId of crewIds) {
    const perf = perfByCrew.get(crewId) ?? { total_score: 50, capacity_score: 100, leadership_score: 100 };
    const cap = capByCrew.get(crewId) ?? { active: 0, max: 0, current_sqft: 0, max_sqft: 0 };
    const reliability = relByCrew.get(crewId) ?? 100;
    const complaintCount = complaintsByCrew.get(crewId) ?? 0;
    const complaintPenalty = Math.min(100, Math.max(0, 100 - complaintCount * 15));

    let proximity = 100;
    let distance_miles: number | null = null;
    if (accLat != null && accLng != null) {
      const base = await getCrewBase(supabase, orgId, crewId);
      if (base) {
        distance_miles = distanceMiles(accLat, accLng, base.lat, base.lng);
        proximity = territoryProximityScoreFromDistanceMiles(distance_miles);
      }
    }

    const capacityScore = cap.max > 0 ? Math.max(0, 100 - (cap.active / cap.max) * 100) : 100;

    let route_fit_detail = null;
    let capability_fit: number;
    let capacity_fit: number;
    let route_fit: number;
    let risk_fit: number;
    let final_score: number;

    if (useRouteAware) {
      route_fit_detail = await computeRouteFit({
        org_id: orgId,
        crew_id: crewId,
        account_lat: accLat,
        account_lng: accLng,
        service_window: serviceWindow,
      });
      capability_fit = capabilityFitScore({
        performance_score: perf.total_score,
        reliability_score: reliability,
        complaint_penalty: complaintPenalty,
      });
      capacity_fit = capacityFitScore({
        active_accounts: cap.active,
        max_accounts: cap.max,
        current_sqft: cap.current_sqft,
        max_sqft: cap.max_sqft,
      });
      route_fit = routeFitScoreFromDetail(route_fit_detail);
      const hasBackup = crewIds.length >= 2;
      const nearCapacity = cap.max > 0 && cap.active >= cap.max - 1;
      const riskFlags: string[] = [];
      if (perf.total_score < 60) riskFlags.push('low_match_score');
      if (nearCapacity) riskFlags.push('crew_near_capacity');
      if (!hasBackup) riskFlags.push('no_backup_options');
      risk_fit = riskFitScore({ risk_flags: riskFlags, has_backup: hasBackup, near_capacity: nearCapacity });
      final_score = combineScoreGroups({
        capability_fit,
        capacity_fit,
        route_fit,
        risk_fit,
      });
    } else {
      capability_fit = perf.total_score;
      capacity_fit = capacityScore;
      route_fit = proximity;
      risk_fit = Math.min(100, complaintPenalty + (crewIds.length >= 2 ? 20 : 0));
      final_score =
        perf.total_score * LEGACY_WEIGHTS.performance +
        capacityScore * LEGACY_WEIGHTS.capacity +
        proximity * LEGACY_WEIGHTS.proximity +
        reliability * LEGACY_WEIGHTS.reliability +
        complaintPenalty * LEGACY_WEIGHTS.complaint_penalty;
    }

    candidates.push({
      crew_id: crewId,
      crew_name: crewNames.get(crewId) ?? crewId,
      performance_score: perf.total_score,
      capacity_score: capacityScore,
      proximity_score: proximity,
      reliability_score: reliability,
      complaint_penalty: complaintPenalty,
      final_score,
      distance_miles,
      active_accounts: cap.active,
      max_accounts: cap.max,
      capability_fit,
      capacity_fit,
      route_fit,
      risk_fit,
      route_fit_detail: route_fit_detail ?? undefined,
    });
  }

  candidates.sort((a, b) => b.final_score - a.final_score);
  return candidates;
}
