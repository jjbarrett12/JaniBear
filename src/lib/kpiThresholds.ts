/**
 * KPI Dashboard — UI thresholds for status (healthy / watch / critical).
 * Used when API does not provide status; safe defaults for presentation.
 * No schema changes; constants only.
 */

export type KpiStatus = 'healthy' | 'watch' | 'critical' | 'neutral';

/** Default targets for status derivation (value >= target => healthy, etc.) */
export const KPI_TARGETS = {
  retentionPct: 95,
  inspectionScore: 92,
  slaCompliancePct: 95,
  winRatePct: 50,
  issueRecurrencePct: 10,
} as const;

/** Tolerance below target for "watch" (e.g. target 95, tolerance 3 => watch if 92–94) */
export const KPI_TOLERANCE = 3;

/**
 * Derive status from numeric value and target.
 * healthy: value >= target
 * watch: value >= target - tolerance
 * critical: else
 */
export function getStatusForTarget(
  value: number | null | undefined,
  target: number,
  tolerance: number = KPI_TOLERANCE,
  higherIsBetter: boolean = true
): KpiStatus {
  if (value == null) return 'neutral';
  if (higherIsBetter) {
    if (value >= target) return 'healthy';
    if (value >= target - tolerance) return 'watch';
    return 'critical';
  }
  // lower is better (e.g. issue recurrence)
  if (value <= target) return 'healthy';
  if (value <= target + tolerance) return 'watch';
  return 'critical';
}
