/**
 * Seat and LiDAR pricing (env-configurable with defaults).
 * All amounts in USD cents per seat per month unless noted.
 */
export const SEAT_PLAN_KEYS = [
  'cub',
  'super_cub',
  'grizzly',
  'super_grizzly',
  'kodiak',
  'super_kodiak',
] as const;

export type SeatPlanKey = (typeof SEAT_PLAN_KEYS)[number];

export const LIDAR_TIERS = ['none', 'starter', 'unlimited'] as const;
export type LidarTier = (typeof LIDAR_TIERS)[number];

const DEFAULT_PRICES_CENTS: Record<SeatPlanKey, number> = {
  cub: 900,           // $9
  super_cub: 1500,    // $15
  grizzly: 7900,     // $79
  super_grizzly: 11900, // $119
  kodiak: 14900,     // $149
  super_kodiak: 19900, // $199
};

const DEFAULT_LIDAR_CENTS: Record<LidarTier, number> = {
  none: 0,
  starter: 7900,     // $79
  unlimited: 19900,   // $199
};

function envInt(key: string, defaultVal: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultVal;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : defaultVal;
}

export function getSeatPriceCents(plan: SeatPlanKey): number {
  const envKey = `SEAT_PRICE_${plan.toUpperCase().replace('-', '_')}_CENTS`;
  return envInt(envKey, DEFAULT_PRICES_CENTS[plan]);
}

export function getLidarPriceCents(tier: LidarTier): number {
  if (tier === 'none') return 0;
  const envKey = `LIDAR_PRICE_${tier.toUpperCase()}_CENTS`;
  return envInt(envKey, DEFAULT_LIDAR_CENTS[tier]);
}

export interface SeatCounts {
  cub_count: number;
  super_cub_count: number;
  grizzly_count: number;
  super_grizzly_count: number;
  kodiak_count: number;
  super_kodiak_count: number;
}

export interface PreviewTotalInput extends SeatCounts {
  lidar_tier: LidarTier;
}

export function computeMonthlyTotalCents(input: PreviewTotalInput): number {
  let total = 0;
  total += (input.cub_count || 0) * getSeatPriceCents('cub');
  total += (input.super_cub_count || 0) * getSeatPriceCents('super_cub');
  total += (input.grizzly_count || 0) * getSeatPriceCents('grizzly');
  total += (input.super_grizzly_count || 0) * getSeatPriceCents('super_grizzly');
  total += (input.kodiak_count || 0) * getSeatPriceCents('kodiak');
  total += (input.super_kodiak_count || 0) * getSeatPriceCents('super_kodiak');
  total += getLidarPriceCents(input.lidar_tier || 'none');
  return total;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
