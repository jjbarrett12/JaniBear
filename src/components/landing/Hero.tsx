'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, Check, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroBackdropImage } from '@/components/landing/hero-backdrop-image';
import { HeroWithHotspots } from '@/components/landing/hero-with-hotspots';
import { HeroKpiStrip } from '@/components/landing/hero-kpi-strip';
import { HeroTrustBar } from '@/components/landing/hero-trust-bar';
import { HeroParticles } from '@/components/landing/HeroParticles';
import { HOMEPAGE } from '@/content/homepage';

export function Hero() {
  const reduceMotion = useReducedMotion();
  const motionOn = !reduceMotion;
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <section
      className="relative w-full overflow-hidden pt-6 md:pt-8 pb-8 md:pb-10 flex flex-col min-h-0"
      aria-labelledby="hero-heading"
    >
      {/* Background — subtle and cinematic */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 overflow-hidden">
          <HeroBackdropImage />
        </div>
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1a]/55 via-[#0a0f1a]/40 to-black/80" />
      </div>
      <div className="absolute inset-0 pointer-events-none hero-vignette" aria-hidden />
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] max-w-7xl h-[95%] bg-gradient-radial-hero hero-bg-breath" />
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] hero-noise" aria-hidden />
      {motionOn && (
        <HeroParticles />
      )}

      <div className="relative container mx-auto px-4 max-w-6xl flex flex-col items-center pt-0">
        <h1
          id="hero-heading"
          className="text-center max-w-4xl mx-auto font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight hero-headline"
        >
          The <span className="hero-headline-gradient">Operating System</span> for Commercial Cleaning.
        </h1>
        <p className="text-center max-w-xl mx-auto mt-2 md:mt-3 text-base md:text-lg font-semibold hero-subhead">
          {HOMEPAGE.hero.subhead}
        </p>

        {/* Trust bar — premium category proof (icons + labels) */}
        <div className="mt-4 md:mt-5">
          <HeroTrustBar />
        </div>

        {/* Device mockup with 3 hotspots (desktop only) */}
        <div className="w-full flex justify-center mt-2 md:mt-3 -translate-y-8 md:-translate-y-12 relative z-10">
          <HeroWithHotspots />
        </div>

        {/* KPI strip — glassy, minimal, animated counts */}
        <div className="-mt-24 md:-mt-28 mb-6 md:mb-8">
          <p className="text-[10px] md:text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500 text-center mb-2">
            Command center · Today
          </p>
          <HeroKpiStrip reduceMotion={!!reduceMotion} />
        </div>

        {/* CTAs — stack on mobile, side-by-side on desktop */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-5 justify-center items-center w-full sm:flex-wrap">
          <Button
            asChild
            size="lg"
            className="landing-cta landing-cta-lg w-full sm:w-auto text-base font-semibold px-8 min-h-[52px] md:min-h-[56px] rounded-xl shadow-[0_4px_24px_rgba(99,102,241,0.4)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.5)] transition-all duration-200 active:scale-[0.99]"
          >
            <Link href="/demo">
              {HOMEPAGE.hero.ctaPrimary}
              <ArrowRight className="ml-2 h-4 w-4 inline-block" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="landing-cta-secondary w-full sm:w-auto border border-white/20 text-zinc-200 hover:bg-white/10 hover:border-white/30 hover:text-white h-12 px-6 rounded-xl font-medium"
            onClick={() => setDemoModalOpen(true)}
          >
            <Play className="mr-2 h-4 w-4 inline-block" />
            Watch 90-sec demo
          </Button>
        </div>

        {/* Trial bullets — minimal, below CTAs */}
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 mt-4 md:mt-5 max-w-2xl">
          {HOMEPAGE.hero.trialBullets.map((line) => (
            <li key={line} className="flex items-center gap-2 text-xs md:text-sm text-zinc-500">
              <Check className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>

      {demoModalOpen && (
        <DemoModal onClose={() => setDemoModalOpen(false)} />
      )}
    </section>
  );
}

function DemoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Watch 90-second demo"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="aspect-video bg-zinc-800 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-zinc-400 font-medium">90-second demo</p>
            <p className="text-sm text-zinc-500 mt-2">
              Video placeholder — embed your demo video here.
            </p>
            <Link
              href="/demo"
              className="inline-block mt-4 px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
            >
              Go to full demo →
            </Link>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
