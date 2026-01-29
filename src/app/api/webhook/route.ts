import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle successful payment
        // You can create/update user subscription in Supabase here
        console.log('Checkout session completed:', session.id);
        
        // Example: Update user's subscription status in Supabase
        // const supabase = await createClient();
        // await supabase
        //   .from('subscriptions')
        //   .upsert({
        //     user_id: session.metadata?.userId,
        //     plan_id: session.metadata?.planId,
        //     stripe_customer_id: session.customer,
        //     stripe_subscription_id: session.subscription,
        //     status: 'active',
        //   });

        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Handle subscription updates/cancellations
        console.log('Subscription updated:', subscription.id);
        
        // Update subscription status in Supabase
        // const supabase = await createClient();
        // await supabase
        //   .from('subscriptions')
        //   .update({ status: subscription.status })
        //   .eq('stripe_subscription_id', subscription.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
