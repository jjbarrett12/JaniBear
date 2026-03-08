/**
 * Assignment engine — rules layer: eligibility filter for crew assignment.
 * Excludes crews that are over capacity, restricted (low performance), or out of territory.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isRestricted } from '@/lib/performance/calculateOperatorScore';

export interface EligibilityInput {
  org_id: string;
  territory_id?: string | null;
  /** Min total_score to be eligible (default 50, same as isRestricted threshold). */
  min_performance_threshold?: number;
  /** Min capacity headroom: (max_accounts - active_accounts) must be >= this (default 1). */
  min_capacity_headroom?: number;
}

export interface EligibleCrew {
  crew_id: string;
  crew_name: string;
  operator_type: 'crew';
  /** Passed rules (capacity, performance, territory). */
  passed: boolean;
  fail_reason?: string;
}

const DEFAULT_MIN_PERFORMANCE = 50;
const DEFAULT_MIN_HEADROOM = 1;

/**
 * Get crew IDs that are in the given territory (via facility assignments).
 */
async function getCrewIdsInTerritory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  territoryId: string
): Promise<string[]> {
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id')
    .eq('org_id', orgId)
    .eq('territory_id', territoryId);
  const facilityIds = (facilities ?? []).map((f: { id: string }) => f.id);
  if (facilityIds.length === 0) return [];
  const { data: assignments } = await supabase
    .from('crew_assignments')
    .select('crew_id')
    .in('facility_id', facilityIds);
  const set = new Set((assignments ?? []).map((a: { crew_id: string }) => a.crew_id));
  return [...set];
}

/**
 * Return list of eligible crews (crew type only for now). Optionally filter by territory.
 */
export async function getEligibleCrews(input: EligibilityInput): Promise<EligibleCrew[]> {
  const supabase = await createClient();
  const {
    org_id: orgId,
    territory_id: territoryId,
    min_performance_threshold = DEFAULT_MIN_PERFORMANCE,
    min_capacity_headroom = DEFAULT_MIN_HEADROOM,
  } = input;

  let territoryCrewIds: string[] | null = null;
  if (territoryId) {
    territoryCrewIds = await getCrewIdsInTerritory(supabase, orgId, territoryId);
    if (territoryCrewIds.length === 0) return [];
  }

  const [{ data: crews }, { data: perfs }, { data: caps }] = await Promise.all([
    supabase.from('crews').select('id, name').eq('org_id', orgId).order('name'),
    supabase.from('operator_performance').select('operator_type, operator_id, total_score').eq('org_id', orgId).eq('operator_type', 'crew'),
    supabase.from('operator_capacity').select('operator_type, operator_id, active_accounts, max_accounts').eq('org_id', orgId).eq('operator_type', 'crew'),
  ]);

  const perfByCrew = new Map<string, number>();
  for (const p of perfs ?? []) {
    const row = p as { operator_id: string; total_score: number };
    perfByCrew.set(row.operator_id, row.total_score);
  }
  const capByCrew = new Map<string, { active: number; max: number }>();
  for (const c of caps ?? []) {
    const row = c as { operator_id: string; active_accounts: number; max_accounts: number };
    capByCrew.set(row.operator_id, { active: row.active_accounts, max: row.max_accounts });
  }

  const result: EligibleCrew[] = [];
  for (const crew of crews ?? []) {
    const c = crew as { id: string; name: string };
    if (territoryCrewIds && !territoryCrewIds.includes(c.id)) {
      result.push({ crew_id: c.id, crew_name: c.name, operator_type: 'crew', passed: false, fail_reason: 'outside_territory' });
      continue;
    }
    const score = perfByCrew.get(c.id) ?? 0;
    if (isRestricted(score) || score < min_performance_threshold) {
      result.push({ crew_id: c.id, crew_name: c.name, operator_type: 'crew', passed: false, fail_reason: 'low_performance' });
      continue;
    }
    const cap = capByCrew.get(c.id) ?? { active: 0, max: 0 };
    const headroom = cap.max - cap.active;
    if (cap.max > 0 && headroom < min_capacity_headroom) {
      result.push({ crew_id: c.id, crew_name: c.name, operator_type: 'crew', passed: false, fail_reason: 'at_capacity' });
      continue;
    }
    result.push({ crew_id: c.id, crew_name: c.name, operator_type: 'crew', passed: true });
  }
  return result;
}
