import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { commitSeatsAfterCheckout } from '@/lib/billing/commit-seats';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export default async function OnboardingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params?.session_id;
  if (!sessionId) {
    redirect('/app/onboarding');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login?next=/app/onboarding/success');
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });
  } catch {
    redirect('/app/onboarding');
  }

  if (session.metadata?.type !== 'org_subscription' || !session.metadata?.org_id) {
    redirect('/app/onboarding');
  }

  const orgId = session.metadata.org_id as string;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription)?.id;

  if (!customerId || !subscriptionId) {
    redirect('/app/onboarding');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, owner_user_id')
    .eq('id', orgId)
    .single();
  if (!org) {
    redirect('/app/onboarding');
  }

  await supabase
    .from('organizations')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      billing_status: 'active',
      past_due_since: null,
      locked_since: null,
    })
    .eq('id', orgId);

  const counts = {
    org_id: orgId,
    cub_count: parseInt(session.metadata.cub_count as string, 10) || 0,
    super_cub_count: parseInt(session.metadata.super_cub_count as string, 10) || 0,
    grizzly_count: parseInt(session.metadata.grizzly_count as string, 10) || 0,
    super_grizzly_count: parseInt(session.metadata.super_grizzly_count as string, 10) || 0,
    kodiak_count: parseInt(session.metadata.kodiak_count as string, 10) || 0,
    super_kodiak_count: parseInt(session.metadata.super_kodiak_count as string, 10) || 0,
    lidar_tier: (session.metadata.lidar_tier as 'none' | 'starter' | 'unlimited') || 'none',
  };

  const ownerUserId = org.owner_user_id ?? user.id;
  const result = await commitSeatsAfterCheckout(supabase, counts, ownerUserId, user.id);
  if (!result.ok) {
    console.error('Commit seats after checkout:', result.error);
  }

  const cookieStore = await cookies();
  cookieStore.set('active_org_id', orgId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect('/app/dashboard');
}
