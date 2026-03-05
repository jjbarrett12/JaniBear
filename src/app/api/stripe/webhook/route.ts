import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getAddonCodesForStripePriceIds,
  CATALOG_ADDON_CODES,
} from '@/lib/billing/catalog';
import type { SupabaseClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET;

/** Sync org_addons from subscription line items (idempotent). */
async function syncOrgAddonsFromSubscription(
  supabase: SupabaseClient,
  subscriptionId: string,
  orgId: string
): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price'],
  });
  const priceIds = sub.items.data.map((item) => (item.price as Stripe.Price).id);
  const addonCodes = getAddonCodesForStripePriceIds(priceIds);

  for (const addonCode of addonCodes) {
    await supabase.from('org_addons').upsert(
      { org_id: orgId, addon_code: addonCode, status: 'active' },
      { onConflict: 'org_id,addon_code' }
    );
  }

  for (const code of CATALOG_ADDON_CODES) {
    if (addonCodes.includes(code)) continue;
    await supabase
      .from('org_addons')
      .update({ status: 'canceled' })
      .eq('org_id', orgId)
      .eq('addon_code', code);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature?.trim()) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }
  if (!webhookSecret) {
    console.error('STRIPE_BILLING_WEBHOOK_SECRET or STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'org_subscription' && session.metadata?.org_id) {
          const orgId = session.metadata.org_id as string;
          const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
          const subId = typeof session.subscription === 'string' ? session.subscription : (session.subscription as Stripe.Subscription)?.id;
          if (customerId && subId) {
            await supabase
              .from('organizations')
              .update({
                stripe_customer_id: customerId,
                stripe_subscription_id: subId,
                billing_status: 'active',
                past_due_since: null,
                locked_since: null,
              })
              .eq('id', orgId);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);
        if (orgs?.length) {
          const orgId = orgs[0].id;
          const { data: existing } = await supabase
            .from('organizations')
            .select('past_due_since')
            .eq('id', orgId)
            .single();
          await supabase
            .from('organizations')
            .update({
              billing_status: 'past_due',
              ...(existing?.past_due_since ? {} : { past_due_since: new Date().toISOString() }),
            })
            .eq('id', orgId);
          await supabase.from('org_billing_events').insert({
            org_id: orgId,
            type: 'payment_failed',
            payload: { invoice_id: invoice.id },
          });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        if (!customerId) break;

        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);
        if (orgs?.length) {
          const orgId = orgs[0].id;
          await supabase
            .from('organizations')
            .update({
              billing_status: 'active',
              past_due_since: null,
              locked_since: null,
            })
            .eq('id', orgId);
          await supabase.from('org_billing_events').insert({
            org_id: orgId,
            type: 'payment_recovered',
            payload: { invoice_id: invoice.id },
          });
          const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
          if (subId) {
            try {
              await syncOrgAddonsFromSubscription(supabase, subId, orgId);
            } catch (err) {
              console.error('syncOrgAddonsFromSubscription (invoice.paid) failed:', err);
            }
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
        if (!customerId) break;
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .limit(1);
        if (orgs?.length) {
          try {
            await syncOrgAddonsFromSubscription(supabase, subscription.id, orgs[0].id);
          } catch (err) {
            console.error('syncOrgAddonsFromSubscription (subscription.updated) failed:', err);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const subId = subscription.id;

        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('stripe_subscription_id', subId)
          .limit(1);
        if (orgs?.length) {
          const orgId = orgs[0].id;
          await supabase
            .from('organizations')
            .update({
              billing_status: 'canceled',
              past_due_since: null,
              locked_since: null,
              stripe_subscription_id: null,
            })
            .eq('id', orgId);
          await supabase.from('org_billing_events').insert({
            org_id: orgId,
            type: 'subscription_canceled',
            payload: { subscription_id: subId },
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe billing webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
