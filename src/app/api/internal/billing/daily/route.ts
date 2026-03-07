import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { startCronRun, finishCronRun, logError } from '@/lib/observability';
import { syncPlanState } from '@/lib/billing/plan-source';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const CRON_SECRET = process.env.CRON_SECRET ?? process.env.INTERNAL_CRON_SECRET;

function isExpiringSoon(expMonth: number, expYear: number, withinDays: number): boolean {
  const now = new Date();
  const exp = new Date(expYear, expMonth - 1, 1);
  const threshold = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);
  return exp <= threshold && exp >= now;
}

/**
 * POST /api/internal/billing/daily
 * Protected by x-internal-cron-secret (or Authorization: Bearer CRON_SECRET).
 * 1) Expiring cards: create org_billing_events for card_expiring (30d, 7d) with dedupe.
 * 2) Past due locking: if past_due > 7 days set locked_since + create 'locked'.
 * 3) Past due > 14 days: cancel Stripe subscription + set billing_status='canceled'.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-cron-secret') ?? request.headers.get('authorization')?.replace('Bearer ', '');
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startCronRun('billing-daily');
  try {
    const supabase = createAdminClient();
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { data: orgs } = await supabase
    .from('organizations')
    .select('id, stripe_customer_id, billing_status, past_due_since, locked_since, stripe_subscription_id')
    .not('stripe_customer_id', 'is', null);

    if (!orgs) {
      await finishCronRun(runId, 'success');
      return NextResponse.json({ ok: true, processed: 0 });
    }

  for (const org of orgs) {
    if (!org.stripe_customer_id) continue;

    // 1) Expiring cards
    try {
      const customer = await stripe.customers.retrieve(org.stripe_customer_id);
      if (customer.deleted) continue;
      const defaultPaymentMethodId =
        typeof customer.invoice_settings?.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : customer.invoice_settings?.default_payment_method?.id;
      if (defaultPaymentMethodId) {
        const pm = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);
        const expMonth = pm.card?.exp_month ?? 0;
        const expYear = pm.card?.exp_year ?? 0;
        if (expMonth && expYear) {
          const in30 = isExpiringSoon(expMonth, expYear, 30);
          const in7 = isExpiringSoon(expMonth, expYear, 7);
          if (in30) {
            const { data: existing } = await supabase
              .from('org_billing_events')
              .select('id')
              .eq('org_id', org.id)
              .eq('type', 'card_expiring')
              .gte('created_at', new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString())
              .limit(1)
              .maybeSingle();
            if (!existing) {
              await supabase.from('org_billing_events').insert({
                org_id: org.id,
                type: 'card_expiring',
                payload: { within_days: 30, exp_month: expMonth, exp_year: expYear },
              });
            }
          }
          if (in7) {
            const { data: existing } = await supabase
              .from('org_billing_events')
              .select('id')
              .eq('org_id', org.id)
              .eq('type', 'card_expiring')
              .gte('created_at', new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString())
              .limit(1)
              .maybeSingle();
            if (!existing) {
              await supabase.from('org_billing_events').insert({
                org_id: org.id,
                type: 'card_expiring',
                payload: { within_days: 7, exp_month: expMonth, exp_year: expYear },
              });
            }
          }
        }
      }
    } catch (e) {
      logError({ message: 'Billing daily: expiring card check failed', domain: 'stripe', meta: { orgId: org.id }, error: e });
    }

    // 2) Past due locking
    if (org.billing_status === 'past_due' && org.past_due_since) {
      const pastDueSince = new Date(org.past_due_since);
      if (pastDueSince <= fourteenDaysAgo && org.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(org.stripe_subscription_id);
        } catch (e) {
          logError({ message: 'Billing daily: cancel subscription failed', domain: 'stripe', meta: { orgId: org.id }, error: e });
        }
        await supabase
          .from('organizations')
          .update({
            billing_status: 'canceled',
            locked_since: now.toISOString(),
            stripe_subscription_id: null,
          })
          .eq('id', org.id);
        await syncPlanState(supabase, org.id, 'cub', 'canceled');
        await supabase.from('org_billing_events').insert({
          org_id: org.id,
          type: 'subscription_canceled',
          payload: { reason: 'past_due_14_days' },
        });
      } else if (pastDueSince <= sevenDaysAgo && !org.locked_since) {
        await supabase
          .from('organizations')
          .update({ locked_since: now.toISOString() })
          .eq('id', org.id);
        await supabase.from('org_billing_events').insert({
          org_id: org.id,
          type: 'locked',
          payload: { past_due_since: org.past_due_since },
        });
      }
    }
  }

    await finishCronRun(runId, 'success');
    return NextResponse.json({ ok: true, processed: orgs.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logError({ message: 'billing-daily cron failed', domain: 'cron', meta: { job_name: 'billing-daily' }, error: err });
    await finishCronRun(runId, 'failure', msg);
    throw err;
  }
}
