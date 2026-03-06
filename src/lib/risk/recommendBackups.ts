/**
 * Recommend backup crew/franchisee for at-risk accounts using suggestOperator
 * with stricter constraints (min performance 70, same territory when configured).
 */

import 'server-only';
import { suggestOperator } from '@/lib/accounts/suggestOperator';

export interface BackupRecommendation {
  operator_type: 'crew' | 'franchisee';
  operator_id: string;
  operator_name: string;
  score: number;
  distance_miles?: number | null;
  capacity_score: number;
  rationale: string[];
}

export interface RecommendBackupsInput {
  org_id: string;
  account_lat: number;
  account_lng: number;
  territory_id?: string | null;
  min_backup_score?: number;
  require_same_territory?: boolean;
  limit?: number;
}

/**
 * Return top 3 backup operators with rationale for risk snapshot.
 */
export async function recommendBackups(input: RecommendBackupsInput): Promise<BackupRecommendation[]> {
  const {
    org_id,
    account_lat,
    account_lng,
    territory_id,
    min_backup_score = 70,
    require_same_territory = true,
    limit = 3,
  } = input;

  const list = await suggestOperator({
    org_id,
    account_lat,
    account_lng,
    territory_id: require_same_territory ? territory_id ?? undefined : undefined,
    min_performance_threshold: min_backup_score,
    min_capacity: 20,
    limit,
  });

  return list.map((op) => {
    const rationale: string[] = [];
    if (op.performance_score >= 85) rationale.push('High QC consistency');
    else if (op.performance_score >= 70) rationale.push('Solid performance');
    if (op.capacity_score >= 50) rationale.push(`Capacity ${Math.round(op.capacity_score)}% remaining`);
    if (op.distance_miles != null) rationale.push(`${op.distance_miles.toFixed(1)} miles away`);
    if (rationale.length === 0) rationale.push('Available backup');
    return {
      operator_type: op.operator_type,
      operator_id: op.operator_id,
      operator_name: op.operator_name,
      score: op.final_score,
      distance_miles: op.distance_miles,
      capacity_score: op.capacity_score,
      rationale,
    };
  });
}
