'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LOGIN_URL } from '@/lib/auth-urls';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Hero } from '@/components/landing/Hero';
import { SalesInfrastructureSection } from '@/components/landing/SalesInfrastructureSection';
import { OperationsControlSection } from '@/components/landing/OperationsControlSection';
import { SalesOpsResultsSection } from '@/components/landing/SalesOpsResultsSection';
import { BuiltByOperatorsSection } from '@/components/landing/BuiltByOperatorsSection';
import PersonaSection from '@/components/marketing/persona-section';
import { DealPipeline } from '@/components/sections/DealPipeline';
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
          {/* Desktop: Sign in + primary CTA — right side (absolute URL so login works from PWA/workspace) */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0 ml-auto text-white">
            <a
              href={LOGIN_URL}
              className="landing-nav-link landing-nav-link-text text-sm font-medium shrink-0 h-9 flex items-center px-3 hover:underline text-white hover:text-white"
            >
              Sign in
            </a>
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
              <a
                href={LOGIN_URL}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-3 text-zinc-400 text-sm hover:text-white hover:bg-white/10 rounded-lg mt-2 block"
              >
                Sign in
              </a>
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

      {/* 1. HERO — motion layers, CTAs, trust bar, KPI strip (see Hero.tsx) */}
      <Hero />

      <hr className="landing-section-divider" />

      {/* 3. Who it's for — persona cards (below the fold) */}
      <PersonaSection />
      <hr className="landing-section-divider" />

      {/* 3. Sales Infrastructure — category-defining differentiator */}
      <SalesInfrastructureSection />

      {/* 4. Operations Control — protect the revenue */}
      <OperationsControlSection />
      <hr className="landing-section-divider" />

      {/* 5. Deal Pipeline — $0 → $8,000 contract transformation */}
      <DealPipeline />
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
