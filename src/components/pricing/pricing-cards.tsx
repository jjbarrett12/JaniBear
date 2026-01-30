'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const plans = [
  {
    id: 'sales-1',
    name: 'Sales 1',
    tagline: 'Strictly sales',
    price: 49,
    description: 'Everything you need to close more cleaning deals',
    features: [
      'Lead import (paste, voice, scan, email)',
      'Sales pipeline & lead management',
      'Walk-through scheduling',
      '5-page customizable proposals',
      'AI proposal suggestions (crew, hours, pricing)',
      'Up to 5 active leads',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'sales-2',
    name: 'Sales 2',
    tagline: 'Sales, scaled',
    price: 99,
    description: 'More capacity and power for sales teams',
    features: [
      'Everything in Sales 1',
      'Unlimited active leads',
      'Multiple users / team',
      'Locations & templates',
      'Bids & estimates',
      'Contracts upload',
      'Priority support',
    ],
    popular: true,
  },
  {
    id: 'sales-1-qc-1',
    name: 'Sales 1 + QC 1',
    tagline: 'Sales + QC & admin',
    price: 79,
    description: 'Sales plus task breakdown and basic operations',
    features: [
      'Everything in Sales 1',
      'QC Task Assign: split schedules into per-employee task lists',
      'My Tasks for cleaners',
      'Basic inspections',
      'Up to 3 crews',
      'Email support',
    ],
    popular: false,
  },
  {
    id: 'sales-2-qc-2',
    name: 'Sales 2 + QC 2',
    tagline: 'Full sales + operations',
    price: 149,
    description: 'Complete sales and operations in one place',
    features: [
      'Everything in Sales 2',
      'Everything in QC 1, plus:',
      'Unlimited crews & schedules',
      'Inspections & issue tracking',
      'Compliance & SDS management',
      'Purchase orders & invoicing',
      'Admin & employee management',
      'Priority support',
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
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          id={plan.id}
          className={
            dark
              ? `bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors relative flex flex-col ${plan.popular ? 'border-orange-500/50 ring-1 ring-orange-500/20' : ''}`
              : `flex flex-col ${plan.popular ? 'border-primary border-2 shadow-lg relative' : ''}`
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
          <CardHeader className="pb-3">
            <p className={dark ? 'text-xs font-medium text-orange-400 uppercase tracking-wider' : 'text-xs font-medium text-primary uppercase tracking-wider'}>
              {plan.tagline}
            </p>
            <CardTitle className={dark ? 'text-xl text-white' : 'text-xl'}>{plan.name}</CardTitle>
            <CardDescription className={dark ? 'text-zinc-400 text-sm' : 'text-sm'}>
              {plan.description}
            </CardDescription>
            <div className="mt-3">
              <span className={dark ? 'text-3xl font-bold text-white' : 'text-3xl font-bold'}>
                ${plan.price}
              </span>
              <span className={dark ? 'text-zinc-500 text-sm' : 'text-gray-600 text-sm'}>/month</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            <ul className="space-y-2.5">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${dark ? 'text-orange-400' : 'text-primary'}`} />
                  <span className={dark ? 'text-zinc-400 text-sm leading-snug' : 'text-gray-700 text-sm leading-snug'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
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
