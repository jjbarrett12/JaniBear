/**
 * KPI Metrics — types and constants for Sales, Operations, and Franchisor (KMI) dashboards.
 * Franchisor KPIs are outcome-only (review/self-reported); no labor control.
 */

export const KMI_TOTAL_REGIONS = 47;

/** Weights for Key Metric Index (KMI). Lower KMI = better. Weighted score = nationalRank × weight. */
export const KMI_WEIGHTS = {
  accountProposalClosedYtd: 0.15,
  grossMonthlyBillingGrowthYtd: 0.2,
  avgAccountProposalClosedYtd: 0.2,
  avgGrossBillingsPerUnit: 0.2,
  grossMonthlyBillingsEom: 0.1,
  attritionPctYtd: 0.15,
} as const;

export type KmiKpiKey = keyof typeof KMI_WEIGHTS;

/** Single KMI row: value, rankings, weight, weighted score */
export interface KmiKpiRow {
  id: KmiKpiKey;
  label: string;
  currentValue: string; // e.g. "$77,734", "0.8%"
  previousMonthRank: number;
  nationalRank: number;
  weight: number;
  weightedScore: number;
}

/** Standalone KPI (e.g. Account Sales Closing Rate) shown below KMI table */
export interface StandaloneKpiRow {
  id: string;
  label: string;
  currentValue: string;
  previousMonthRank: number;
  nationalRank: number;
}

/** Compute weighted score for KMI: rank × weight */
export function computeWeightedScore(rank: number, weight: number): number {
  return Math.round(rank * weight * 100) / 100;
}

/** Compute total KMI from weighted scores */
export function computeKmi(weightedScores: number[]): number {
  return Math.round(weightedScores.reduce((a, b) => a + b, 0) * 100) / 100;
}

/** Customer/operator KPI tile (sales or operations) */
export interface KpiTileData {
  label: string;
  value: string | number;
  delta?: number;
  sparkline?: number[];
  health?: 'green' | 'amber' | 'red' | 'neutral';
  /** Optional: national or regional rank for context (e.g. rank 4 of 47) */
  rank?: number;
  rankOutOf?: number;
  /** Optional: benchmark text (e.g. "Target: 95%") for strategic dashboard */
  targetBenchmark?: string;
}

/** Strategic dashboard: health includes Opportunity (blue) */
export type StrategicHealth = 'green' | 'amber' | 'red' | 'blue' | 'neutral';

/** Executive Snapshot / large card: primary metric, change vs prior period, target, sparkline */
export interface ExecutiveCardData {
  id: string;
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  targetBenchmark?: string;
  sparkline?: number[];
  health?: StrategicHealth;
}

/** Attention Required: one alert type with count and optional link */
export interface AttentionAlert {
  id: string;
  label: string;
  count: number;
  href?: string;
  severity?: 'warning' | 'critical';
}

/** Timeframe for strategic dashboard */
export type StrategicTimeframe = '30d' | '90d' | 'ytd';
