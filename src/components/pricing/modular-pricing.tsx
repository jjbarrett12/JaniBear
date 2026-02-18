'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import type { BusinessModel } from './business-model-selector';
import { HelpHubQRUpsell } from './helphubqr-upsell';
import { LidarUpgrade } from './lidar-upgrade';

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

// Franchisor-specific: no crews/labor—Sales & BD, Operations & Brand only.
const PLATFORM_OPTIONS_FRANCHISOR: Array<{
  id: PlatformOption;
  label: string;
  shortLabel: string;
  description: string;
  features: string[];
}> = [
  {
    id: 'sales',
    shortLabel: 'Sales & BD',
    label: 'Sales & Business Development',
    description: 'Lead management, franchisee sales enablement, and deal pipeline.',
    features: [
      'Lead intake & franchisee assignment',
      'Bid templates & pricing logic',
      'Proposal builder & brand standards',
      'Pipeline & territory visibility',
      'Franchise sales analytics',
    ],
  },
  {
    id: 'ops',
    shortLabel: 'Operations & Brand',
    label: 'Operations & Brand Services',
    description: 'Franchise performance visibility, brand compliance, and outcome reporting.',
    features: [
      'Franchise outcome & performance visibility',
      'Brand compliance & suggested standards',
      'Self-reported quality & trend dashboards',
      'Multi-location operations reporting',
      'No labor control—oversight only',
    ],
  },
  {
    id: 'both',
    shortLabel: 'Both',
    label: 'Sales + Operations & Brand',
    description: 'Full platform: business development and franchise operations visibility.',
    features: [
      'Everything in Sales & BD',
      'Everything in Operations & Brand',
      'Lead-to-outcome visibility',
      'Unified franchise dashboard & reporting',
    ],
  },
];

function getPlatformOptions(model: BusinessModel | null) {
  return model === 'area-franchisor' ? PLATFORM_OPTIONS_FRANCHISOR : PLATFORM_OPTIONS;
}

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

// Pricing and offerings vary by business model (Owner/Operator, Area Franchisor, Unit Franchisee).
function getTiersByModelAndPlatform(
  model: BusinessModel | null,
  platform: PlatformOption
): TierDef[] {
  const key = model ?? 'owner-operator';
  return TIERS_BY_MODEL_AND_PLATFORM[key][platform];
}

const TIERS_OWNER_OPERATOR: Record<PlatformOption, TierDef[]> = {
  sales: [
    {
      id: 'cub',
      name: 'Cub',
      price: 79,
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
      price: 199,
      userLimit: 'Up to 10 sales users',
      features: [
        'Advanced pipeline stages',
        'Standardized pricing logic',
        'Proposal workflows & approvals',
        'Sales performance analytics',
      ],
      bestFor: '6–15 employees, multiple sellers, higher bid volume',
      microcopy: 'Close faster without losing control.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 399,
      userLimit: 'Unlimited sales users',
      features: [
        'Multi-team or territory pipelines',
        'Brand-standard proposals',
        'Executive sales dashboards',
        'Franchise / region reporting',
      ],
      bestFor: '15–30 employees, franchisors, regional sales orgs',
      microcopy: 'Sales visibility at scale.',
      popular: false,
    },
  ],
  ops: [
    {
      id: 'cub',
      name: 'Cub',
      price: 79,
      userLimit: 'Up to 10 field users',
      features: [
        'Inspection & QA workflows',
        'Issue tracking',
        'Basic accountability logs',
        'Supervisor visibility',
      ],
      bestFor: '1–5 employees, hands-on management',
      microcopy: 'Know what\'s happening—without hovering.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 199,
      userLimit: 'Up to 50 field users',
      features: [
        'Advanced inspections & scoring',
        'Issue escalation workflows',
        'Performance tracking by crew/location',
        'Proof-of-work history',
      ],
      bestFor: '6–15 employees, recurring contracts',
      microcopy: 'Prove performance. Retain contracts.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 399,
      userLimit: 'Unlimited field users',
      features: [
        'Enterprise QA & audit trails',
        'SLA & compliance tracking',
        'Cross-location performance dashboards',
        'Corporate / franchisor visibility',
      ],
      bestFor: '15–30 employees, franchises, SLAs matter',
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
      bestFor: '1–5 employees wearing multiple hats',
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
      bestFor: '6–15 employees, growing fast',
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
      bestFor: '15–30 employees, franchise systems, executive oversight',
      microcopy: 'Total visibility. Zero guesswork.',
      popular: false,
    },
  ],
};

