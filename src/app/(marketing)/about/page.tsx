'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

const SEE_IT_IN_ACTION_HREF = '/demo';
const VIEW_PRICING_HREF = '/pricing';

const ORIGIN_STEPS = [
  { label: 'Tried CRMs' },
  { label: 'Too much customization' },
  { label: 'Built JANIBEAR' },
];

const PRINCIPLES = [
  { title: 'Account retention is the product.', supporting: "If you can't prove the work, you can't protect the account." },
  { title: 'The work must be provable.', supporting: 'Inspections, photos, and documentation should be effortless — and defensible.' },
  { title: 'Crews need simplicity. Managers need control.', supporting: 'Fast checklists in the field. Real visibility for supervisors.' },
  { title: "If it doesn't work in the field, it doesn't ship.", supporting: 'Real-world workflows beat theoretical features.' },
];

const PERSONAS = [
  { role: 'Owners & Executives', outcome: 'Protect margin. Retain accounts. Scale operations.', bullets: ['Visibility across accounts', 'Stronger client trust', 'Cleaner operations = higher retention'] },
  { role: 'Sales Teams', outcome: 'Win bids faster with confidence.', bullets: ['Standardized site walkthroughs', 'Faster proposals & scopes', 'Clear handoff into operations'] },
  { role: 'Ops & Supervisors', outcome: 'Enforce accountability without chaos.', bullets: ['Inspections & proof-of-work', 'Repeatable standards by building', 'Fewer surprises, fewer callbacks'] },
];

const TRUST_BULLETS = [
  'Role-based access and clear permissions',
  'Designed for multi-location and franchise systems',
  'Operator-first workflows that reduce churn and callbacks',
];

