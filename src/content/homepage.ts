/**
 * Homepage copy — single source of truth for janibear.com landing.
 * Edit here to change messaging without touching layout code.
 */

export const HOMEPAGE = {
  hero: {
    h1: 'The Operating System for Commercial Cleaning.',
    subhead: 'Win bids. Keep accounts. Catch margin leaks. One command center.',
    ctaPrimary: 'Get a Private Demo',
    ctaSecondary: 'Learn More',
    trial: 'Monthly or yearly plans. Cancel anytime. 14-day free trial.',
    trialBullets: [
      'Monthly or yearly plans.',
      'Cancel anytime.',
      '14-day free trial.',
    ] as const,
  },

  proofStrip: {
    headline: 'Built by Operators.',
    subline: 'Not Venture Capital.',
    tagline: 'JANIBEAR wasn\'t built in a boardroom. It was built inside a commercial cleaning company.',
    yearsHeading: '20+ YEARS IN THE FIELD.',
    fieldBullets: [
      "We've bid buildings.",
      'Managed crews.',
      'Fixed failed inspections.',
      'Lost sleep over client expectations.',
    ] as const,
    needParagraph: "We didn't need another generic software tool. We needed a system that wins contracts, enforces accountability, and protects client relationships long term.",
    soWeBuiltIt: 'So we built it.',
    checkItems: [
      '20+ Years Operating',
      'Built Inside a Cleaning Company',
      'Designed for Commercial Cleaners',
    ] as const,
    trustedLine: 'Trusted by operators who actually clean buildings.',
  },

  platformModel: {
    headline: 'One system. Sales, operations, intelligence.',
    subhead: 'Not a CRM with a calendar—the command center for commercial cleaning.',
    steps: [
      { title: 'Sales', description: 'Walkthrough to signed contract. AI scope, proposals, follow-ups.' },
      { title: 'Operations', description: 'Crews, inspections, compliance. Deliver clean and consistent service.' },
      { title: 'Intelligence', description: 'Account health, margin signals, KPI command center.' },
    ] as const,
  },

  modules: {
    headline: 'Modules that fit how you run.',
    subhead: 'Explore what matters. Depth lives on each module.',
    items: [
      { name: 'Sales', value: 'Walkthrough to close. Proposals, follow-ups, pipeline.', href: '/demo' },
      { name: 'Operations', value: 'Inspections, crews, schedules. One place for delivery.', href: '/demo' },
      { name: 'Proposals', value: 'AI scope and pricing. Branded proposals in minutes.', href: '/demo' },
      { name: 'Inspections & QA', value: 'Consistent scoring, photo proof, issue resolution.', href: '/demo' },
      { name: 'Command Center', value: 'KPIs, account health, margin. See risk before it hits P&L.', href: '/demo' },
    ] as const,
  },

  whyWins: {
    headline: 'Why JANIBEAR wins',
    bullets: [
      'Built in the field—20+ years operating, not in a boardroom.',
      'Sales and operations in one system—no disconnected tools.',
      'Account health and margin visibility—catch decay before churn.',
      'AI that handles scope and proposals so you focus on winning.',
    ] as const,
    comparison: [
      { other: 'Built in a boardroom', janibear: 'Built in the field—20+ years operating.' },
      { other: 'Disconnected tools', janibear: 'Sales and operations in one system.' },
      { other: 'Reactive—see decay after churn', janibear: 'Account health and margin visibility—catch decay before churn.' },
      { other: 'Manual scope and proposals', janibear: 'AI that handles scope and proposals so you focus on winning.' },
    ] as const,
  },

  whoItsFor: {
    headline: 'Who it\'s for',
    subhead: 'Whether you sell, operate, franchise, or scale—JANIBEAR adapts to your model.',
    personas: [
      { name: 'Independent Owner/Operator', description: 'Sales + ops + employees. Local or regional. Hands-on ownership.', href: '/survey' },
      { name: 'Franchisors & Unit Franchisees', description: 'Lead management, sales enablement, franchise performance visibility.', href: '/survey' },
      { name: 'Enterprise / Multi-Location', description: 'Corporate reporting, employee accountability, scale across sites.', href: '/survey' },
    ] as const,
  },

  trust: {
    headline: 'Finally — A System That Enforces Accountability',
    subhead: '',
    quote: "We've been in business for 17 years and manage 142 accounts across Phoenix, AZ. Before implementing this system, our close rate hovered around 28% and client churn was a constant issue. Within 6 months, our close rate increased by 19%, and we saw a 32% drop in service-related complaints. It's given us structure, accountability, and a clear competitive edge.",
    attribution: '— Owner, Commercial Cleaning Company',
    attributionLocation: 'Phoenix, Arizona',
  },

  finalCta: {
    headline: 'See the command center',
    subhead: 'Get a live walkthrough. We\'ll show you how JANIBEAR wins contracts, keeps accounts, and protects margin.',
    cta: 'Get a Private Demo',
  },
} as const;