// Area Franchisor: sales, business development, operations & brand only. No crews, no field labor, no inspections.
const TIERS_AREA_FRANCHISOR: Record<PlatformOption, TierDef[]> = {
  sales: [
    {
      id: 'cub',
      name: 'Cub',
      price: 99,
      userLimit: 'Up to 3 users',
      features: [
        'Lead intake & franchisee assignment',
        'Deal pipeline visibility',
        'Proposal & bid templates',
        'Basic franchise sales reporting',
      ],
      bestFor: '1–5 franchisees or territories',
      microcopy: 'Stop winging bids. Start closing consistently.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 249,
      userLimit: 'Up to 10 users',
      features: [
        'Advanced pipeline & territory logic',
        'Franchisee sales enablement',
        'Proposal workflows & approvals',
        'Franchise performance dashboards',
      ],
      bestFor: '6–15 franchisees, multi-territory',
      microcopy: 'Close faster without losing control.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 499,
      userLimit: 'Unlimited users',
      features: [
        'Multi-territory pipelines',
        'Brand-standard proposals',
        'Executive franchise dashboards',
        'Region & franchise reporting',
      ],
      bestFor: '15–30 franchisees, regional business development',
      microcopy: 'Sales visibility at scale.',
      popular: false,
    },
  ],
  ops: [
    {
      id: 'cub',
      name: 'Cub',
      price: 79,
      userLimit: 'Up to 10 locations',
      features: [
        'Franchise outcome visibility (recommended)',
        'Brand compliance & suggested standards',
        'Self-reported quality & trend dashboards',
        'Operations reporting—oversight only',
      ],
      bestFor: '1–5 franchisees, light operations oversight',
      microcopy: 'See how franchisees perform—outcomes, not labor.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 199,
      userLimit: 'Up to 50 locations',
      features: [
        'Franchise performance & operations dashboards',
        'Suggested standards & outcome review',
        'Cross-location trend analytics',
        'Brand services visibility',
      ],
      bestFor: '6–15 franchisees, operations & brand visibility',
      microcopy: 'Prove performance. Retain contracts.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 399,
      userLimit: 'Unlimited locations',
      features: [
        'Enterprise operations & audit visibility',
        'SLA & brand compliance tracking',
        'Cross-region performance dashboards',
        'Franchisor reporting only',
      ],
      bestFor: '15–30 franchisees, brand & operations at scale',
      microcopy: 'Operations and brand visibility at scale.',
      popular: false,
    },
  ],
  both: [
    {
      id: 'cub',
      name: 'Cub',
      price: 99,
      userLimit: 'Up to 3 sales · Up to 10 locations',
      features: [
        'Lead management & franchisee visibility',
        'Proposal-to-outcome alignment',
        'Basic franchise performance view',
      ],
      bestFor: '1–5 franchisees, sales + operations oversight',
      microcopy: 'From win to visibility.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 249,
      userLimit: 'Up to 10 sales · Up to 50 locations',
      features: [
        'Sales enablement + operations visibility',
        'Franchisee performance dashboards',
        'Suggested standards & retention analytics',
      ],
      bestFor: '6–15 franchisees, growing network',
      microcopy: 'Scale franchise sales and operations together.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 499,
      userLimit: 'Unlimited sales & locations',
      features: [
        'End-to-end franchise visibility',
        'Multi-entity & region reporting',
        'Enterprise dashboards & suggested standards',
      ],
      bestFor: '15–30 franchisees, executive oversight',
      microcopy: 'Total visibility. Zero guesswork.',
      popular: false,
    },
  ],
};

