/**
 * Four score groups: capability fit, capacity fit, route fit, risk fit.
 * Combined with configurable weights for final candidate score.
 */

import type { RouteFitDetail } from '@/types/activation-recommendation';
import type { ScoreGroups } from '@/types/activation-recommendation';

export const DEFAULT_WEIGHTS = {
  capability_fit: 0.3,
  capacity_fit: 0.25,
  route_fit: 0.3,
  risk_fit: 0.15,
} as const;

/**
 * Capability fit 0–100: performance, reliability, complaint penalty.
 */
export function capabilityFitScore(params: {
  performance_score: number;
  reliability_score: number;
  complaint_penalty: number;
}): number {
  const { performance_score, reliability_score, complaint_penalty } = params;
  const avg = (performance_score * 0.5 + reliability_score * 0.3 + complaint_penalty * 0.2);
  return Math.max(0, Math.min(100, Math.round(avg)));
}

/**
 * Capacity fit 0–100: headroom (active vs max accounts and optionally sqft).
 */
export function capacityFitScore(params: {
  active_accounts: number;
  max_accounts: number;
  current_sqft?: number;
  max_sqft?: number;
}): number {
  const { active_accounts, max_accounts, current_sqft = 0, max_sqft = 0 } = params;
  let score = 100;
  if (max_accounts > 0) {
    const headroom = 100 - (active_accounts / max_accounts) * 100;
    score = Math.min(score, Math.max(0, headroom));
  }
  if (max_sqft != null && max_sqft > 0 && current_sqft != null) {
    const sqftHeadroom = 100 - (current_sqft / max_sqft) * 100;
    score = Math.min(score, Math.max(0, sqftHeadroom));
  }
  return Math.round(score);
}

/**
 * Route fit 0–100: use RouteFitDetail.route_fit_score; adjust for service_window_match if desired.
 */
export function routeFitScoreFromDetail(detail: RouteFitDetail | null | undefined): number {
  if (!detail) return 50; // neutral when no route data
  let s = detail.route_fit_score;
  if (!detail.service_window_match) s = Math.max(0, s - 15);
  return Math.max(0, Math.min(100, s));
}

/**
 * Risk fit 0–100: inverse of risk (fewer flags = higher score).
 */
export function riskFitScore(params: {
  risk_flags: string[];
  has_backup: boolean;
  near_capacity: boolean;
}): number {
  const { risk_flags, has_backup, near_capacity } = params;
  let s = 100;
  if (!has_backup) s -= 25;
  if (near_capacity) s -= 20;
  s -= risk_flags.length * 15;
  return Math.max(0, Math.min(100, s));
}

/**
 * Combine four groups into final score 0–100 using weights.
 */
export function combineScoreGroups(
  groups: ScoreGroups,
  weights: { capability_fit: number; capacity_fit: number; route_fit: number; risk_fit: number } = DEFAULT_WEIGHTS
): number {
  const w = weights;
  const raw =
    groups.capability_fit * w.capability_fit +
    groups.capacity_fit * w.capacity_fit +
    groups.route_fit * w.route_fit +
    groups.risk_fit * w.risk_fit;
  return Math.max(0, Math.min(100, Math.round(raw)));
}
