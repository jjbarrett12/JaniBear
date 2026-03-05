/**
 * Shared logic: persist seat purchases + mint tokens + assign one to owner.
 * Used after Stripe checkout success (onboarding success page or server action).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeMonthlyTotalCents, type LidarTier } from './pricing';

export type SeatCountsInput = {
  org_id: string;
  cub_count: number;
  super_cub_count: number;
  grizzly_count: number;
  super_grizzly_count: number;
  kodiak_count: number;
  super_kodiak_count: number;
  lidar_tier: 'none' | 'starter' | 'unlimited';
};

type SeatPlan = 'cub' | 'super_cub' | 'grizzly' | 'super_grizzly' | 'kodiak' | 'super_kodiak';

const PLANS: SeatPlan[] = ['cub', 'super_cub', 'grizzly', 'super_grizzly', 'kodiak', 'super_kodiak'];

export async function commitSeatsAfterCheckout(
  supabase: SupabaseClient,
  counts: SeatCountsInput,
  ownerUserId: string,
  actingUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const monthly_total_cents = computeMonthlyTotalCents({
    ...counts,
    lidar_tier: (counts.lidar_tier || 'none') as LidarTier,
  });

  const { error: purchaseErr } = await supabase.from('org_seat_purchases').upsert(
    {
      org_id: counts.org_id,
      cub_count: counts.cub_count,
      super_cub_count: counts.super_cub_count,
      grizzly_count: counts.grizzly_count,
      super_grizzly_count: counts.super_grizzly_count,
      kodiak_count: counts.kodiak_count,
      super_kodiak_count: counts.super_kodiak_count,
      lidar_tier: counts.lidar_tier,
      monthly_total_cents,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id' }
  );
  if (purchaseErr) return { ok: false, error: purchaseErr.message };

  const existingByPlan: Record<SeatPlan, number> = {
    cub: 0,
    super_cub: 0,
    grizzly: 0,
    super_grizzly: 0,
    kodiak: 0,
    super_kodiak: 0,
  };
  const { data: existingTokens } = await supabase
    .from('org_seat_tokens')
    .select('plan')
    .eq('org_id', counts.org_id)
    .in('status', ['available', 'assigned']);
  if (existingTokens) {
    for (const row of existingTokens) {
      const p = row.plan as SeatPlan;
      if (p in existingByPlan) existingByPlan[p]++;
    }
  }

  const toInsert: { org_id: string; plan: SeatPlan; status: 'available' }[] = [];
  const countKeys: { key: keyof SeatCountsInput; plan: SeatPlan }[] = [
    { key: 'cub_count', plan: 'cub' },
    { key: 'super_cub_count', plan: 'super_cub' },
    { key: 'grizzly_count', plan: 'grizzly' },
    { key: 'super_grizzly_count', plan: 'super_grizzly' },
    { key: 'kodiak_count', plan: 'kodiak' },
    { key: 'super_kodiak_count', plan: 'super_kodiak' },
  ];
  for (const { key, plan } of countKeys) {
    const wanted = Number(counts[key]) || 0;
    const existing = existingByPlan[plan] || 0;
    const add = Math.max(0, wanted - existing);
    for (let i = 0; i < add; i++) {
      toInsert.push({ org_id: counts.org_id, plan, status: 'available' });
    }
  }
  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from('org_seat_tokens').insert(toInsert);
    if (insertErr) return { ok: false, error: insertErr.message };
  }

  const { data: ownerToken } = await supabase
    .from('org_seat_tokens')
    .select('id')
    .eq('org_id', counts.org_id)
    .eq('assigned_to_user_id', ownerUserId)
    .eq('status', 'assigned')
    .maybeSingle();
  if (!ownerToken) {
    const preferredPlan = counts.super_kodiak_count > 0 ? 'super_kodiak' : 'kodiak';
    const { data: availableToken } = await supabase
      .from('org_seat_tokens')
      .select('id')
      .eq('org_id', counts.org_id)
      .eq('plan', preferredPlan)
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();
    if (availableToken) {
      await supabase
        .from('org_seat_tokens')
        .update({
          assigned_to_user_id: ownerUserId,
          assigned_by_user_id: actingUserId,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
        })
        .eq('id', availableToken.id);
      await supabase
        .from('org_members')
        .update({ role: preferredPlan })
        .eq('org_id', counts.org_id)
        .eq('user_id', ownerUserId);
    }
  }

  return { ok: true };
}