// Unit Franchisee: like Owner/Operator but with corporate reporting and brand alignment.
const TIERS_UNIT_FRANCHISEE: Record<PlatformOption, TierDef[]> = {
  sales: [
    {
      id: 'cub',
      name: 'Cub',
      price: 79,
      userLimit: 'Up to 3 sales users',
      features: [
        'Lead intake & qualification',
        'Deal pipeline visibility',
        'Proposal & bid templates (brand-aligned)',
        'Basic sales reporting',
      ],
      bestFor: '1–5 employees, selling under the brand',
      microcopy: 'Stop winging bids. Start closing consistently.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 199,
      userLimit: 'Up to 10 sales users',
      features: [
        'Advanced pipeline stages',
        'Standardized pricing logic',
        'Proposal workflows & approvals',
        'Sales performance + corporate reporting',
      ],
      bestFor: '6–15 employees, multiple sellers',
      microcopy: 'Close faster without losing control.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 399,
      userLimit: 'Unlimited sales users',
      features: [
        'Multi-team or territory pipelines',
        'Brand-standard proposals',
        'Executive dashboards',
        'Franchisor / corporate reporting',
      ],
      bestFor: '15–30 employees, multi-location franchisee',
      microcopy: 'Sales visibility at scale.',
      popular: false,
    },
  ],
  ops: [
    {
      id: 'cub',
      name: 'Cub',
      price: 79,
      userLimit: 'Up to 10 field users',
      features: [
        'Inspection & QA workflows',
        'Issue tracking',
        'Basic accountability logs',
        'Supervisor visibility + corporate reporting',
      ],
      bestFor: '1–5 employees, hands-on management',
      microcopy: 'Know what\'s happening—without hovering.',
      popular: false,
    },
    {
      id: 'grizzly',
      name: 'Grizzly',
      price: 199,
      userLimit: 'Up to 50 field users',
      features: [
        'Advanced inspections & scoring',
        'Issue escalation workflows',
        'Performance by crew/location',
        'Proof-of-work + franchisor reporting',
      ],
      bestFor: '6–15 employees, recurring contracts',
      microcopy: 'Prove performance. Retain contracts.',
      popular: true,
    },
    {
      id: 'kodiak',
      name: 'Kodiak',
      price: 399,
      userLimit: 'Unlimited field users',
      features: [
        'Enterprise QA & audit trails',
        'SLA & compliance tracking',
        'Cross-location dashboards',
        'Corporate / franchisor reporting',
      ],
      bestFor: '15–30 employees, brand compliance',
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
        'Basic performance + corporate reporting',
      ],
      bestFor: '1–5 employees wearing multiple hats',
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
        'Performance & retention + franchisor reporting',
      ],
      bestFor: '6–15 employees, growing fast',
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
        'Enterprise dashboards & brand compliance',
      ],
      bestFor: '15–30 employees, franchise systems',
      microcopy: 'Total visibility. Zero guesswork.',
      popular: false,
    },
  ],
};

