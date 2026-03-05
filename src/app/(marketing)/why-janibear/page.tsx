'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ComparisonTable } from '@/components/marketing/ComparisonTable';

export default function WhyJaniBearPage() {
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
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                Pricing
              </Button>
            </Link>
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
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 py-16 md:py-24 text-center">
          <motion.p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            Why JANIBEAR
          </motion.p>
          <motion.h1
            className="mt-4 font-heading text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            Built for commercial cleaning.
            <br />
            <span className="text-indigo-300">Not retrofitted.</span>
          </motion.h1>
          <motion.p
            className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            See how JANIBEAR compares to generic CRMs and point solutions. One platform for walkthroughs, scope, proposals, inspections, and ops.
          </motion.p>
        </section>

        {/* Comparison table */}
        <section className="mx-auto max-w-7xl px-6 py-12 md:py-20" aria-labelledby="comparison-heading">
          <h2 id="comparison-heading" className="sr-only">
            JANIBEAR vs competitors comparison
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <ComparisonTable />
          </motion.div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            ✓ Yes &nbsp; · &nbsp; − Partial / add-on &nbsp; · &nbsp; ✗ No. Based on typical use cases and public positioning. Product capabilities change; verify with each vendor.
          </p>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 py-16 md:py-24 text-center">
          <motion.div
            className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-10 md:p-14"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <h2 className="font-heading text-2xl md:text-3xl font-semibold text-white">
              Ready to run your cleaning business in one place?
            </h2>
            <p className="mt-3 text-zinc-400">
              Get a private demo or start with a plan that fits your team.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="landing-cta rounded-xl font-semibold text-white min-w-[200px]">
                <Link href="/demo">Get a Private Demo</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 min-w-[200px]">
                <Link href="/pricing">See Plans</Link>
              </Button>
            </div>
          </motion.div>
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
