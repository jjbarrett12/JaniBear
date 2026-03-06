/**
 * Smart account allocation: suggest top operators (crew | franchisee) for a new account
 * based on performance score, capacity, and territory proximity.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { distanceMiles, territoryProximityScoreFromDistanceMiles } from '@/lib/performance/distance';
import { isRestricted } from '@/lib/performance/calculateOperatorScore';

export interface SuggestOperatorInput {
  org_id: string;
  account_lat: number;
  account_lng: number;
  territory_id?: string | null;
  sqft?: number | null;
  vertical?: string | null;
  /** Min total_score to be eligible (default 60). */
  min_performance_threshold?: number;
  /** Min capacity_score (default 20). */
  min_capacity?: number;
  /** Max results (default 5). */
  limit?: number;
}

export interface SuggestedOperator {
  operator_type: 'crew' | 'franchisee';
  operator_id: string;
  operator_name: string;
  performance_score: number;
  capacity_score: number;
  territory_proximity_score: number;
  /** Final ranking score (weighted). */
  final_score: number;
  /** Distance in miles from operator base to account (if available). */
  distance_miles?: number | null;
  active_accounts: number;
  max_accounts: number;
}

const DEFAULT_MIN_PERFORMANCE = 60;
const DEFAULT_MIN_CAPACITY = 20;
const DEFAULT_LIMIT = 5;
const WEIGHTS = { performance: 0.6, proximity: 0.2, capacity: 0.2 };

/**
 * Get operator base lat/lng from geo_entities (crew or franchisee).
 */
async function getOperatorBase(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  operatorType: 'crew' | 'franchisee',
  operatorId: string
): Promise<{ lat: number; lng: number } | null> {
  const entityType = operatorType === 'crew' ? 'crew' : 'franchisee';
  const { data } = await supabase
    .from('geo_entities')
    .select('lat, lng')
    .eq('org_id', orgId)
    .eq('entity_type', entityType)
    .eq('entity_id', operatorId)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .maybeSingle();
  const row = data as { lat: number; lng: number } | null;
  return row ? { lat: row.lat, lng: row.lng } : null;
}

/**
 * Find operators that have at least one facility in the given territory (for territory filter).
 */
async function getOperatorIdsInTerritory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  territoryId: string
): Promise<{ crewIds: string[]; franchiseeIds: string[] }> {
  const crewIds: string[] = [];
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id')
    .eq('org_id', orgId)
    .eq('territory_id', territoryId);
  const facilityIds = (facilities ?? []).map((f: { id: string }) => f.id);
  if (facilityIds.length === 0) return { crewIds, franchiseeIds: [] };
  const { data: assignments } = await supabase
    .from('crew_assignments')
    .select('crew_id')
    .in('facility_id', facilityIds);
  const set = new Set((assignments ?? []).map((a: { crew_id: string }) => a.crew_id));
  crewIds.push(...set);
  return { crewIds, franchiseeIds: [] };
}

/**
 * Suggest top operators for a new account. Returns up to limit candidates sorted by final_score desc.
 */
export async function suggestOperator(input: SuggestOperatorInput): Promise<SuggestedOperator[]> {
  const supabase = await createClient();
  const {
    org_id: orgId,
    account_lat: accLat,
    account_lng: accLng,
    territory_id: territoryId,
    min_performance_threshold = DEFAULT_MIN_PERFORMANCE,
    min_capacity = DEFAULT_MIN_CAPACITY,
    limit = DEFAULT_LIMIT,
  } = input;

  let territoryCrewIds: string[] = [];
  let territoryFranchiseeIds: string[] = [];
  if (territoryId) {
    const t = await getOperatorIdsInTerritory(supabase, orgId, territoryId);
    territoryCrewIds = t.crewIds;
    territoryFranchiseeIds = t.franchiseeIds;
  }

  const { data: perfs } = await supabase
    .from('operator_performance')
    .select('operator_type, operator_id, total_score, capacity_score')
    .eq('org_id', orgId);
  const { data: caps } = await supabase
    .from('operator_capacity')
    .select('operator_type, operator_id, active_accounts, max_accounts')
    .eq('org_id', orgId);

  const capByKey = new Map<string, { active_accounts: number; max_accounts: number }>();
  for (const c of caps ?? []) {
    const row = c as { operator_type: string; operator_id: string; active_accounts: number; max_accounts: number };
    capByKey.set(`${row.operator_type}:${row.operator_id}`, {
      active_accounts: row.active_accounts,
      max_accounts: row.max_accounts,
    });
  }

  const candidates: SuggestedOperator[] = [];

  for (const p of perfs ?? []) {
    const row = p as { operator_type: 'crew' | 'franchisee'; operator_id: string; total_score: number; capacity_score: number };
    if (isRestricted(row.total_score)) continue;
    if (row.total_score < min_performance_threshold) continue;
    if (row.capacity_score < min_capacity) continue;
    if (territoryId) {
      if (row.operator_type === 'crew' && !territoryCrewIds.includes(row.operator_id)) continue;
      if (row.operator_type === 'franchisee' && !territoryFranchiseeIds.includes(row.operator_id)) continue;
    }
    const cap = capByKey.get(`${row.operator_type}:${row.operator_id}`) ?? {
      active_accounts: 0,
      max_accounts: 0,
    };
    let proximity = 100;
    let distance_miles: number | null = null;
    const base = await getOperatorBase(supabase, orgId, row.operator_type, row.operator_id);
    if (base) {
      distance_miles = distanceMiles(accLat, accLng, base.lat, base.lng);
      proximity = territoryProximityScoreFromDistanceMiles(distance_miles);
    }
    const final_score =
      row.total_score * WEIGHTS.performance +
      proximity * WEIGHTS.proximity +
      row.capacity_score * WEIGHTS.capacity;
    let operator_name = row.operator_id;
    if (row.operator_type === 'crew') {
      const { data: crew } = await supabase.from('crews').select('name').eq('id', row.operator_id).single();
      operator_name = (crew as { name?: string } | null)?.name ?? row.operator_id;
    } else {
      const { data: org } = await supabase.from('organizations').select('name').eq('id', row.operator_id).single();
      operator_name = (org as { name?: string } | null)?.name ?? row.operator_id;
    }
    candidates.push({
      operator_type: row.operator_type,
      operator_id: row.operator_id,
      operator_name,
      performance_score: row.total_score,
      capacity_score: row.capacity_score,
      territory_proximity_score: proximity,
      final_score,
      distance_miles,
      active_accounts: cap.active_accounts,
      max_accounts: cap.max_accounts,
    });
  }

  candidates.sort((a, b) => b.final_score - a.final_score);
  return candidates.slice(0, limit);
}
