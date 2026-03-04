'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PricingPlanCard } from '@/components/marketing/PricingPlanCard';
import { PricingAddonCard } from '@/components/marketing/PricingAddonCard';
import {
  PLANS,
  ADDONS,
  ROI_METRICS,
} from '@/lib/pricing';

export default function PricingPage() {
  return (
    <div className="landing-page min-h-screen text-white">
      <div className="landing-page-network-lines absolute inset-0 pointer-events-none" aria-hidden />
      <nav className="relative z-10 landing-header border-b border-white/5 bg-[#0B0B0F]/95 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.png"
              alt="JANIBEAR"
              width={200}
              height={66}
              className="h-12 w-auto object-contain md:h-14"
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-3 md:gap-6">
            <Link href="/demo">
              <Button size="sm" className="landing-cta rounded-lg font-semibold text-white">
                Get Started
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-0">
        {/* Section 1: Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 md:pt-28 md:pb-24 text-center">
          <motion.h1
            className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Simple Pricing for Growing Cleaning Companies
          </motion.h1>
          <motion.p
            className="mt-6 text-lg text-gray-400 leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            JANIBEAR scales with your team — from field crews to multi-location operations.
          </motion.p>
          <motion.p
            className="mt-4 text-sm font-medium text-zinc-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            Built by operators. Designed to scale.
          </motion.p>
        </section>

        <hr className="landing-section-divider" />
        {/* Section 2: Role-based plans */}
        <section
          className="relative mx-auto max-w-7xl px-6 py-16 md:py-24"
          aria-labelledby="plans-heading"
        >
          <header className="mx-auto max-w-2xl text-center">
            <h2 id="plans-heading" className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Role-based plans
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Price by who uses it — not by how fast you grow.
            </p>
          </header>
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8 lg:gap-10">
            {PLANS.map((plan) => (
              <PricingPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </section>

        <hr className="landing-section-divider" />
        {/* Section 3: Platform Add-ons */}
        <section
          className="relative mx-auto max-w-7xl px-6 py-16 md:py-24"
          aria-labelledby="addons-heading"
        >
          <header className="mx-auto max-w-2xl text-center">
            <h2 id="addons-heading" className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Platform Add-Ons
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              Turn JANIBEAR into a complete operating system.
            </p>
          </header>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {ADDONS.map((addon) => (
              <PricingAddonCard key={addon.id} addon={addon} />
            ))}
          </div>
        </section>

        {/* Section 4: ROI strip */}
        <section
          className="relative overflow-hidden py-16 md:py-20"
          aria-labelledby="roi-heading"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-amber-500/5" />
          <div className="relative mx-auto max-w-5xl px-6 text-center">
            <h2 id="roi-heading" className="font-heading text-2xl font-bold text-white md:text-3xl">
              Win just one contract — JANIBEAR pays for itself
            </h2>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4 md:gap-6">
              {ROI_METRICS.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-sm min-w-[140px]"
                >
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {metric.label}
                  </p>
                  <p className="mt-1 font-heading text-xl font-bold tabular-nums text-white md:text-2xl">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="landing-section-divider" />
        {/* Section 5: Enterprise CTA */}
        <section
          className="relative mx-auto max-w-4xl px-6 py-20 md:py-28"
          aria-labelledby="enterprise-heading"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-14 text-center">
            <h2 id="enterprise-heading" className="font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white">
              Enterprise
            </h2>
            <p className="mt-4 text-lg text-gray-400">
              For multi-region operators, franchises, and large teams.
            </p>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-zinc-300" role="list">
              <li>Volume pricing for 200+ crew</li>
              <li>Dedicated onboarding</li>
              <li>Custom integrations</li>
              <li>Priority support</li>
            </ul>
            <div className="mt-10">
              <Button
                asChild
                size="lg"
                className="landing-cta landing-cta-lg rounded-xl font-semibold text-white"
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
