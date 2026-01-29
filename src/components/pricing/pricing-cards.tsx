'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 49,
    description: 'Perfect for small cleaning businesses',
    features: [
      'Up to 5 locations',
      'Unlimited inspections',
      'Issue tracking',
      'Basic reporting',
      'Mobile app access',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 149,
    description: 'Ideal for growing businesses',
    features: [
      'Up to 25 locations',
      'Unlimited inspections',
      'Advanced issue tracking',
      'Team management',
      'Crew assignments',
      'Task scheduling',
      'Advanced analytics',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 399,
    description: 'For large organizations',
    features: [
      'Unlimited locations',
      'Unlimited inspections',
      'All Professional features',
      'Custom integrations',
      'Dedicated account manager',
      'Custom reporting',
      'API access',
      '24/7 phone support',
    ],
    popular: false,
  },
];

interface PricingCardsProps {
  dark?: boolean;
}

export function PricingCards({ dark }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setLoading(planId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (stripe && sessionId) {
        await stripe.redirectToCheckout({ sessionId });
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={
            dark
              ? `bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors relative ${plan.popular ? 'border-orange-500/50 ring-1 ring-orange-500/20' : ''}`
              : plan.popular
                ? 'border-primary border-2 shadow-lg relative'
                : ''
          }
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span
                className={
                  dark
                    ? 'bg-orange-500/20 text-orange-400 px-4 py-1 rounded-full text-sm font-semibold border border-orange-500/30'
                    : 'bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold'
                }
              >
                Most Popular
              </span>
            </div>
          )}
          <CardHeader>
            <CardTitle className={dark ? 'text-2xl text-white' : 'text-2xl'}>{plan.name}</CardTitle>
            <CardDescription className={dark ? 'text-zinc-400' : ''}>{plan.description}</CardDescription>
            <div className="mt-4">
              <span className={dark ? 'text-4xl font-bold text-white' : 'text-4xl font-bold'}>${plan.price}</span>
              <span className={dark ? 'text-zinc-500' : 'text-gray-600'}>/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className={`h-5 w-5 flex-shrink-0 mt-0.5 ${dark ? 'text-orange-400' : 'text-primary'}`} />
                  <span className={dark ? 'text-zinc-400 text-sm' : 'text-gray-700'}>{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className={dark ? 'w-full bg-orange-500 text-white hover:bg-orange-400 border-0' : 'w-full'}
              variant={dark ? undefined : plan.popular ? 'default' : 'outline'}
              onClick={() => handleCheckout(plan.id)}
              disabled={!!loading}
            >
              {loading === plan.id ? 'Processing...' : 'Get Started'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
