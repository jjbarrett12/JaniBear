'use client';

import Link from 'next/link';
import { ClipboardCheck, Network, Building2, ArrowRight } from 'lucide-react';

const PERSONAS = [
  {
    id: 'operators',
    title: 'Independent Operators',
    description:
      'Run your entire cleaning business without hiring another manager. JANIBEAR centralizes proposals, inspections, crews, and reporting so you spend less time managing and more time growing.',
    bullets: [
      'AI Proposal Builder',
      'QR Inspection Tracking',
      'Crew Accountability',
      'Client Reporting',
    ],
    cta: 'See How Operators Use JANIBEAR',
    ctaHref: '/demo',
    icon: ClipboardCheck,
    accent: 'amber' as const,
    popular: false,
  },
  {
    id: 'franchise',
    title: 'Franchisors & Franchisees',
    description:
      'Standardize how every location sells, inspects, and reports. JANIBEAR gives corporate full visibility while empowering franchise owners with the tools they need to grow.',
    bullets: [
      'Franchise Performance Dashboards',
      'Territory Lead Routing',
      'Brand Standard Inspections',
      'Corporate Reporting',
    ],
    cta: 'Explore the Franchise System',
    ctaHref: '/demo',
    icon: Network,
    accent: 'cyan' as const,
    popular: true,
  },
  {
    id: 'enterprise',
    title: 'Enterprise Cleaning Companies',
    description:
      'Operate thousands of sites with real-time operational intelligence. JANIBEAR replaces manual reporting with automated inspections, crew accountability, and executive dashboards.',
    bullets: [
      'Multi-Site Reporting',
      'Regional Operations Dashboards',
      'Compliance Tracking',
      'Executive Analytics',
    ],
    cta: 'See Enterprise Capabilities',
    ctaHref: '/demo',
    icon: Building2,
    accent: 'purple' as const,
    popular: false,
  },
];

const TIERS = [
  { name: 'Cub', label: 'Independent Operators' },
  { name: 'Grizzly', label: 'Regional Cleaning Companies' },
  { name: 'Kodiak', label: 'Franchise & Enterprise' },
];

const accentStyles = {
  amber: {
    iconBg: 'bg-amber-500/10 border-amber-400/25 shadow-[0_0_24px_rgba(245,158,11,0.12)]',
    iconColor: 'text-amber-400',
  },
  cyan: {
    iconBg: 'bg-cyan-500/10 border-cyan-400/25 shadow-[0_0_24px_rgba(34,211,238,0.12)]',
    iconColor: 'text-cyan-400',
  },
  purple: {
    iconBg: 'bg-violet-500/10 border-violet-400/25 shadow-[0_0_24px_rgba(139,92,246,0.12)]',
    iconColor: 'text-violet-400',
  },
} as const;

function PersonaCard({
  persona,
  index,
}: {
  persona: (typeof PERSONAS)[number];
  index: number;
}) {
  const Icon = persona.icon;
  const styles = accentStyles[persona.accent];

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border bg-zinc-900 p-8 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-2xl md:min-h-[420px] ${persona.popular ? 'border-cyan-400/25 md:min-h-[440px] md:shadow-[0_0_40px_rgba(34,211,238,0.06)]' : 'border-zinc-800'}`}
    >
      {/* Primary card: slightly larger / emphasized */}
      {persona.popular && (
        <div className="absolute top-4 right-4 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Most Popular
        </div>
      )}

      <div
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg} ${styles.iconColor} mb-6 transition-transform duration-300 group-hover:scale-105`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <h3 className="font-heading text-xl font-semibold tracking-tight text-white">
        {persona.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">
        {persona.description}
      </p>

      <ul className="mt-6 space-y-2.5">
        {persona.bullets.map((bullet) => (
          <li
            key={bullet}
            className="flex items-center gap-2 text-sm text-zinc-300"
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${persona.accent === 'amber' ? 'bg-amber-400' : persona.accent === 'cyan' ? 'bg-cyan-400' : 'bg-violet-400'}`}
              aria-hidden
            />
            {bullet}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <Link
          href={persona.ctaHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {persona.cta}
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>

      {/* Hover border glow */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl border opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${persona.accent === 'amber' ? 'border-amber-400/30' : persona.accent === 'cyan' ? 'border-cyan-400/40' : 'border-violet-400/30'}`}
        aria-hidden
      />
    </div>
  );
}

export function PersonaSection() {
  return (
    <section
      id="who-its-for"
      className="relative border-t border-zinc-800/80 bg-zinc-950 py-24"
      aria-labelledby="persona-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Headline */}
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id="persona-heading"
            className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            Built for Every Janitorial Business Model
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400 md:text-xl">
            Whether you&apos;re an independent operator, a franchise system, or a
            national cleaning company, JANIBEAR unifies sales, operations,
            inspections, and accountability in one platform.
          </p>
        </div>

        {/* Persona cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {PERSONAS.map((persona, index) => (
            <div
              key={persona.id}
              className="animate-fade-in-up opacity-0"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: 'forwards',
              }}
            >
              <PersonaCard persona={persona} index={index} />
            </div>
          ))}
        </div>

        {/* Tier row */}
        <div className="mt-20 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-6 py-8 md:px-10">
          <h3 className="text-center font-heading text-lg font-semibold text-white md:text-xl">
            JANIBEAR grows with you
          </h3>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className="flex flex-col items-center gap-1 text-center"
              >
                <span className="font-semibold text-white">{tier.name}</span>
                <span className="text-sm text-zinc-500">{tier.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
