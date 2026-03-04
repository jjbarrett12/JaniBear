'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Menu, X } from 'lucide-react';
import { HeroBackdropImage } from '@/components/landing/hero-backdrop-image';
import { HeroCenterImage } from '@/components/landing/hero-center-image';
import { HOMEPAGE } from '@/content/homepage';
import { SalesInfrastructureSection } from '@/components/landing/SalesInfrastructureSection';
import { OperationsControlSection } from '@/components/landing/OperationsControlSection';
import { SalesOpsResultsSection } from '@/components/landing/SalesOpsResultsSection';
import { BuiltByOperatorsSection } from '@/components/landing/BuiltByOperatorsSection';
import PersonaSection from '@/components/marketing/persona-section';
import { ConversionWorkflowSection } from '@/components/marketing/ConversionWorkflowSection';
import TrustSection from '@/components/landing/TrustSection';
import FinalCtaSection from '@/components/landing/FinalCtaSection';

export default function Home() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // If Supabase sent a password-reset or auth link to the Site URL (homepage), send to the right place
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    const { pathname, hash, search } = window.location;
    if (pathname !== '/' || (!hash && !search)) return;
    const hasCode = search && search.includes('code=');
    const isRecoveryHash =
      hash && (hash.includes('type=recovery') || hash.includes('access_token=') || hash.includes('recovery'));
    const isRecoveryQuery =
      search && (search.includes('type=recovery') || search.includes('access_token=') || search.includes('recovery'));
    if (hasCode) {
      const qs = search.replace(/^\?/, '');
      window.location.replace(`/auth/callback?${qs}${qs ? '&' : ''}next=${encodeURIComponent('/auth/reset-password')}`);
    } else if (isRecoveryHash || isRecoveryQuery) {
      window.location.replace(`/auth/reset-password${search}${hash}`);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navClassName =
    'landing-header sticky top-0 z-50 h-14 md:h-16 py-0 flex items-center overflow-visible transition-all duration-300 text-white bg-[#0B0B0F]/95 backdrop-blur-md border-b border-white/5' +
    (navScrolled ? ' landing-header-scrolled shadow-lg shadow-black/20' : '');

  const content = (
    <div className="landing-page min-h-screen text-white pb-20 md:pb-0">
      {/* Layer 3: animated network lines */}
      <div className="landing-page-network-lines" aria-hidden />
      <nav className={navClassName}>
        <div className="container relative mx-auto px-4 h-full flex items-center justify-between gap-4 min-h-0">
          <Link href="/" className="landing-logo-wrap flex items-center shrink-0 bg-transparent text-white [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/logo.png"
              alt="JANIBEAR"
              width={320}
              height={104}
              className="landing-logo w-auto object-contain object-left bg-transparent"
              priority
              unoptimized
            />
          </Link>
          {/* Desktop: nav categories centered in the middle of the bar */}
          <div className="hidden md:flex absolute left-1/2 top-0 h-full -translate-x-1/2 items-center gap-1 lg:gap-2 text-white">
            <Link href="/pricing" className="text-white hover:text-white">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3 text-white hover:text-white hover:bg-white/10">
                Pricing
              </Button>
            </Link>
            <Link href="/survey" className="text-white hover:text-white">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3 text-white hover:text-white hover:bg-white/10">
                Plans
              </Button>
            </Link>
            <Link href="/#sales-infrastructure" className="text-white hover:text-white">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3 text-white hover:text-white hover:bg-white/10">
                What It Does
              </Button>
            </Link>
            <Link href="/demo" className="text-white hover:text-white">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3 text-white hover:text-white hover:bg-white/10">
                See It In Action
              </Button>
            </Link>
            <Link href="/#operations-control" className="text-white hover:text-white">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3 text-white hover:text-white hover:bg-white/10">
                Features
              </Button>
            </Link>
            <Link href="/contact" className="text-white hover:text-white">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3 text-white hover:text-white hover:bg-white/10">
                Contact
              </Button>
            </Link>
          </div>
          {/* Desktop: Sign in + primary CTA — right side */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0 ml-auto text-white">
            <Link href="/auth/login" className="landing-nav-link landing-nav-link-text text-sm font-medium shrink-0 h-9 flex items-center px-3 hover:underline text-white hover:text-white">
              Sign in
            </Link>
            <Link href="/demo">
              <Button size="sm" className="landing-cta shrink-0 h-10 px-4 md:px-5 font-semibold">
                See the Command Center
              </Button>
            </Link>
          </div>
          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden landing-nav-link p-2 rounded-md -mr-2 text-white hover:text-white hover:bg-white/10"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile hamburger overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[100] md:hidden"
          aria-modal="true"
          role="dialog"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-black border-l border-amber-400/30 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-amber-400/30">
              <span className="text-sm font-medium text-zinc-400">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Pricing
              </Link>
              <Link href="/survey" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Plans
              </Link>
              <Link href="/#sales-infrastructure" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                What It Does
              </Link>
              <Link href="/demo" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                See It In Action
              </Link>
              <Link href="/#operations-control" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Features
              </Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Contact
              </Link>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-zinc-400 text-sm hover:text-white hover:bg-white/10 rounded-lg mt-2">
                Sign in
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Sticky bottom CTA — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 safe-bottom bg-black/95 border-t border-amber-400/30 backdrop-blur md:hidden">
        <Link href="/demo" className="block w-full">
          <Button className="landing-cta w-full h-12 text-base font-semibold rounded-lg">
            See the Command Center
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 1. HERO — lighter overlays so backdrop (e.g. janitorial floor signs) stays visible */}
      <section className="relative w-full overflow-hidden pt-8 md:pt-10 pb-10 md:pb-12 flex flex-col">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <HeroBackdropImage />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/45 via-[#0a0f1a]/35 to-black/75" />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] max-w-7xl h-[95%] bg-gradient-radial-hero opacity-25" />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] hero-noise" aria-hidden />

        <div className="relative container mx-auto px-4 max-w-6xl flex flex-col items-center pt-0 md:pt-1">
          <h1
            className="text-center max-w-4xl mx-auto font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight hero-headline"
          >
            The <span className="hero-headline-gradient">Operating System</span> for Commercial Cleaning.
          </h1>
          <p className="text-center max-w-xl mx-auto mt-2 md:mt-3 text-zinc-100 text-base md:text-lg font-semibold hero-subhead">
            {HOMEPAGE.hero.subhead}
          </p>

          <div className="w-full flex justify-center mt-1 md:mt-2 -translate-y-10 md:-translate-y-16 relative z-10">
            <HeroCenterImage />
          </div>

          <div className="-mt-27 md:-mt-36 mb-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-amber-300 text-center mb-3">Command center · Today</p>
            <div className="flex flex-wrap items-stretch justify-center gap-3">
              <div className="rounded-xl border-2 border-cyan-400/80 bg-cyan-500/10 backdrop-blur-sm px-5 py-3 min-w-[110px] text-center shadow-[0_0_16px_rgba(34,211,238,0.25)]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300 block mb-0.5">Buildings cleaned today</span>
                <span className="text-xl font-bold tabular-nums text-white tracking-tight">24</span>
              </div>
              <div className="rounded-xl border-2 border-amber-400/80 bg-amber-500/10 backdrop-blur-sm px-5 py-3 min-w-[110px] text-center shadow-[0_0_16px_rgba(251,191,36,0.25)]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300 block mb-0.5">Inspections due</span>
                <span className="text-xl font-bold tabular-nums text-amber-300 tracking-tight">3</span>
              </div>
              <div className="rounded-xl border-2 border-rose-400/80 bg-rose-500/10 backdrop-blur-sm px-5 py-3 min-w-[110px] text-center shadow-[0_0_16px_rgba(251,113,133,0.25)]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300 block mb-0.5">Accounts below health</span>
                <span className="text-xl font-bold tabular-nums text-rose-300 tracking-tight">5</span>
              </div>
              <div className="rounded-xl border-2 border-emerald-400/80 bg-emerald-500/10 backdrop-blur-sm px-5 py-3 min-w-[110px] text-center shadow-[0_0_16px_rgba(52,211,153,0.25)]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300 block mb-0.5">Revenue today</span>
                <span className="text-xl font-bold tabular-nums text-emerald-300 tracking-tight">$9,912</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Link href="/demo">
              <Button size="lg" className="landing-cta landing-cta-lg text-base font-semibold px-10 min-h-[58px] rounded-xl shadow-[0_4px_32px_rgba(250,204,21,0.5)] hover:shadow-[0_8px_40px_rgba(250,204,21,0.6)] transition-all duration-200 active:scale-[0.99]">
                {HOMEPAGE.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#sales-infrastructure">
              <Button variant="outline" size="lg" className="landing-cta-secondary border-2 border-amber-400 text-amber-300 hover:bg-amber-400/10 hover:border-amber-300 hover:text-amber-200 h-12 px-6 rounded-xl font-medium">
                {HOMEPAGE.hero.ctaSecondary}
              </Button>
            </Link>
          </div>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 mt-6">
            {HOMEPAGE.hero.trialBullets.map((line) => (
              <li key={line} className="flex items-center gap-2 text-sm text-amber-200/95">
                <Check className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. How it works — visual workflow / conversion */}
      <ConversionWorkflowSection />

      {/* 3. Who it's for — persona cards (below the fold) */}
      <PersonaSection />
      <hr className="landing-section-divider" />

      {/* 3. Sales Infrastructure — category-defining differentiator */}
      <SalesInfrastructureSection />

      {/* 4. Operations Control — protect the revenue */}
      <OperationsControlSection />
      <hr className="landing-section-divider" />

      {/* 5. Conversion workflow — Scan → Scope → Price → Proposal → Win → Execute */}
      <ConversionWorkflowSection />
      <hr className="landing-section-divider" />

      {/* Review / Trust */}
      <TrustSection />

      {/* Built by Operators — premium two-column + glass card */}
      <BuiltByOperatorsSection />
      <hr className="landing-section-divider" />

      {/* Results (Sales/Ops), Why, Who, Final CTA */}
      <SalesOpsResultsSection />
      <hr className="landing-section-divider" />
      <FinalCtaSection />
    </div>
  );

  return content;
}
