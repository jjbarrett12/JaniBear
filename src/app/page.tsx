'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { BrandName } from '@/components/ui/brand-name';
import { HeroBackdropImage } from '@/components/landing/hero-backdrop-image';
import { HeroCenterImage } from '@/components/landing/hero-center-image';
import { HOMEPAGE } from '@/content/homepage';
import PlatformModelSection from '@/components/landing/PlatformModelSection';
import ModulesGridSection from '@/components/landing/ModulesGridSection';
import WhyJanibearWinsSection from '@/components/landing/WhyJanibearWinsSection';
import WhoItsForSection from '@/components/landing/WhoItsForSection';
import TrustSection from '@/components/landing/TrustSection';
import FinalCtaSection from '@/components/landing/FinalCtaSection';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const proofRef = useRef<HTMLElement>(null);
  const [proofInView, setProofInView] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = proofRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setProofInView(e.isIntersecting),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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

  return (
    <>
    <div className="landing-page min-h-screen bg-black text-white pb-20 md:pb-0">
      <nav
        className={`landing-header sticky top-0 z-50 h-14 md:h-16 py-0 flex items-center overflow-visible transition-all duration-300 ${
          navScrolled ? 'landing-header-scrolled shadow-sm' : ''
        }`}
        style={{ backgroundColor: '#000' }}
      >
        <div className="container relative mx-auto px-4 h-full flex items-center justify-between gap-4 min-h-0">
          <Link href="/" className="landing-logo-wrap flex items-center shrink-0 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
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
          <div className="hidden md:flex absolute left-1/2 top-0 h-full -translate-x-1/2 items-center gap-1 lg:gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Pricing
              </Button>
            </Link>
            <Link href="/survey">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Plans
              </Button>
            </Link>
            <Link href="/#platform-model">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Platform
              </Button>
            </Link>
            <Link href="/#modules">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Modules
              </Button>
            </Link>
            <Link href="/#why-janibear-wins">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Why Janibear
              </Button>
            </Link>
            <Link href="/#who-its-for">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Who It's For
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Contact
              </Button>
            </Link>
          </div>
          {/* Desktop: Sign in + primary CTA — right side */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0 ml-auto">
            <Link href="/auth/login" className="landing-nav-link landing-nav-link-text text-sm font-medium shrink-0 h-9 flex items-center px-3 hover:underline">
              Sign in
            </Link>
            <Link href="/demo">
              <Button size="sm" className="landing-cta shrink-0 h-10 px-4 md:px-5 font-semibold">
                Get a Private Demo
              </Button>
            </Link>
          </div>
          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden landing-nav-link p-2 rounded-md -mr-2 text-zinc-400 hover:text-white hover:bg-white/10"
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
              <Link href="/#platform-model" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Platform
              </Link>
              <Link href="/#modules" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Modules
              </Link>
              <Link href="/#why-janibear-wins" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Why Janibear
              </Link>
              <Link href="/#who-its-for" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Who It's For
              </Link>
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Pricing
              </Link>
              <Link href="/survey" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Plans
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
            Get a Private Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* 1. HERO */}
      <section className="relative w-full overflow-hidden pt-8 md:pt-10 pb-10 md:pb-12 flex flex-col">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <HeroBackdropImage />
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/80 via-[#0a0f1a]/65 to-black/95" />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] max-w-7xl h-[95%] bg-gradient-radial-hero opacity-40" />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] hero-noise" aria-hidden />

        <div className="relative container mx-auto px-4 max-w-6xl flex flex-col items-center pt-0 md:pt-1">
          <h1
            className={`text-center max-w-4xl mx-auto font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight hero-headline transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '0ms' }}
          >
            The <span className="hero-headline-gradient">Operating System</span> for Commercial Cleaning.
          </h1>
          <p
            className={`text-center max-w-xl mx-auto mt-2 md:mt-3 text-zinc-100 text-base md:text-lg font-semibold hero-subhead transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '40ms' }}
          >
            {HOMEPAGE.hero.subhead}
          </p>

          <div
            className={`w-full flex justify-center mt-1 md:mt-2 transition-all duration-700 ${mounted ? 'opacity-100 -translate-y-10 md:-translate-y-16' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '80ms' }}
          >
            <HeroCenterImage />
          </div>

          <div
            className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-5 py-3 -mt-6 md:-mt-8 mb-2 rounded-xl bg-black/50 border border-white/10 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '120ms' }}
            aria-hidden
          >
            <span className="text-sm font-medium text-white tabular-nums">24 Buildings Today</span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-amber-400/95 tabular-nums">3 Margin Alerts</span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-emerald-400/95 tabular-nums">92% Account Health</span>
            <span className="text-zinc-500 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-white tabular-nums">$148K Monthly Recurring</span>
          </div>

          <div
            className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '160ms' }}
          >
            <Link href="/demo">
              <Button size="lg" className="landing-cta landing-cta-lg text-base font-semibold px-10 min-h-[58px] rounded-xl shadow-[0_4px_32px_rgba(250,204,21,0.5)] hover:shadow-[0_8px_40px_rgba(250,204,21,0.6)] transition-all duration-200 active:scale-[0.99]">
                {HOMEPAGE.hero.ctaPrimary}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#platform-model">
              <Button variant="outline" size="lg" className="landing-cta-secondary border-2 border-amber-400/50 text-zinc-200 hover:bg-white/5 hover:border-amber-400/70 h-12 px-6 rounded-xl font-medium">
                {HOMEPAGE.hero.ctaSecondary}
              </Button>
            </Link>
          </div>
          <p className={`text-sm text-zinc-500 mt-4 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {HOMEPAGE.hero.trial}
          </p>
        </div>
      </section>

      {/* 2. PROOF STRIP — Built by operators + stats */}
      <section
        ref={proofRef}
        className="relative border-t border-zinc-800/50 py-16 md:py-24 overflow-hidden"
        style={{ backgroundColor: '#0F1420' }}
        id="proof"
        aria-labelledby="proof-heading"
      >
        <div className="container relative mx-auto px-4 max-w-6xl">
          <div className={`text-center max-w-2xl mx-auto transition-all duration-700 ${proofInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 id="proof-heading" className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              {HOMEPAGE.proofStrip.headline} <span className="text-zinc-500">{HOMEPAGE.proofStrip.subline}</span>
            </h2>
            <p className="mt-4 text-zinc-400 text-base md:text-lg">{HOMEPAGE.proofStrip.tagline}</p>
            <p className="mt-2 text-amber-400/90 text-sm font-semibold uppercase tracking-wider">{HOMEPAGE.proofStrip.statLabel}</p>
          </div>
          <div className={`mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center transition-all duration-700 ${proofInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '150ms' }}>
            {HOMEPAGE.proofStrip.stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight tabular-nums">{stat.value}</p>
                <p className="text-sm font-semibold uppercase tracking-wider text-amber-400/90 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3–8: Platform, Modules, Why, Who, Trust, Final CTA */}
      <PlatformModelSection />
      <ModulesGridSection />
      <WhyJanibearWinsSection />
      <WhoItsForSection />
      <TrustSection />
      <FinalCtaSection />

      <footer className="bg-black text-zinc-400 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="[&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              <Image src="/logo.png" alt="JANIBEAR" width={220} height={72} className="h-14 md:h-16 w-auto mb-4 object-contain bg-transparent" unoptimized />
              <p className="text-sm text-zinc-500">
                The operating system for commercial cleaning. Win bids. Keep accounts. Catch margin leaks.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo" className="hover:text-white transition-colors">Get a Private Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">See Plans</Link></li>
                <li><Link href="/survey" className="hover:text-white transition-colors">Find Your Plan</Link></li>
                <li><Link href="/#platform-model" className="hover:text-white transition-colors">Platform</Link></li>
                <li><Link href="/#modules" className="hover:text-white transition-colors">Modules</Link></li>
                <li><Link href="/#why-janibear-wins" className="hover:text-white transition-colors">Why Janibear</Link></li>
                <li><Link href="/#who-its-for" className="hover:text-white transition-colors">Who It&apos;s For</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800 mt-8 pt-8 text-center text-sm text-zinc-500">
            <p>&copy; {new Date().getFullYear()} <BrandName />. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
