/**
 * Recommend backup operators for a shift coverage gap from backup pool.
 * Scores by performance * 0.5 + distance * 0.3 + capacity * 0.2; returns top 3.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { suggestOperator } from '@/lib/accounts/suggestOperator';

export interface ShiftBackupRecommendation {
  operator_type: 'crew' | 'franchisee';
  operator_id: string;
  operator_name: string;
  score: number;
  performance_score: number;
  distance_score: number;
  capacity_score: number;
}

export interface RecommendShiftBackupInput {
  org_id: string;
  facility_id: string;
  /** Territory id for pool lookup and same-territory filter. */
  territory_id?: string | null;
  /** Lat/lng of facility for distance scoring. */
  facility_lat: number;
  facility_lng: number;
  /** Shift date to exclude already-scheduled operators. */
  shift_date: string;
  /** Optional: exclude this operator (primary who is out). */
  exclude_operator_type?: 'crew' | 'franchisee' | null;
  exclude_operator_id?: string | null;
  limit?: number;
}

const WEIGHTS = { performance: 0.5, distance: 0.3, capacity: 0.2 };
const MIN_PERFORMANCE = 70;

/**
 * Return top 3 backup operators for a shift: from backup pool, filtered by
 * capacity (backup shifts this week < max), not already scheduled this shift,
 * performance_score >= 70. Score = performance*0.5 + distance*0.3 + capacity*0.2.
 */
export async function recommendShiftBackup(
  input: RecommendShiftBackupInput
): Promise<ShiftBackupRecommendation[]> {
  const {
    org_id: orgId,
    facility_id: facilityId,
    territory_id: territoryId,
    facility_lat: lat,
    facility_lng: lng,
    shift_date: shiftDate,
    exclude_operator_type,
    exclude_operator_id,
    limit = 3,
  } = input;

  const supabase = await createClient();

  const list = await suggestOperator({
    org_id: orgId,
    account_lat: lat,
    account_lng: lng,
    territory_id: territoryId ?? undefined,
    min_performance_threshold: MIN_PERFORMANCE,
    min_capacity: 20,
    limit: 10,
  });

  const excludeKey = exclude_operator_id
    ? `${exclude_operator_type ?? 'crew'}:${exclude_operator_id}`
    : null;
  let filtered = list.filter(
    (op) => !excludeKey || `${op.operator_type}:${op.operator_id}` !== excludeKey
  );

  let poolIds: string[] = [];
  const poolOperatorIds = new Set<string>();
  if (territoryId) {
    const { data: pools } = await supabase
      .from('backup_pools')
      .select('id')
      .eq('org_id', orgId)
      .eq('territory_id', territoryId);
    if (pools?.length) {
      poolIds = (pools as { id: string }[]).map((p) => p.id);
      const { data: members } = await supabase
        .from('backup_pool_members')
        .select('operator_type, operator_id, max_backup_shifts_per_week')
        .in('pool_id', poolIds);
      for (const m of members ?? []) {
        const row = m as { operator_type: string; operator_id: string };
        poolOperatorIds.add(`${row.operator_type}:${row.operator_id}`);
      }
    }
  }

  if (poolOperatorIds.size > 0) {
    filtered = filtered.filter((op) => poolOperatorIds.has(`${op.operator_type}:${op.operator_id}`));
  }

  const startOfWeek = new Date(shiftDate);
  startOfWeek.setDate(startOfWeek.getDate() - new Date(shiftDate).getDay());
  const weekStart = startOfWeek.toISOString().slice(0, 10);
  const { data: backupCounts } = await supabase
    .from('shift_coverage')
    .select('backup_operator_type, backup_operator_id')
    .eq('org_id', orgId)
    .eq('coverage_status', 'backup_assigned')
    .gte('shift_date', weekStart)
    .lte('shift_date', shiftDate);
  const backupCountByKey = new Map<string, number>();
  for (const row of backupCounts ?? []) {
    const r = row as { backup_operator_type?: string | null; backup_operator_id?: string | null };
    if (r.backup_operator_id && r.backup_operator_type) {
      const key = `${r.backup_operator_type}:${r.backup_operator_id}`;
      backupCountByKey.set(key, (backupCountByKey.get(key) ?? 0) + 1);
    }
  }
  const maxPerOperator = new Map<string, number>();
  if (poolIds.length > 0) {
    const { data: memberLimits } = await supabase
      .from('backup_pool_members')
      .select('operator_type, operator_id, max_backup_shifts_per_week')
      .in('pool_id', poolIds);
    for (const m of memberLimits ?? []) {
      const row = m as { operator_type: string; operator_id: string; max_backup_shifts_per_week: number };
      maxPerOperator.set(`${row.operator_type}:${row.operator_id}`, row.max_backup_shifts_per_week);
    }
  }
  filtered = filtered.filter((op) => {
    const key = `${op.operator_type}:${op.operator_id}`;
    const max = maxPerOperator.get(key) ?? 3;
    const count = backupCountByKey.get(key) ?? 0;
    return count < max;
  });

  const distanceScore = (op: { territory_proximity_score?: number }) =>
    op.territory_proximity_score ?? 0;
  const scored = filtered.map((op) => ({
    operator_type: op.operator_type,
    operator_id: op.operator_id,
    operator_name: op.operator_name,
    performance_score: op.performance_score,
    distance_score: distanceScore(op),
    capacity_score: op.capacity_score,
    score:
      op.performance_score * WEIGHTS.performance +
      distanceScore(op) * WEIGHTS.distance +
      op.capacity_score * WEIGHTS.capacity,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
