/**
 * Financial Health Dashboard — design system and thresholds.
 * Health states: GREEN (good), AMBER (watch), RED (at risk), NEUTRAL (labels).
 * Thresholds are v1 defaults; make configurable per org later.
 */

export type HealthState = 'green' | 'amber' | 'red' | 'neutral';

export const HEALTH_GREEN = 'green' as const;
export const HEALTH_AMBER = 'amber' as const;
export const HEALTH_RED = 'red' as const;
export const HEALTH_NEUTRAL = 'neutral' as const;

/** v1 default thresholds (configurable by org later) */
export interface HealthThresholds {
  grossMargin: { redMax: number; amberMax: number }; // %: <40 red, 40-55 amber, >55 green
  laborPctOfRevenue: { amberMin: number; redMin: number }; // %: <55 green, 55-65 amber, >65 red
  netProfit: { redMax: number; amberMax: number }; // %: <10 red, 10-20 amber, >20 green
  cashRunwayMonths: { redMax: number; amberMax: number }; // <2 red, 2-4 amber, >4 green
  arAvgDays: { amberMin: number; redMin: number }; // <=30 green, 31-45 amber, >45 red
  bidAccuracy: { redMax: number; amberMin: number; amberMax: number }; // <0.95 red, 0.95-1.05 amber, >1.05 green
}

export const DEFAULT_THRESHOLDS: HealthThresholds = {
  grossMargin: { redMax: 40, amberMax: 55 },
  laborPctOfRevenue: { amberMin: 55, redMin: 65 },
  netProfit: { redMax: 10, amberMax: 20 },
  cashRunwayMonths: { redMax: 2, amberMax: 4 },
  arAvgDays: { amberMin: 31, redMin: 45 },
  bidAccuracy: { redMax: 0.95, amberMin: 0.95, amberMax: 1.05 },
};

export function getGrossMarginHealth(
  pct: number | null | undefined,
  t = DEFAULT_THRESHOLDS.grossMargin
): HealthState {
  if (pct == null) return HEALTH_NEUTRAL;
  if (pct < t.redMax) return HEALTH_RED;
  if (pct <= t.amberMax) return HEALTH_AMBER;
  return HEALTH_GREEN;
}

export function getLaborPctHealth(
  pct: number | null | undefined,
  t = DEFAULT_THRESHOLDS.laborPctOfRevenue
): HealthState {
  if (pct == null) return HEALTH_NEUTRAL;
  if (pct >= t.redMin) return HEALTH_RED;
  if (pct >= t.amberMin) return HEALTH_AMBER;
  return HEALTH_GREEN;
}

export function getNetProfitHealth(
  pct: number | null | undefined,
  t = DEFAULT_THRESHOLDS.netProfit
): HealthState {
  if (pct == null) return HEALTH_NEUTRAL;
  if (pct < t.redMax) return HEALTH_RED;
  if (pct <= t.amberMax) return HEALTH_AMBER;
  return HEALTH_GREEN;
}

export function getCashRunwayHealth(
  months: number | null | undefined,
  t = DEFAULT_THRESHOLDS.cashRunwayMonths
): HealthState {
  if (months == null) return HEALTH_NEUTRAL;
  if (months < t.redMax) return HEALTH_RED;
  if (months <= t.amberMax) return HEALTH_AMBER;
  return HEALTH_GREEN;
}

export function getArAvgDaysHealth(
  days: number | null | undefined,
  t = DEFAULT_THRESHOLDS.arAvgDays
): HealthState {
  if (days == null) return HEALTH_NEUTRAL;
  if (days > t.redMin) return HEALTH_RED;
  if (days >= t.amberMin) return HEALTH_AMBER;
  return HEALTH_GREEN;
}

export function getBidAccuracyHealth(
  ratio: number | null | undefined,
  t = DEFAULT_THRESHOLDS.bidAccuracy
): HealthState {
  if (ratio == null) return HEALTH_NEUTRAL;
  if (ratio < t.redMax) return HEALTH_RED;
  if (ratio >= t.amberMin && ratio <= t.amberMax) return HEALTH_AMBER;
  return HEALTH_GREEN;
}

/** Tailwind/CSS class for health (border + dot) */
export function healthBorderClass(state: HealthState): string {
  switch (state) {
    case 'green':
      return 'border-health-green';
    case 'amber':
      return 'border-health-amber';
    case 'red':
      return 'border-health-red';
    default:
      return 'border-border';
  }
}

export function healthBgClass(state: HealthState): string {
  switch (state) {
    case 'green':
      return 'bg-health-green';
    case 'amber':
      return 'bg-health-amber';
    case 'red':
      return 'bg-health-red';
    default:
      return 'bg-muted';
  }
}

export function healthTextClass(state: HealthState): string {
  switch (state) {
    case 'green':
      return 'text-health-green';
    case 'amber':
      return 'text-health-amber';
    case 'red':
      return 'text-health-red';
    default:
      return 'text-muted-foreground';
  }
}

/** Bear Health Score: 0–100 composite. 80+ green, 60–79 amber, 0–59 red */
export const BEAR_SCORE_WEIGHTS = {
  grossMargin: 25,
  netProfit: 20,
  laborPct: 20,
  cashRunway: 15,
  arAvgDays: 10,
  bidAccuracy: 10,
} as const;

export function getBearScoreHealth(score: number): HealthState {
  if (score >= 80) return HEALTH_GREEN;
  if (score >= 60) return HEALTH_AMBER;
  return HEALTH_RED;
}

/** Compute 0–100 Bear Health Score from component metrics (normalized 0–100 each) */
export function computeBearScore(components: {
  grossMargin: number;
  netProfit: number;
  laborPct: number;
  cashRunway: number;
  arAvgDays: number;
  bidAccuracy: number;
}): number {
  const w = BEAR_SCORE_WEIGHTS;
  return Math.round(
    (components.grossMargin * w.grossMargin +
      components.netProfit * w.netProfit +
      components.laborPct * w.laborPct +
      components.cashRunway * w.cashRunway +
      components.arAvgDays * w.arAvgDays +
      components.bidAccuracy * w.bidAccuracy) /
      100
  );
}

/** Convert raw metrics to 0–100 component scores for Bear Score */
export function healthStateToScore(state: HealthState): number {
  switch (state) {
    case 'green':
      return 100;
    case 'amber':
      return 65;
    case 'red':
      return 25;
    default:
      return 50;
  }
}
