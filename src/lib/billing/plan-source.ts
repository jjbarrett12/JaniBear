/**
 * Canonical plan source: org_subscriptions.plan_code (single source of truth).
 * Helpers to derive plan from Stripe/checkout metadata and to resolve plan for gating.
 */

export type PlanType = 'cub' | 'grizzly' | 'kodiak';

/** Seat counts from checkout session metadata (string values). */
export type SeatCountsMetadata = {
  cub_count?: string;
  super_cub_count?: string;
  grizzly_count?: string;
  super_grizzly_count?: string;
  kodiak_count?: string;
  super_kodiak_count?: string;
};

/**
 * Derive plan_code from seat counts: highest tier with count > 0.
 * Used after checkout or when syncing from Stripe metadata.
 */
export function planCodeFromSeatCounts(counts: SeatCountsMetadata): PlanType {
  const k = (parseInt(counts.kodiak_count ?? '0', 10) || 0) + (parseInt(counts.super_kodiak_count ?? '0', 10) || 0);
  const g = (parseInt(counts.grizzly_count ?? '0', 10) || 0) + (parseInt(counts.super_grizzly_count ?? '0', 10) || 0);
  if (k > 0) return 'kodiak';
  if (g > 0) return 'grizzly';
  return 'cub';
}

/**
 * Map plan_code to display/legacy plan string (for organizations.plan sync).
 */
export function planCodeToLegacyPlan(planCode: string): string {
  const p = (planCode || '').toLowerCase();
  if (p === 'kodiak') return 'kodiak';
  if (p === 'grizzly') return 'grizzly';
  return 'cub';
}

export type SubscriptionStatus = 'active' | 'canceled';

/** Supabase-like client with the methods needed for syncPlanState (server or admin). */
type SupabaseLike = {
  from: (table: string) => {
    upsert: (value: unknown, opts?: { onConflict?: string }) => Promise<{ error: unknown }>;
    update: (value: unknown) => { eq: (col: string, id: string) => Promise<{ error: unknown }> };
  };
};

/**
 * Single place to set plan state: updates org_subscriptions (canonical) and organizations.plan (legacy sync).
 * Use from webhook, onboarding success, set-plan API, and billing daily cron to prevent drift.
 */
export async function syncPlanState(
  supabase: SupabaseLike,
  orgId: string,
  planCode: string,
  status: SubscriptionStatus
): Promise<{ error: unknown }> {
  const code = (planCode || 'cub').toLowerCase().replace(/\s+/g, '-');
  const legacyPlan = planCodeToLegacyPlan(code);

  const { error: subError } = await supabase
    .from('org_subscriptions')
    .upsert(
      { org_id: orgId, plan_code: code, status },
      { onConflict: 'org_id' }
    );
  if (subError) return { error: subError };

  const { error: orgError } = await supabase
    .from('organizations')
    .update({ plan: legacyPlan })
    .eq('id', orgId);
  return orgError ? { error: orgError } : { error: null };
}
