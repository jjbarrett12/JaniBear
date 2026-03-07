import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logError } from '@/lib/observability';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const FINANCING_APR = 0.12; // 12%

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const orderId = body?.orderId;
    const option = body?.option ?? 'pay_in_full'; // 'pay_in_full' | 'finance_6' | 'finance_12'

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: order, error: orderError } = await supabase
      .from('pro_gear_orders')
      .select('id, user_id, status, total_cents')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (order.status !== 'draft') {
      return NextResponse.json(
        { error: 'Order already submitted or paid' },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;

    if (option === 'finance_6' || option === 'finance_12') {
      const term = option === 'finance_6' ? 6 : 12;
      const totalWithInterest = Math.round(order.total_cents * (1 + FINANCING_APR));
      const installmentCents = Math.round(totalWithInterest / term);
      if (installmentCents < 50) {
        return NextResponse.json(
          { error: 'Order total too small for financing' },
          { status: 400 }
        );
      }

      const product = await stripe.products.create({
        name: `Member Pro Gear — ${term}-month financing`,
        description: `${term} monthly payments at 12% APR. First payment today.`,
        metadata: { order_id: orderId },
      });

      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: installmentCents,
        recurring: { interval: 'month' },
        product: product.id,
        metadata: { order_id: orderId, term: String(term) },
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${origin}/app/pro-gear/orders?financed=${orderId}`,
        cancel_url: `${origin}/app/pro-gear/cart`,
        customer_email: user.email ?? undefined,
        metadata: {
          type: 'pro_gear_financing',
          order_id: orderId,
          user_id: user.id,
          term: String(term),
        },
        subscription_data: {
          metadata: {
            type: 'pro_gear_financing',
            order_id: orderId,
            term: String(term),
          },
        },
      });

      return NextResponse.json({
        url: session.url,
        sessionId: session.id,
      });
    }

    // Pay in full (one-time)
    const { data: items } = await supabase
      .from('pro_gear_order_items')
      .select('quantity, unit_price_cents, line_total_cents, pro_gear_products(name)')
      .eq('order_id', orderId);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      (items ?? []).map((row: { quantity: number; unit_price_cents: number; pro_gear_products: { name: string } | null }) => ({
        price_data: {
          currency: 'usd',
          unit_amount: row.unit_price_cents,
          product_data: {
            name: (row.pro_gear_products as { name: string })?.name ?? 'Pro Gear item',
            description: 'Member Pro Gear',
          },
        },
        quantity: row.quantity,
      }));

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'Order has no items' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${origin}/app/pro-gear/orders?paid=${orderId}`,
      cancel_url: `${origin}/app/pro-gear/cart`,
      metadata: {
        type: 'pro_gear_order',
        order_id: orderId,
        user_id: user.id,
      },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: unknown) {
    logError({ message: 'Pro Gear checkout failed', domain: 'stripe', error: err });
    const message = err instanceof Error ? err.message : 'Checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
