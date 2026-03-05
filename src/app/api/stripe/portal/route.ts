import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireApiAuth } from '@/lib/api-auth';
import { requireOrgSeatAdmin } from '@/lib/billing/requireOrgRole';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

/**
 * POST /api/stripe/portal — Create Stripe Customer Portal session (update payment method / upgrade).
 * Body: { org_id: string, return_url?: string }. Returns { url: string }.
 * If return_url is provided and same-origin, use it (e.g. /app/upgrade?module=helphubqr&success=1).
 */
export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => ({}));
  const org_id = body?.org_id;
  if (!org_id || typeof org_id !== 'string') {
    return NextResponse.json({ error: 'org_id required' }, { status: 400 });
  }

  try {
    await requireOrgSeatAdmin(org_id);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = auth.supabase;
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', org_id)
    .single();

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing customer found for this org' }, { status: 400 });
  }

  const origin = request.nextUrl.origin;
  let returnUrl = `${origin}/app/billing`;
  const requestedReturn = body?.return_url;
  if (typeof requestedReturn === 'string' && requestedReturn.startsWith(origin) && requestedReturn.length > origin.length) {
    returnUrl = requestedReturn;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
