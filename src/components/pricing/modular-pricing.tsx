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
export type BillingInterval = 'monthly' | 'annual';

// Annual = 2 months free (pay 10, get 12) ≈ 17% off
const ANNUAL_MONTHS_BILLED = 10;

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
    label: 'Sales + Ops',
    description: 'This is where JANIBEAR really shines. One system from bid to proof.',
    features: [
      'Everything in Sales Engine',
      'Everything in Ops Engine',
      'Handoff workflows (sales → ops)',
      'Unified dashboard & reporting',
    ],
  },
];

type TierId = 'cub' | 'grizzly' | 'kodiak';

interface TierDef {
  id: TierId;
  name: string;
  price: number;
  userLimit: string;
  features: string[];
  bestFor: string;
  microcopy: string;
  popular: boolean;
}

const TIERS_BY_PLATFORM: Record<PlatformOption, TierDef[]> = {
  sales: [
    {
      id: 'cub',
      name: 'Cub',
      price: 99,
      userLimit: 'Up to 3 sales users',
      features: [
        'Lead intake & qualification',
        'Deal pipeline visibility',
        'Proposal & bid templates',
        'Basic sales reporting',
      ],
      bestFor: '1–5 employees, selling a manageable number of contracts',
      microcopy: 'Stop winging bids. Start closing consistently.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 249,
      userLimit: 'Up to 10 sales users',
      features: [
        'Advanced pipeline stages',
        'Standardized pricing logic',
        'Proposal workflows & approvals',
        'Sales performance analytics',
      ],
      bestFor: '6–25 employees, multiple sellers, higher bid volume',
      microcopy: 'Close faster without losing control.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 499,
      userLimit: 'Unlimited sales users',
      features: [
        'Multi-team or territory pipelines',
        'Brand-standard proposals',
        'Executive sales dashboards',
        'Franchise / region reporting',
      ],
      bestFor: '25+ employees, franchisors, regional sales orgs',
      microcopy: 'Sales visibility at scale.',
      popular: false,
    },
  ],
  ops: [
    {
      id: 'cub',
      name: 'Cub',
      price: 99,
      userLimit: 'Up to 10 field users',
      features: [
        'Inspection & QA workflows',
        'Issue tracking',
        'Basic accountability logs',
        'Supervisor visibility',
      ],
      bestFor: '1–10 employees, hands-on management',
      microcopy: 'Know what\'s happening—without hovering.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 249,
      userLimit: 'Up to 50 field users',
      features: [
        'Advanced inspections & scoring',
        'Issue escalation workflows',
        'Performance tracking by crew/location',
        'Proof-of-work history',
      ],
      bestFor: '10–50 employees, recurring contracts',
      microcopy: 'Prove performance. Retain contracts.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 499,
      userLimit: 'Unlimited field users',
      features: [
        'Enterprise QA & audit trails',
        'SLA & compliance tracking',
        'Cross-location performance dashboards',
        'Corporate / franchisor visibility',
      ],
      bestFor: '50+ employees, franchises, SLAs matter',
      microcopy: 'Operational control at enterprise scale.',
      popular: false,
    },
  ],
  both: [
    {
      id: 'cub',
      name: 'Cub',
      price: 99,
      userLimit: 'Up to 3 sales · Up to 10 field users',
      features: [
        'Sales pipeline → Ops handoff',
        'Proposal-to-scope alignment',
        'Basic performance visibility',
      ],
      bestFor: '1–10 employees wearing multiple hats',
      microcopy: 'From win to delivery—without the chaos.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 249,
      userLimit: 'Up to 10 sales · Up to 50 field users',
      features: [
        'Connected sales → ops workflows',
        'Inspection-backed proof-of-work',
        'Performance & retention analytics',
      ],
      bestFor: '10–50 employees, growing fast',
      microcopy: 'Scale contracts and crews together.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 499,
      userLimit: 'Unlimited sales & field users',
      features: [
        'End-to-end visibility from bid to proof',
        'Multi-entity & franchise reporting',
        'Enterprise dashboards & controls',
      ],
      bestFor: '50+ employees, franchise systems, executive oversight',
      microcopy: 'Total visibility. Zero guesswork.',
      popular: false,
    },
  ],
};

interface ModularPricingProps {
  businessModel: BusinessModel | null;
  dark?: boolean;
}

export function ModularPricing({ businessModel, dark = true }: ModularPricingProps) {
  const [platform, setPlatform] = useState<PlatformOption>('both');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [loading, setLoading] = useState<string | null>(null);

  const showHelpHubQR = platform === 'ops' || platform === 'both';
  const tiers = TIERS_BY_PLATFORM[platform];

  const handleCheckout = async (tierId: string) => {
    setLoading(tierId);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: tierId,
          platform,
          billingInterval,
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

  const currentPlatform = PLATFORM_OPTIONS.find((o) => o.id === platform)!;

  return (
    <div id="pricing" className="scroll-mt-24">
      {/* Single control row: Billing + Platform */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex rounded-lg bg-zinc-900/60 border border-zinc-800 p-0.5">
            <button
              type="button"
              onClick={() => setBillingInterval('monthly')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval('annual')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                billingInterval === 'annual'
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Annual
            </button>
          </div>
          <div className="flex rounded-lg bg-zinc-900/60 border border-zinc-800 p-0.5">
            {PLATFORM_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPlatform(opt.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  platform === opt.id
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {opt.shortLabel}
              </button>
            ))}
          </div>
        </div>
        {billingInterval === 'annual' && (
          <span className="text-xs text-zinc-500">2 months free when you pay annually</span>
        )}
      </div>

      {/* One-line platform context (no big card) */}
      <p className="text-zinc-500 text-sm mb-10 max-w-xl">
        {currentPlatform.label}: {currentPlatform.description}
      </p>

      {/* Pricing tiers + HelpHubQR */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 w-full min-w-0">
          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => (
              <Card
                key={`${platform}-${tier.id}`}
                className={
                  dark
                    ? `relative bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 flex flex-col ${tier.popular ? 'border-amber-500/30' : ''}`
                    : `relative flex flex-col ${tier.popular ? 'border-primary/50' : ''}`
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className={dark ? 'text-lg text-white' : 'text-lg'}>{tier.name}</CardTitle>
                    {tier.popular && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-amber-500/90">
                        Popular
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{tier.userLimit}</p>
                  <div className="mt-4">
                    {billingInterval === 'monthly' ? (
                      <>
                        <span className={dark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold'}>
                          ${tier.price}
                        </span>
                        <span className="text-zinc-500 text-sm">/mo</span>
                      </>
                    ) : (
                      <>
                        <span className={dark ? 'text-2xl font-bold text-white' : 'text-2xl font-bold'}>
                          ${Math.round((tier.price * ANNUAL_MONTHS_BILLED) / 12)}
                        </span>
                        <span className="text-zinc-500 text-sm">/mo</span>
                        <span className="text-zinc-500 text-xs block mt-0.5">
                          ${tier.price * ANNUAL_MONTHS_BILLED}/yr
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex-1">
                  <ul className="space-y-2 text-sm text-zinc-400">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-zinc-500 mt-4">{tier.bestFor}</p>
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    className={dark ? 'w-full bg-amber-500 text-white hover:bg-amber-400 border-0' : 'w-full'}
                    variant={dark ? undefined : tier.popular ? 'default' : 'outline'}
                    size="sm"
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
          <div className="w-full lg:w-64 shrink-0">
            <HelpHubQRUpsell />
          </div>
        )}
      </div>
    </div>
  );
}
