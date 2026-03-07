import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { claimStripeEvent, markStripeEventProcessed } from '@/lib/billing/stripe-webhook-utils';
import { logError, logStructured } from '@/lib/observability';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? process.env.STRIPE_BILLING_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature?.trim()) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  if (!webhookSecret) {
    logError({ message: 'Stripe webhook not configured', domain: 'stripe', meta: { missing: 'STRIPE_WEBHOOK_SECRET' } });
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logError({ message: 'Stripe webhook signature verification failed', domain: 'stripe', error: err });
    return NextResponse.json({ error: `Webhook Error: ${msg}` }, { status: 400 });
  }

  const admin = createAdminClient();
  const claim = await claimStripeEvent(admin, event.id, event.type);
  if (claim === 'skip') {
    logStructured({
      message: 'Stripe webhook duplicate or already processed',
      domain: 'stripe',
      level: 'info',
      meta: { event_id: event.id, event_type: event.type },
    });
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type === 'pro_gear_order' && session.metadata?.order_id) {
          const supabase = await createClient();
          await supabase
            .from('pro_gear_orders')
            .update({
              status: 'confirmed',
              payment_type: 'one_time',
              stripe_checkout_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', session.metadata.order_id);
          break;
        }

        if (
          session.metadata?.type === 'pro_gear_financing' &&
          session.metadata?.order_id &&
          session.subscription
        ) {
          const term = parseInt(session.metadata.term ?? '6', 10);
          const supabase = await createClient();
          await supabase
            .from('pro_gear_orders')
            .update({
              status: 'confirmed',
              payment_type: 'financed',
              financing_months: term,
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq('id', session.metadata.order_id);

          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + term);
          await stripe.subscriptions.update(session.subscription as string, {
            cancel_at: Math.floor(endDate.getTime() / 1000),
          });
          break;
        }

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        break;

      default:
        break;
    }

    await markStripeEventProcessed(admin, event.id, true);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await markStripeEventProcessed(admin, event.id, false, message);
    logError({ message: 'Stripe webhook processing failed', domain: 'stripe', meta: { event_id: event.id, event_type: event.type }, error });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