const TIERS_BY_MODEL_AND_PLATFORM: Record<BusinessModel, Record<PlatformOption, TierDef[]>> = {
  'owner-operator': TIERS_OWNER_OPERATOR,
  'area-franchisor': TIERS_AREA_FRANCHISOR,
  'unit-franchisee': TIERS_UNIT_FRANCHISEE,
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
  const tiers = getTiersByModelAndPlatform(businessModel, platform);

  const modelLabel =
    businessModel === 'owner-operator'
      ? 'Owner / Operator'
      : businessModel === 'area-franchisor'
        ? 'Area Franchisor'
        : businessModel === 'unit-franchisee'
          ? 'Unit Franchisee'
          : null;

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

  const platformOptions = getPlatformOptions(businessModel);
  const currentPlatform = platformOptions.find((o) => o.id === platform)!;

  return (
    <div id="pricing" className="scroll-mt-24">
      {/* Platform toggle only */}
      <div className="flex flex-wrap items-center gap-4 mb-12">
        <div className="flex rounded-lg bg-zinc-900/60 border border-zinc-800 p-0.5">
          {platformOptions.map((opt) => (
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

      {/* Clear context: which business model drives Cub / Grizzly / Kodiak differences */}
      <div className="mb-10 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/80 max-w-2xl">
        <p className="text-sm font-semibold text-white mb-1">
          {modelLabel ? (
            <>Plans for <span className="text-amber-400">{modelLabel}</span></>
          ) : (
            <>Choose your business model above to see the right plans</>
          )}
        </p>
        <p className="text-zinc-400 text-sm">
          {currentPlatform.label}: {currentPlatform.description}
        </p>
        {modelLabel && (
          <p className="text-xs text-zinc-500 mt-2">
            Cub, Grizzly, and Kodiak vary by model—limits and features are tailored to how you operate.
          </p>
        )}
      </div>

      {/* Pricing tiers + HelpHubQR */}
      <div className="flex flex-col lg:flex-row gap-10 items-start">
        <div className="flex-1 w-full min-w-0">
          {/* Billing toggle: just above the cards */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
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
            {billingInterval === 'annual' && (
              <span className="text-xs text-zinc-500">Save 2 months when you pay annually</span>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier) => (
              <Card
                key={`${platform}-${tier.id}`}
                className={
                  dark
                    ? `relative bg-zinc-900/60 border-2 flex flex-col overflow-hidden ${tier.popular ? 'border-amber-500/50 shadow-lg shadow-amber-500/5' : 'border-zinc-800 hover:border-zinc-700'}`
                    : `relative flex flex-col ${tier.popular ? 'border-2 border-primary/50 shadow-lg' : ''}`
                }
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
                )}
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className={dark ? 'text-xl text-white' : 'text-xl'}>{tier.name}</CardTitle>
                    {tier.popular && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-400/40">
                        Most popular
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">{tier.userLimit}</p>
                  <p className="text-sm text-amber-400/90 mt-2 font-medium">{tier.microcopy}</p>
                  <div className="mt-5">
                    {billingInterval === 'monthly' ? (
                      <>
                        <span className={dark ? 'text-3xl font-bold text-white tracking-tight' : 'text-3xl font-bold tracking-tight'}>
                          ${tier.price}
                        </span>
                        <span className="text-zinc-500 text-base ml-1">/mo</span>
                      </>
                    ) : (
                      <>
                        <span className="text-zinc-500 text-sm line-through mr-2">
                          ${tier.price}/mo
                        </span>
                        <span className={dark ? 'text-3xl font-bold text-white tracking-tight' : 'text-3xl font-bold tracking-tight'}>
                          ${tier.price * ANNUAL_MONTHS_BILLED}
                        </span>
                        <span className="text-zinc-500 text-base ml-1">/yr</span>
                        <span className="text-emerald-400/90 text-sm block mt-1 font-medium">
                          Save 2 months
                        </span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-6 flex-1">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-3">What&apos;s included</p>
                  <ul className="space-y-3 text-sm text-zinc-300">
                    {tier.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <p className="text-xs font-medium text-zinc-500 mb-0.5">Best for</p>
                    <p className="text-sm text-zinc-300">{tier.bestFor}</p>
                  </div>
                </CardContent>
                <CardFooter className="pt-6 pb-6 px-6">
                  <Button
                    className={dark ? `w-full h-12 text-base font-semibold border-0 ${tier.popular ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-zinc-700 text-white hover:bg-zinc-600'}` : 'w-full h-12'}
                    variant={dark ? undefined : tier.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleCheckout(tier.id)}
                    disabled={!!loading}
                  >
                    {loading === tier.id ? 'Processing...' : 'Get Started'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            More than 30 employees?{' '}
            <a href="/contact" className="text-amber-400/90 hover:text-amber-400 underline">
              Contact us for pricing
            </a>
          </p>
        </div>

        <div className="w-full lg:w-64 shrink-0 space-y-4">
          {showHelpHubQR && <HelpHubQRUpsell />}
          <LidarUpgrade />
        </div>
      </div>
    </div>
  );
}
