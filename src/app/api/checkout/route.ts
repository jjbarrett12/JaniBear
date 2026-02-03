import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const plans: Record<string, { priceId: string; name: string }> = {
  cub: {
    priceId: process.env.STRIPE_CUB_PRICE_ID || 'price_cub',
    name: 'Cub',
  },
  'black-bear': {
    priceId: process.env.STRIPE_BLACK_BEAR_PRICE_ID || 'price_black_bear',
    name: 'Black Bear',
  },
  grizzly: {
    priceId: process.env.STRIPE_GRIZZLY_PRICE_ID || 'price_grizzly',
    name: 'Grizzly',
  },
  kodiak: {
    priceId: process.env.STRIPE_KODIAK_PRICE_ID || 'price_kodiak',
    name: 'Kodiak',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();

    if (!planId || !plans[planId]) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const plan = plans[planId];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/pricing`,
      metadata: {
        planId,
        planName: plan.name,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
