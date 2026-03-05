import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { requireApiAuth } from '@/lib/api-auth';
import { computeMonthlyTotalCents, type LidarTier } from '@/lib/billing/pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const SeatCountsSchema = z.object({
  org_id: z.string().uuid(),
  cub_count: z.number().int().min(0).default(0),
  super_cub_count: z.number().int().min(0).default(0),
  grizzly_count: z.number().int().min(0).default(0),
  super_grizzly_count: z.number().int().min(0).default(0),
  kodiak_count: z.number().int().min(0).default(0),
  super_kodiak_count: z.number().int().min(0).default(0),
  lidar_tier: z.enum(['none', 'starter', 'unlimited']).default('none'),
});

function getStripePriceId(plan: string): string | null {
  const key = `STRIPE_PRICE_${plan.toUpperCase().replace('-', '_')}_ID`;
  return process.env[key] ?? null;
}

/**
 * POST /api/stripe/checkout-session — Create Stripe Checkout session for org subscription.
 * Subscription line items: one per seat type (quantity = count) + lidar add-on (qty 1 if starter/unlimited).
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const parsed = SeatCountsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { org_id, lidar_tier, ...counts } = parsed.data;
  const totalCents = computeMonthlyTotalCents({
    ...counts,
    lidar_tier: lidar_tier as LidarTier,
  });
  if (totalCents <= 0) {
    return NextResponse.json({ error: 'At least one seat or add-on required' }, { status: 400 });
  }

  const supabase = auth.supabase;
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, stripe_customer_id')
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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  const plans = [
    { key: 'cub', count: counts.cub_count },
    { key: 'super_cub', count: counts.super_cub_count },
    { key: 'grizzly', count: counts.grizzly_count },
    { key: 'super_grizzly', count: counts.super_grizzly_count },
    { key: 'kodiak', count: counts.kodiak_count },
    { key: 'super_kodiak', count: counts.super_kodiak_count },
  ];
  for (const { key, count } of plans) {
    if (count > 0) {
      const priceId = getStripePriceId(key);
      if (!priceId) {
        return NextResponse.json(
          { error: `Stripe price not configured for ${key}. Set STRIPE_PRICE_${key.toUpperCase()}_ID.` },
          { status: 500 }
        );
      }
      line_items.push({ price: priceId, quantity: count });
    }
  }
  if (lidar_tier === 'starter') {
    const priceId = process.env.STRIPE_PRICE_LIDAR_STARTER_ID ?? null;
    if (!priceId) return NextResponse.json({ error: 'Stripe lidar starter price not configured' }, { status: 500 });
    line_items.push({ price: priceId, quantity: 1 });
  } else if (lidar_tier === 'unlimited') {
    const priceId = process.env.STRIPE_PRICE_LIDAR_UNLIMITED_ID ?? null;
    if (!priceId) return NextResponse.json({ error: 'Stripe lidar unlimited price not configured' }, { status: 500 });
    line_items.push({ price: priceId, quantity: 1 });
  }

  if (line_items.length === 0) {
    return NextResponse.json({ error: 'No line items' }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  const successUrl = `${origin}/app/onboarding/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/app/onboarding`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      type: 'org_subscription',
      org_id,
      cub_count: String(counts.cub_count),
      super_cub_count: String(counts.super_cub_count),
      grizzly_count: String(counts.grizzly_count),
      super_grizzly_count: String(counts.super_grizzly_count),
      kodiak_count: String(counts.kodiak_count),
      super_kodiak_count: String(counts.super_kodiak_count),
      lidar_tier,
    },
    subscription_data: {
      metadata: { org_id },
    },
  };

  if (org.stripe_customer_id) {
    sessionParams.customer = org.stripe_customer_id;
  } else {
    sessionParams.customer_email = (await auth.supabase.auth.getUser()).data.user?.email ?? undefined;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return NextResponse.json({ sessionId: session.id, url: session.url });
}
