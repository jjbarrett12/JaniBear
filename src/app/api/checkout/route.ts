import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const plans: Record<string, { priceId: string; name: string }> = {
  'sales-1': {
    priceId: process.env.STRIPE_SALES_1_PRICE_ID || 'price_sales_1',
    name: 'Sales 1',
  },
  'sales-2': {
    priceId: process.env.STRIPE_SALES_2_PRICE_ID || 'price_sales_2',
    name: 'Sales 2',
  },
  'sales-1-qc-1': {
    priceId: process.env.STRIPE_SALES_1_QC_1_PRICE_ID || 'price_sales_1_qc_1',
    name: 'Sales 1 + QC 1',
  },
  'sales-2-qc-2': {
    priceId: process.env.STRIPE_SALES_2_QC_2_PRICE_ID || 'price_sales_2_qc_2',
    name: 'Sales 2 + QC 2',
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
