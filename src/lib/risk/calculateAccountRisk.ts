/**
 * Account risk scoring: aggregates QC, missed tasks, complaints, operator performance
 * into a 0..100 risk score and reasons. Used by risk cron and on-demand.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AccountRiskMetrics {
  qc_avg_30: number;
  qc_delta_30: number;
  missed_rate_7: number;
  complaints_30: number;
  response_time_score?: number;
  operator_performance_score: number;
}

export interface AccountRiskResult {
  risk_score: number;
  risk_level: RiskLevel;
  reasons: string[];
  metrics: AccountRiskMetrics;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function riskLevelFromScore(score: number): RiskLevel {
  if (score <= 24) return 'low';
  if (score <= 49) return 'medium';
  if (score <= 74) return 'high';
  return 'critical';
}

/**
 * Compute risk score (0..100, higher = worse) and reasons from metrics.
 * Formula:
 *   (max(0, -qc_delta_30) * 1.5) +
 *   ((100 - qc_avg_30) * 0.4) +
 *   (missed_rate_7 * 60) +
 *   (complaints_30 * 8) +
 *   (max(0, 70 - operator_performance_score) * 0.5)
 * Clamped 0..100.
 */
export function computeRiskFromMetrics(metrics: AccountRiskMetrics): AccountRiskResult {
  const qcDecline = Math.max(0, -metrics.qc_delta_30) * 1.5;
  const qcLow = (100 - metrics.qc_avg_30) * 0.4;
  const missed = metrics.missed_rate_7 * 60;
  const complaints = metrics.complaints_30 * 8;
  const opUnder = Math.max(0, 70 - metrics.operator_performance_score) * 0.5;
  let risk = qcDecline + qcLow + missed + complaints + opUnder;
  risk = clamp(risk, 0, 100);

  const reasons: string[] = [];
  if (metrics.qc_delta_30 < -5) reasons.push('QC declining');
  if (metrics.qc_avg_30 < 85) reasons.push('Low QC average');
  if (metrics.missed_rate_7 > 0.05) reasons.push('Missed tasks rising');
  if (metrics.complaints_30 >= 3) reasons.push('High complaint volume');
  if (metrics.operator_performance_score < 60) reasons.push('Operator underperforming');

  return {
    risk_score: Math.round(risk),
    risk_level: riskLevelFromScore(risk),
    reasons,
    metrics,
  };
}

/**
 * Load metrics for an account and its current operator (crew from primary facility).
 * Uses site_health (last 30d notion via last_inspection_score), missed_shifts_7d,
 * account_complaints, and operator_performance.
 */
export async function loadAccountRiskMetrics(
  supabase: SupabaseClient,
  orgId: string,
  accountId: string
): Promise<{ metrics: AccountRiskMetrics; operator_type: 'crew' | 'franchisee'; operator_id: string } | null> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: facilities } = await supabase
    .from('facilities')
    .select('id')
    .eq('org_id', orgId)
    .eq('account_id', accountId);
  const facilityIds = (facilities ?? []).map((f: { id: string }) => f.id);
  if (facilityIds.length === 0) return null;

  let operator_type: 'crew' | 'franchisee' = 'crew';
  let operator_id = '';

  const { data: assignment } = await supabase
    .from('crew_assignments')
    .select('crew_id')
    .in('facility_id', facilityIds)
    .limit(1)
    .maybeSingle();
  if (assignment) {
    operator_type = 'crew';
    operator_id = (assignment as { crew_id: string }).crew_id;
  }
  if (!operator_id) {
    return null;
  }

  let qcSum = 0;
  let qcCount = 0;
  let missedTotal = 0;
  let taskDenom = 0;
  for (const fid of facilityIds) {
    const { data: sh } = await supabase
      .from('site_health')
      .select('last_inspection_score, missed_shifts_7d')
      .eq('site_id', fid)
      .maybeSingle();
    if (sh) {
      const s = sh as { last_inspection_score?: number | null; missed_shifts_7d?: number };
      if (s.last_inspection_score != null) {
        qcSum += s.last_inspection_score;
        qcCount += 1;
      }
      missedTotal += s.missed_shifts_7d ?? 0;
    }
    taskDenom += 1;
  }
  const qc_avg_30 = qcCount > 0 ? qcSum / qcCount : 100;
  const missed_rate_7 = taskDenom > 0 ? Math.min(1, missedTotal / (7 * taskDenom)) : 0;

  const { count: complaintsCount } = await supabase
    .from('account_complaints')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('account_id', accountId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  const complaints_30 = complaintsCount ?? 0;

  const { data: perf } = await supabase
    .from('operator_performance')
    .select('total_score')
    .eq('org_id', orgId)
    .eq('operator_type', operator_type)
    .eq('operator_id', operator_id)
    .maybeSingle();
  const operator_performance_score = (perf as { total_score?: number } | null)?.total_score ?? 70;

  const metrics: AccountRiskMetrics = {
    qc_avg_30,
    qc_delta_30: 0,
    missed_rate_7,
    complaints_30,
    operator_performance_score,
  };
  return { metrics, operator_type, operator_id };
}

/**
 * Calculate risk for one account and return result (no DB write).
 */
export async function calculateAccountRisk(
  supabase: SupabaseClient,
  orgId: string,
  accountId: string
): Promise<{ result: AccountRiskResult; operator_type: 'crew' | 'franchisee'; operator_id: string } | null> {
  const loaded = await loadAccountRiskMetrics(supabase, orgId, accountId);
  if (!loaded) return null;
  const result = computeRiskFromMetrics(loaded.metrics);
  return {
    result,
    operator_type: loaded.operator_type,
    operator_id: loaded.operator_id,
  };
}
