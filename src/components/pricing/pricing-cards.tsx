'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const plans = [
  {
    id: 'cub',
    name: 'Cub',
    tagline: "One rep's output, zero HR",
    price: 59,
    description: "I need someone selling now—without hiring.",
    valueNote: 'Replaces ~$50k+ in first sales hire · ~1% of that cost',
    priceLabel: 'per company',
    seats: '1 user included',
    features: [
      'AI sales copilot (email, SMS, follow-ups)',
      'Prebuilt outreach sequences (inbound + outbound)',
      'Lead intake & qualification',
      'Call / meeting summaries',
      'Proposal & quote assistance',
      'CRM sync (HubSpot, Zoho, etc.)',
      'Activity tracking & basic deal timeline',
      '1 pipeline, 1 motion, 1 user',
    ],
    popular: false,
    contactOnly: false,
  },
  {
    id: 'black-bear',
    name: 'Black Bear',
    tagline: 'Sales at scale, no new hires',
    price: 149,
    description: 'We have leads. We need throughput.',
    valueNote: 'Sales team without salaries · ~1% of 2–3 reps',
    priceLabel: 'per company',
    seats: 'Up to 5 users',
    features: [
      'Everything in Cub',
      'Multi-pipeline support (2–5 pipelines)',
      'Parallel outreach sequences & lead routing',
      'Territory / segment logic',
      'Shared inbox & task pool',
      'AI objection handling & response suggestions',
      'Rep benchmarking & pipeline health scoring',
      'Follow-up SLA & stalled-deal detection',
    ],
    popular: true,
    contactOnly: false,
  },
  {
    id: 'grizzly',
    name: 'Grizzly',
    tagline: 'Sales + ops under control',
    price: 249,
    description: 'Sales is working—now keep it consistent.',
    valueNote: 'Replaces sales ops & cleans up the mess',
    priceLabel: 'per company',
    seats: 'Up to 10 users',
    features: [
      'Everything in Black Bear',
      'Sales playbooks (enforced, not optional)',
      'Deal QA before stage movement',
      'Required artifacts per stage (notes, logs, docs)',
      'AI deal audits (what’s missing / risky)',
      'Handoff workflows (sales → ops)',
      'Custom QC rules & exception alerts',
      'Audit trail & ops dashboard',
    ],
    popular: false,
    contactOnly: false,
  },
  {
    id: 'kodiak',
    name: 'Kodiak',
    tagline: 'Full revenue engine',
    price: 499,
    description: 'Predictable revenue without babysitting.',
    valueNote: 'Revenue department, not software',
    priceLabel: 'per company',
    seats: 'Unlimited users',
    priceNote: 'or custom for enterprise',
    features: [
      'Everything in Grizzly',
      'AI deal prioritization & forecast confidence',
      'Pipeline rebalancing & multi-team orchestration',
      'Continuous deal monitoring & revenue leakage detection',
      'SLA auto-remediation across teams',
      'Multi-org / multi-region & API access',
      'Dedicated onboarding & priority support',
    ],
    popular: false,
    contactOnly: false,
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
              ? `bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 transition-colors relative flex flex-col ${plan.popular ? 'border-amber-500/50 ring-1 ring-amber-500/20' : ''}`
              : `flex flex-col ${plan.popular ? 'border-primary border-2 shadow-lg relative' : ''}`
          }
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span
                className={
                  dark
                    ? 'bg-amber-500/20 text-amber-400 px-4 py-1 rounded-full text-sm font-semibold border border-amber-500/30'
                    : 'bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold'
                }
              >
                Most Popular
              </span>
            </div>
          )}
          <CardHeader className="pb-3">
            <p className={dark ? 'text-xs font-medium text-amber-400 uppercase tracking-wider' : 'text-xs font-medium text-primary uppercase tracking-wider'}>
              {plan.tagline}
            </p>
            <CardTitle className={dark ? 'text-xl text-white' : 'text-xl'}>{plan.name}</CardTitle>
            <CardDescription className={dark ? 'text-zinc-400 text-sm' : 'text-sm'}>
              {plan.description}
            </CardDescription>
            {plan.valueNote && (
              <p className={dark ? 'text-xs text-amber-400/90 font-medium mt-1' : 'text-xs text-primary font-medium mt-1'}>
                {plan.valueNote}
              </p>
            )}
            <div className="mt-3">
              <span className={dark ? 'text-3xl font-bold text-white' : 'text-3xl font-bold'}>
                ${plan.price}
              </span>
              <span className={dark ? 'text-zinc-500 text-sm' : 'text-gray-600 text-sm'}>/month</span>
              {'priceLabel' in plan && plan.priceLabel && (
                <span className={dark ? 'text-zinc-500 text-xs block mt-0.5' : 'text-gray-500 text-xs block mt-0.5'}>
                  {plan.priceLabel}
                </span>
              )}
              {'seats' in plan && plan.seats && (
                <p className={dark ? 'text-xs text-amber-400/80 mt-1' : 'text-xs text-primary/80 mt-1'}>
                  {plan.seats}
                </p>
              )}
              {'priceNote' in plan && plan.priceNote && (
                <p className={dark ? 'text-xs text-zinc-500 mt-0.5' : 'text-xs text-gray-500 mt-0.5'}>
                  {plan.priceNote}
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 pt-0">
            <ul className="space-y-2.5">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${dark ? 'text-amber-400' : 'text-primary'}`} />
                  <span className={dark ? 'text-zinc-400 text-sm leading-snug' : 'text-gray-700 text-sm leading-snug'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pt-4">
            <Button
              className={dark ? 'w-full bg-amber-500 text-white hover:bg-amber-400 border-0' : 'w-full'}
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
