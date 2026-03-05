import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';
import { computeMonthlyTotalCents, type LidarTier } from '@/lib/billing/pricing';

const CommitSchema = z.object({
  org_id: z.string().uuid(),
  cub_count: z.number().int().min(0).default(0),
  super_cub_count: z.number().int().min(0).default(0),
  grizzly_count: z.number().int().min(0).default(0),
  super_grizzly_count: z.number().int().min(0).default(0),
  kodiak_count: z.number().int().min(0).default(0),
  super_kodiak_count: z.number().int().min(0).default(0),
  lidar_tier: z.enum(['none', 'starter', 'unlimited']).default('none'),
});

type SeatPlan = 'cub' | 'super_cub' | 'grizzly' | 'super_grizzly' | 'kodiak' | 'super_kodiak';

const PLANS: SeatPlan[] = ['cub', 'super_cub', 'grizzly', 'super_grizzly', 'kodiak', 'super_kodiak'];

/**
 * POST /api/org/seats/commit — Persist seat purchases + mint tokens.
 * Call after Stripe checkout success. Assigns one super_kodiak (or kodiak) token to owner.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = CommitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = auth.supabase;
  const { org_id, ...counts } = parsed.data;

  // Verify user is org owner or has seat-admin role
  const { data: org } = await supabase
    .from('organizations')
    .select('owner_user_id')
    .eq('id', org_id)
    .single();
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  const { data: member } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', org_id)
    .eq('user_id', auth.userId)
    .maybeSingle();
  const role = (member?.role ?? '').toLowerCase();
  const isAdmin = ['owner', 'admin', 'org.owner', 'org.admin', 'kodiak', 'super_kodiak'].includes(role);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Only org owner or seat admin can commit seats' }, { status: 403 });
  }

  const ownerUserId = org.owner_user_id ?? auth.userId;
  const monthly_total_cents = computeMonthlyTotalCents({
    ...counts,
    lidar_tier: counts.lidar_tier as LidarTier,
  });

  // Upsert org_seat_purchases
  const { error: purchaseErr } = await supabase.from('org_seat_purchases').upsert(
    {
      org_id,
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
  if (purchaseErr) {
    return NextResponse.json({ error: purchaseErr.message }, { status: 500 });
  }

  // Mint tokens: for each plan, insert (count - already existing available/assigned) new tokens
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
    .eq('org_id', org_id)
    .in('status', ['available', 'assigned']);
  if (existingTokens) {
    for (const row of existingTokens) {
      const p = row.plan as SeatPlan;
      if (p in existingByPlan) existingByPlan[p]++;
    }
  }

  const toInsert: { org_id: string; plan: SeatPlan; status: 'available' }[] = [];
  for (const plan of PLANS) {
    const countKey = `${plan.replace('_', '')}_count` as keyof typeof counts;
    const wanted = Number((counts as Record<string, number>)[countKey]) || 0;
    const existing = existingByPlan[plan] || 0;
    const add = Math.max(0, wanted - existing);
    for (let i = 0; i < add; i++) {
      toInsert.push({ org_id, plan, status: 'available' });
    }
  }
  if (toInsert.length > 0) {
    const { error: insertErr } = await supabase.from('org_seat_tokens').insert(toInsert);
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
  }

  // Assign one super_kodiak or kodiak to owner (if available and not already assigned)
  const { data: ownerToken } = await supabase
    .from('org_seat_tokens')
    .select('id')
    .eq('org_id', org_id)
    .eq('assigned_to_user_id', ownerUserId)
    .eq('status', 'assigned')
    .maybeSingle();
  if (!ownerToken) {
    const preferredPlan = counts.super_kodiak_count > 0 ? 'super_kodiak' : 'kodiak';
    const { data: availableToken } = await supabase
      .from('org_seat_tokens')
      .select('id')
      .eq('org_id', org_id)
      .eq('plan', preferredPlan)
      .eq('status', 'available')
      .limit(1)
      .maybeSingle();
    if (availableToken) {
      await supabase
        .from('org_seat_tokens')
        .update({
          assigned_to_user_id: ownerUserId,
          assigned_by_user_id: auth.userId,
          assigned_at: new Date().toISOString(),
          status: 'assigned',
        })
        .eq('id', availableToken.id);
      await supabase
        .from('org_members')
        .update({ role: preferredPlan })
        .eq('org_id', org_id)
        .eq('user_id', ownerUserId);
    }
  }

  return NextResponse.json({ ok: true, org_id });
}
