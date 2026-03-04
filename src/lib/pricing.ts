/**
 * Pricing page data — plans, add-ons, and ROI metrics.
 * Single source of truth for /pricing.
 */

export interface PricingPlan {
  id: string;
  name: string;
  label: string;
  price: string;
  suffix: string;
  bullets: readonly string[];
  cta: string;
  ctaHref: string;
  mostPopular?: boolean;
}

export interface PricingAddon {
  id: string;
  name: string;
  price: string;
  suffix: string;
  bullets: readonly string[];
  badge?: string;
}

export interface RoiMetric {
  label: string;
  value: string;
}

export const PLANS: readonly PricingPlan[] = [
  {
    id: 'cub',
    name: 'Cub',
    label: 'Field Crew',
    price: '$9',
    suffix: '/ user / month',
    bullets: [
      'Nightly checklists',
      'Photo proof & issue capture',
      'QR issue reporting',
      'Mobile crew app',
      'Basic inspections',
    ],
    cta: 'Start with Cub',
    ctaHref: '/demo',
  },
  {
    id: 'grizzly',
    name: 'Grizzly',
    label: 'Sales & Estimating',
    price: '$89',
    suffix: '/ user / month',
    bullets: [
      'Walkthrough capture',
      'Proposal builder',
      'Pipeline tracking',
      'Client CRM',
      'Margin tracking',
    ],
    cta: 'Start with Grizzly',
    ctaHref: '/demo',
    mostPopular: true,
  },
  {
    id: 'kodiak',
    name: 'Kodiak',
    label: 'Operations & Management',
    price: '$129',
    suffix: '/ user / month',
    bullets: [
      'Contract performance dashboards',
      'Inspection analytics',
      'Crew performance tracking',
      'Client reporting',
      'Multi-location oversight',
    ],
    cta: 'Start with Kodiak',
    ctaHref: '/demo',
  },
] as const;

export const ADDONS: readonly PricingAddon[] = [
  {
    id: 'lidar',
    name: 'LiDAR Facility Mapping',
    price: '$199',
    suffix: '/ company / month',
    bullets: [
      'Unlimited LiDAR scans',
      'Automatic square footage',
      'Room mapping & zones',
      'Surface detection',
      'Scope builder integration',
    ],
    badge: 'Native LiDAR',
  },
  {
    id: 'ai-proposal',
    name: 'AI Proposal Engine',
    price: '$29',
    suffix: '/ user / month',
    bullets: [
      'Auto scope language',
      'Proposal templates',
      'Pricing suggestions',
      'Export-ready proposals',
    ],
  },
  {
    id: 'helphub',
    name: 'HelpHub QR',
    price: '$29',
    suffix: '/ location / month',
    bullets: [
      'QR issue reporting',
      'Client portal',
      'Real-time alerts',
      'Issue tracking',
    ],
  },
] as const;

export const ROI_METRICS: readonly RoiMetric[] = [
  { label: 'Avg contract', value: '$3,500/mo' },
  { label: 'Annual revenue', value: '$42,000' },
  { label: 'Typical JANIBEAR cost', value: '~$12,000/yr' },
  { label: 'ROI', value: '3.5×' },
] as const;