export default function AboutPage() {
  return (
    <div className="landing-page min-h-screen text-white">
      <div className="landing-page-network-lines absolute inset-0 pointer-events-none" aria-hidden />
      <nav className="relative z-10 landing-header border-b border-white/5 bg-[#0B0B0F]/95 backdrop-blur-md sticky top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 py-4">
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
        {/* 1) HERO — two-column desktop, stacked mobile */}
        <section
          className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20"
          aria-labelledby="about-hero-heading"
        >
          {/* Hero background: soft radial glow + faint grid */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] max-w-4xl h-[80%] rounded-full bg-indigo-500/8 blur-[80px]" />
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center min-h-0">
            <div className="flex flex-col">
              <motion.h1
                id="about-hero-heading"
                className="font-heading text-4xl md:text-5xl font-bold tracking-tight text-white max-w-xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                Built Inside a Commercial Cleaning Company
              </motion.h1>
              <motion.p
                className="mt-6 text-sm md:text-base text-zinc-400 max-w-xl leading-relaxed"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
              >
                JANIBEAR wasn&apos;t built in a boardroom. It was built in the field — to win contracts, enforce accountability, and protect client relationships long-term.
              </motion.p>
              <motion.div
                className="mt-8 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Button asChild size="lg" className="landing-cta rounded-xl font-semibold text-white min-w-[160px] sm:min-w-[180px]">
                  <Link href={SEE_IT_IN_ACTION_HREF}>See it in action</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 min-w-[160px] sm:min-w-[180px]">
                  <Link href={VIEW_PRICING_HREF}>View pricing</Link>
                </Button>
              </motion.div>
            </div>

            {/* Operator Proof Panel */}
            <motion.div
              className="flex justify-center lg:justify-start"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="w-full max-w-md rounded-2xl border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full border-white/15 bg-white/5 text-zinc-300 font-medium px-3 py-1">
                    Operator-built
                  </Badge>
                  <Badge variant="secondary" className="rounded-full border-white/15 bg-white/5 text-zinc-300 font-medium px-3 py-1">
                    Account retention focus
                  </Badge>
                  <Badge variant="secondary" className="rounded-full border-white/15 bg-white/5 text-zinc-300 font-medium px-3 py-1">
                    Field-tested workflows
                  </Badge>
                </div>
                <div className="mt-4 inline-flex">
                  <span className="rounded-lg bg-indigo-500/15 border border-indigo-400/25 px-3 py-1.5 text-sm font-semibold text-indigo-300">
                    20+ Years in the Field
                  </span>
                </div>
                <p className="mt-4 text-xs text-zinc-500 font-medium uppercase tracking-wider">
                  Built inside a commercial cleaning company
                </p>
              </Card>
            </motion.div>
          </div>
        </section>

        <hr className="landing-section-divider mx-auto max-w-7xl" />

        {/* 2) WHY JANIBEAR EXISTS — split layout + timeline */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20" aria-labelledby="origin-heading">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
            <div>
              <h2 id="origin-heading" className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-white">
                Why JANIBEAR Exists
              </h2>
              <p className="mt-6 text-sm md:text-base text-zinc-400 leading-relaxed">
                We&apos;ve bid buildings, managed crews, fixed failed inspections, and carried the pressure of client expectations. When we went looking for software to run the business, we found generic CRMs and bloated platforms that required massive customization just to work for cleaning companies.
              </p>
              <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
                So we built the system we wished existed — purpose-built for operators.
              </p>
            </div>
            <Card className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 lg:max-w-sm">
              <div className="flex flex-col">
                {ORIGIN_STEPS.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-indigo-400/80 shrink-0 mt-1.5" />
                      {i < ORIGIN_STEPS.length - 1 && (
                        <div className="w-px flex-1 min-h-[24px] bg-white/15 mt-1" />
                      )}
                    </div>
                    <div className="pb-6 last:pb-0">
                      <span className="text-sm font-medium text-white">{step.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <hr className="landing-section-divider mx-auto max-w-7xl" />

        {/* 3) WHAT WE BELIEVE — 2x2 card grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20" aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-white text-center mb-10 md:mb-12">
            What We Believe
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6 list-none p-0 m-0">
            {PRINCIPLES.map((item, i) => (
              <li key={i}>
                <Card className="h-full rounded-2xl border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/30 min-h-[140px] md:min-h-[160px] border-t-2 border-t-indigo-400/30">
                  <CardHeader className="pb-2">
                    <h3 className="font-heading text-base md:text-lg font-semibold text-white">{item.title}</h3>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.supporting}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <hr className="landing-section-divider mx-auto max-w-7xl" />

        {/* 4) WHO IT'S FOR — 3 cards */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20" aria-labelledby="who-heading">
          <h2 id="who-heading" className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-white text-center mb-10 md:mb-12">
            Built for the people who run the work
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 list-none p-0 m-0">
            {PERSONAS.map((item, i) => (
              <li key={i}>
                <Card className="h-full rounded-2xl border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400/30">
                  <CardHeader className="pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400/90">{item.role}</p>
                    <h3 className="font-heading text-lg font-semibold text-white mt-2">{item.outcome}</h3>
                  </CardHeader>
                  <hr className="h-px border-0 bg-gradient-to-r from-transparent via-white/10 to-transparent mx-6 my-2" />
                  <CardContent className="pt-2">
                    <ul className="space-y-2 text-sm text-zinc-400">
                      {item.bullets.map((b, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-emerald-400/80 mt-0.5 shrink-0" aria-hidden>✓</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>

        <hr className="landing-section-divider mx-auto max-w-7xl" />

        {/* 5) BUILT FOR SERIOUS OPERATIONS — Trust Panel */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-20" aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-white text-center mb-8">
            Built for serious operations
          </h2>
          <Card className="rounded-2xl border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-6 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-indigo-400/80 shrink-0" aria-hidden />
              <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Trust</span>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
              {TRUST_BULLETS.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm md:text-base text-zinc-400">
                  <span className="text-indigo-400/80 mt-0.5 shrink-0" aria-hidden>•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </Card>
          <p className="mt-6 text-center text-sm text-zinc-500 max-w-xl mx-auto">
            Operator-first workflows designed to reduce churn and callbacks.
          </p>
          <p className="mt-4 text-center text-zinc-500 text-sm italic max-w-xl mx-auto">
            Your business runs on trust. Your software should help you prove it.
          </p>
        </section>

        <hr className="landing-section-divider mx-auto max-w-7xl" />

        {/* 6) FINAL CTA — full-width band */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 md:py-24" aria-labelledby="final-cta-heading">
          <div className="relative">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/30 via-white/10 to-indigo-500/30 blur-sm opacity-60" aria-hidden />
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/5 blur-3xl" aria-hidden />
            <Card className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-8 md:p-10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-indigo-500/5 pointer-events-none" aria-hidden />
              <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                <div>
                  <h2 id="final-cta-heading" className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-white">
                    Want to see how JANIBEAR runs a building?
                  </h2>
                  <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
                    Get a walkthrough of the workflows that help operators win contracts and keep accounts.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <Button asChild size="lg" className="landing-cta rounded-xl font-semibold text-white min-w-[160px] sm:min-w-[180px]">
                    <Link href={SEE_IT_IN_ACTION_HREF}>See it in action</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 min-w-[160px] sm:min-w-[180px]">
                    <Link href={VIEW_PRICING_HREF}>View pricing</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-300 transition-colors">
            ← Back to home
          </Link>
        </div>
      </footer>
    </div>
  );
}
