'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import type { BusinessModel } from './business-model-selector';
import { HelpHubQRUpsell } from './helphubqr-upsell';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export type PlatformOption = 'sales' | 'ops' | 'both';

const PLATFORM_OPTIONS: Array<{
  id: PlatformOption;
  label: string;
  shortLabel: string;
  description: string;
  features: string[];
}> = [
  {
    id: 'sales',
    shortLabel: 'Sales',
    label: 'Sales Engine',
    description: 'Win more bids. Close faster. Standardize sales.',
    features: [
      'Lead intake & qualification',
      'Bid templates + pricing logic',
      'Proposal builder',
      'CRM-style pipeline',
      'Sales analytics',
    ],
  },
  {
    id: 'ops',
    shortLabel: 'Ops',
    label: 'Ops Engine',
    description: 'Prove performance. Retain contracts. Reduce chaos.',
    features: [
      'Inspections & QA',
      'Scope verification',
      'Issue tracking',
      'Supervisor workflows',
      'Employee accountability',
    ],
  },
  {
    id: 'both',
    shortLabel: 'Both',
    label: 'Full Platform',
    description: 'Sales → Ops → Proof → Retention. Everything above, connected.',
    features: [
      'Everything in Sales Engine',
      'Everything in Ops Engine',
      'Handoff workflows (sales → ops)',
      'Unified dashboard & reporting',
    ],
  },
];

// Tier IDs map to existing Stripe/checkout plan IDs
const TIERS: Array<{
  id: string;
  name: string;
  bestFor: string;
  price: number;
  scaleNote?: string;
}> = [
  { id: 'cub', name: 'Cub', bestFor: 'Small teams', price: 99 },
  { id: 'black-bear', name: 'Black Bear', bestFor: 'Growing ops', price: 199 },
  { id: 'grizzly', name: 'Grizzly', bestFor: 'Multi-crew', price: 349, scaleNote: 'Higher ceilings for locations, users, inspections' },
];

interface ModularPricingProps {
  businessModel: BusinessModel | null;
  dark?: boolean;
}

export function ModularPricing({ businessModel, dark = true }: ModularPricingProps) {
  const [platform, setPlatform] = useState<PlatformOption>('both');
  const [loading, setLoading] = useState<string | null>(null);

  const showHelpHubQR = platform === 'ops' || platform === 'both';

  const handleCheckout = async (tierId: string) => {
    setLoading(tierId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: tierId,
          platform,
          businessModel: businessModel ?? undefined,
        }),
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
    <div id="pricing" className="scroll-mt-24">
      {/* Step 1: Pick Your Core Platform */}
      <div className="mb-10">
        <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">
          Step 1: Pick your core platform
        </p>
        <div className="flex flex-wrap gap-2 p-1 rounded-xl bg-zinc-900/80 border border-zinc-800 inline-flex">
          {PLATFORM_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setPlatform(opt.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                platform === opt.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {opt.shortLabel}
            </button>
          ))}
        </div>
        <div className="mt-4 p-4 rounded-xl bg-white/5 border border-zinc-800 max-w-2xl">
          <h3 className="font-semibold text-white mb-1">
            {PLATFORM_OPTIONS.find((o) => o.id === platform)?.label}
          </h3>
          <p className="text-sm text-zinc-400 mb-3">
            {PLATFORM_OPTIONS.find((o) => o.id === platform)?.description}
          </p>
          <ul className="space-y-1.5 text-sm text-zinc-400">
            {(PLATFORM_OPTIONS.find((o) => o.id === platform)?.features ?? []).map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Step 2: Pricing Tiers + optional HelpHubQR */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
            Step 2: Pricing tiers
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={
                  dark
                    ? `relative bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 flex flex-col ${tier.id === 'black-bear' ? 'border-amber-500/50 ring-1 ring-amber-500/20' : ''}`
                    : `relative flex flex-col ${tier.id === 'black-bear' ? 'border-primary border-2 shadow-lg' : ''}`
                }
              >
                {tier.id === 'black-bear' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span
                      className={
                        dark
                          ? 'bg-amber-500/20 text-amber-400 px-3 py-0.5 rounded-full text-xs font-semibold border border-amber-500/30'
                          : 'bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-semibold'
                      }
                    >
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className={dark ? 'text-white' : ''}>{tier.name}</CardTitle>
                  <p className="text-sm text-zinc-500">{tier.bestFor}</p>
                  <div className="mt-2">
                    <span className={dark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold'}>
                      ${tier.price}
                    </span>
                    <span className="text-zinc-500 text-sm">/month</span>
                  </div>
                  {tier.scaleNote && (
                    <p className="text-xs text-zinc-500 mt-1">{tier.scaleNote}</p>
                  )}
                </CardHeader>
                <CardFooter className="pt-0 mt-auto">
                  <Button
                    className={dark ? 'w-full bg-amber-500 text-white hover:bg-amber-400 border-0' : 'w-full'}
                    variant={dark ? undefined : tier.id === 'black-bear' ? 'default' : 'outline'}
                    onClick={() => handleCheckout(tier.id)}
                    disabled={!!loading}
                  >
                    {loading === tier.id ? 'Processing...' : 'Get Started'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {showHelpHubQR && (
          <div className="w-full lg:w-72 shrink-0">
            <HelpHubQRUpsell />
          </div>
        )}
      </div>
    </div>
  );
}

