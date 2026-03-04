'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Camera,
  Check,
  Clock,
  ClipboardCheck,
  Zap,
  Target,
  TrendingUp,
  DollarSign,
  Repeat,
  Wand2,
  CalendarDays,
  AlertCircle,
  Menu,
  X,
  Bot,
  Brain,
  Briefcase,
  Building2,
  UserCheck,
  Users,
  Package,
  FileSpreadsheet,
  Plus,
  Shield,
  Star,
} from 'lucide-react';
import { BrandName } from '@/components/ui/brand-name';
import { HeroBackdropImage } from '@/components/landing/hero-backdrop-image';
import { HeroCenterImage } from '@/components/landing/hero-center-image';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
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
            <Link href="/#features">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                Features
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
                Book a 15-Minute Demo
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
              <Link href="/#features" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                Features
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
            Book a 15-Minute Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Hero: headline, tagline, device + cards, CTAs */}
      <section className="relative w-full overflow-hidden pt-20 md:pt-24 pb-20 md:pb-28 min-h-[90vh] flex flex-col">
        {/* Backdrop: scrubber.png/jpg in public, or fallback to Unsplash */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <HeroBackdropImage />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-black/55 to-black/80" />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160%] max-w-6xl h-[90%] bg-gradient-radial-hero opacity-50" />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] hero-noise" aria-hidden />

        <div className="relative container mx-auto px-4 flex-1 flex flex-col items-center">
          <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
          {/* Headline + subtitle */}
          <div className="text-center max-w-4xl mx-auto">
            <h1
              className={`font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[2.75rem] font-bold text-white tracking-tight leading-[1.1] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '0ms' }}
            >
              Commercial Janitorial Software That Runs Like{' '}
              <span className="hero-headline-gradient">
                Two Managers
              </span>
              {' '}— Without the Payroll
            </h1>
            <p
              className={`mt-5 text-base md:text-lg text-zinc-300 max-w-3xl mx-auto leading-relaxed transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '80ms' }}
            >
              <BrandName /> combines sales growth and operational control into one platform — helping commercial cleaning companies win contracts, prove quality, and scale without adding supervisors.
            </p>
          </div>

          {/* Tagline + arrows (wrapper so arrows start at tagline and arch down to cards) */}
          <div className="relative w-full max-w-6xl mx-auto">
            <p
              className={`mt-6 font-heading text-xl md:text-2xl lg:text-3xl xl:text-[1.75rem] font-bold text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '120ms' }}
            >
              <span className="hero-tagline-gradient">
                Two managers&apos; worth of output. One platform.
              </span>
            </p>
            {/* Arrows: from above the tagline (left/right), sweep down to Sales + Quality cards — match reference sketch */}
            <div className="absolute left-0 right-0 top-full w-full h-[220px] md:h-[260px] pointer-events-none hidden lg:block" aria-hidden style={{ marginTop: '2px' }}>
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none" fill="none" stroke="rgba(251,191,36,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <marker id="hero-arrowhead" markerWidth="10" markerHeight="8" refX="8" refY="4" orient="auto">
                    <path d="M0 0 L8 4 L0 8 Z" fill="rgba(251,191,36,0.95)" />
                  </marker>
                </defs>
                {/* Left: from above & left of tagline, graceful arc down to Sales Engine card */}
                <path d="M 28 0 Q 2 50 10 98" markerEnd="url(#hero-arrowhead)" />
                {/* Right: from above & right of tagline, graceful arc down to Quality Control card */}
                <path d="M 72 0 Q 98 50 90 98" markerEnd="url(#hero-arrowhead)" />
              </svg>
            </div>
          </div>

          {/* Laptop + side callouts: grid on large, stack on small */}
          <div
            className={`relative w-full max-w-6xl mx-auto mt-12 md:mt-16 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '160ms' }}
          >
            {/* Sales Engine — left */}
            <div className="w-full lg:max-w-[260px] order-2 lg:order-1 rounded-2xl border border-amber-400/50 bg-zinc-900/90 backdrop-blur-xl p-6 shadow-[0_0_50px_rgba(251,191,36,0.12)] hover:shadow-[0_0_60px_rgba(251,191,36,0.18)] hover:border-amber-400/60 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-4 text-amber-300">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="text-white font-semibold text-base mb-3">Sales Engine</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {['Professional proposals', 'Bid tracking', 'Scope builder', 'Close analytics'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-zinc-400 leading-snug">Win contracts without hiring a sales manager.</p>
            </div>

            {/* Laptop + phone mockup */}
            <div className="order-1 lg:order-2 relative flex-shrink-0">
              <HeroCenterImage />
            </div>

            {/* Quality Control Engine — right */}
            <div className="w-full lg:max-w-[260px] order-3 rounded-2xl border border-amber-400/50 bg-zinc-900/90 backdrop-blur-xl p-6 shadow-[0_0_50px_rgba(251,191,36,0.12)] hover:shadow-[0_0_60px_rgba(251,191,36,0.18)] hover:border-amber-400/60 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mb-4 text-amber-300">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <h3 className="text-white font-semibold text-base mb-3">Quality Control Engine</h3>
              <ul className="space-y-2 text-sm text-zinc-300">
                {['QR inspections', 'Photo documentation', 'Building scorecards', 'Crew accountability'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-zinc-400 leading-snug">Standardize quality without adding supervisors.</p>
            </div>
          </div>

          </div>

          {/* Bottom CTAs */}
          <div
            className={`flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center mt-10 md:mt-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '240ms' }}
          >
            <Link href="/demo">
              <Button size="lg" className="landing-cta landing-cta-lg text-base font-semibold px-8 h-12 rounded-xl shadow-[0_4px_24px_rgba(251,191,36,0.35)] hover:shadow-[0_6px_32px_rgba(251,191,36,0.45)] transition-shadow">
                Book a 15-Minute Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="landing-cta-secondary border-2 border-amber-400/50 text-zinc-200 hover:bg-white/5 hover:border-amber-400/70 h-12 px-6 rounded-xl font-medium">
                See a Real Inspection Report
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="relative pt-16 md:pt-20 pb-20 md:pb-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 px-6 py-8 md:px-10 md:py-10 mb-12 md:mb-14 max-w-4xl mx-auto text-center shadow-lg shadow-black/20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-sm font-medium mb-5">
              <Brain className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              <BrandName /> Wins More Bids
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              From walkthrough to closed deal—AI handles the heavy lifting so you can focus on relationships.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Camera, badge: 'AI Bidding', title: 'Intelligent Building Capture', desc: 'Point your phone camera at rooms, floors, and fixtures. AI automatically detects flooring types, counts fixtures, measures square footage, and identifies special requirements—all in real-time.', features: ['Floor type detection', 'Fixture counting', 'Square footage calculation', 'Special area identification'], color: 'gold' },
              { icon: Wand2, badge: 'AI Proposals', title: 'Instant Professional Proposals', desc: 'AI generates complete, branded proposals with scope of work, frequency schedules, pricing tables, and assumptions—ready to send in minutes, not hours.', features: ['Branded PDF generation', 'Automated pricing', 'Scope documentation', 'Professional formatting'], color: 'cyan' },
              { icon: Repeat, badge: 'AI Follow-Ups', title: 'Automated Follow-Up Cadences', desc: 'Never lose a lead. AI tracks proposal status, sends personalized follow-ups at optimal times, and maintains engagement until the deal closes—all automatically.', features: ['Smart timing', 'Personalized messaging', 'Status tracking', 'Engagement optimization'], color: 'emerald' },
            ].map((item, index) => {
              const Icon = item.icon;
              const colorClasses = { gold: 'bg-amber-500/15 text-amber-400 border-amber-500/30', cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
              return (
                <div key={index} className={`relative p-8 md:p-9 rounded-2xl bg-zinc-900/50 border border-zinc-700/80 hover:border-amber-400/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClasses[item.color as keyof typeof colorClasses]} text-xs font-semibold mb-5`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.badge}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm mb-5">{item.desc}</p>
                  <ul className="space-y-2.5">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-400 text-sm">
                        <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="operations-qa" className="relative py-20 md:py-24 bg-black border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 px-6 py-8 md:px-10 md:py-10 mb-12 md:mb-14 max-w-4xl mx-auto text-center shadow-lg shadow-black/20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-sm font-medium mb-5">
              <ClipboardCheck className="h-4 w-4" />
              <span>Operations & QA</span>
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              <BrandName /> Keeps Clients Longer
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Deliver consistently, catch issues before the customer does, and keep every location on track—automatically.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ClipboardCheck, badge: 'AI Quality', title: 'Consistent Inspections & Scoring', desc: 'Run quality checks that actually get completed. AI supports consistent scoring, photo documentation, and trend tracking so you catch issues before the customer does.', features: ['Consistent scoring', 'Issue detection', 'Photo documentation', 'Trend tracking'], color: 'gold' },
              { icon: CalendarDays, badge: 'AI Scheduling', title: 'Smarter Crews & Coverage', desc: 'Put the right crew on the right job. AI helps match crews to locations, surface coverage gaps, and reduce missed cleans so service stays reliable.', features: ['Crew-to-location matching', 'Coverage visibility', 'Schedule optimization', 'Missed-clean alerts'], color: 'cyan' },
              { icon: AlertCircle, badge: 'AI Issue Resolution', title: 'Fast Response & Resolution', desc: 'When something goes wrong, fix it before it becomes a complaint. AI tracks work orders, prioritizes by urgency, and keeps resolution and communication in one place.', features: ['Priority routing', 'Status tracking', 'Quick resolution', 'Customer communication'], color: 'emerald' },
            ].map((item, index) => {
              const Icon = item.icon;
              const colorClasses = { gold: 'bg-amber-500/15 text-amber-400 border-amber-500/30', cyan: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
              return (
                <div key={index} className={`relative p-8 md:p-9 rounded-2xl bg-zinc-900/50 border border-zinc-700/80 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClasses[item.color as keyof typeof colorClasses]} text-xs font-semibold mb-5`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.badge}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 tracking-tight">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm mb-5">{item.desc}</p>
                  <ul className="space-y-2.5">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-400 text-sm">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 px-6 py-8 md:px-10 md:py-10 mb-12 md:mb-14 max-w-4xl mx-auto text-center shadow-lg shadow-black/20">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Measurable Results for Janitorial Companies
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              See why janitorial sales teams choose <BrandName /> to win more bids.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Clock, stat: '75%', label: 'Time saved per proposal', sublabel: 'From 2 hours to 30 minutes' },
              { icon: Zap, stat: 'Same-day', label: 'Proposal delivery', sublabel: 'Before you leave the property' },
              { icon: TrendingUp, stat: '40%', label: 'Higher close rate', sublabel: 'With automated follow-ups' },
              { icon: DollarSign, stat: '3x', label: 'More proposals sent', sublabel: 'Same team, more opportunities' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-zinc-900/60 rounded-2xl p-8 border border-zinc-700/80 text-center hover:border-amber-400/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-amber-400" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">{item.stat}</div>
                  <div className="text-zinc-300 font-semibold text-sm mb-1">{item.label}</div>
                  <div className="text-zinc-500 text-xs">{item.sublabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Built by Operators — story block: headline + copy, anchored in card */}
      <section className="py-20 md:py-24 bg-black border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-6 md:p-10 lg:p-12 shadow-lg shadow-black/20 overflow-hidden">
            <div className="grid md:grid-cols-[1fr,1fr] gap-10 md:gap-14 items-center">
              {/* Left: headline */}
              <div className="relative md:pl-2">
                <h2 className="font-heading text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.08]">
                  Built by Operators.
                  <br />
                  Not Venture
                  <br />
                  Capital.
                </h2>
                <div className="absolute -left-2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-amber-400/40 to-transparent hidden md:block" aria-hidden />
              </div>
              {/* Right: story */}
              <div className="space-y-6 text-zinc-300 md:border-l border-zinc-700/60 md:pl-10">
              <p className="text-base md:text-lg leading-relaxed">
                <BrandName /> wasn&apos;t built in a boardroom. It was built inside a commercial cleaning company.
              </p>
              <p className="text-sm font-semibold text-white uppercase tracking-wider">
                20+ years in the field.
              </p>
              <ul className="space-y-2 text-base">
                {['We\'ve bid buildings.', 'Managed crews.', 'Fixed failed inspections.', 'Lost sleep over client expectations.'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-base md:text-lg leading-relaxed">
                We didn&apos;t need another generic software tool. We needed a system that wins contracts, enforces accountability, and protects client relationships long term.
              </p>
              <p className="text-base">
                <Link
                  href="/demo"
                  className="font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-400/60 hover:decoration-amber-300 transition-colors"
                >
                  So we built it.
                </Link>
              </p>
            </div>
            </div>
          </div>
          {/* Who it's for — compact row */}
          <div className="mt-16 pt-16 border-t border-zinc-800/80">
            <p className="text-center text-sm font-medium text-zinc-500 uppercase tracking-wider mb-8">
              Built for operators like you
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { icon: UserCheck, label: 'Janitorial Sales Reps', desc: 'Close more deals faster' },
                { icon: Building2, label: 'Owner-Operators', desc: 'Scale without hiring' },
                { icon: Users, label: 'Franchise Operators', desc: 'Area & unit franchisees' },
                { icon: Target, label: 'Facility Services', desc: 'Expand into janitorial' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-700/80 hover:border-amber-400/40 transition-all duration-300 text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/20 text-amber-300 flex items-center justify-center mb-3">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-semibold text-white text-sm mb-0.5">{item.label}</span>
                    <span className="text-zinc-400 text-xs">{item.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 px-6 py-8 md:px-10 md:py-10 mb-10 text-center shadow-lg shadow-black/20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Sales Module
                </div>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Complete Sales Management
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                From first walkthrough to closed deal—building capture, proposals, follow-ups, and pricing—all in one platform.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-5">
              {[
                { icon: Camera, label: 'Building Capture' },
                { icon: Wand2, label: 'Proposals' },
                { icon: Repeat, label: 'Follow-Ups' },
                { icon: DollarSign, label: 'Pricing' },
                { icon: TrendingUp, label: 'Close Deals' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center gap-3 p-5 rounded-xl bg-zinc-900/50 border border-zinc-700/80 hover:border-amber-400/40 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/20 text-amber-300 flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-white text-sm text-center">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-zinc-500 text-center">
              The Sales module is included in every plan—from first walkthrough to closed deal.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-black border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 px-6 py-8 md:px-10 md:py-10 mb-10 text-center shadow-lg shadow-black/20">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Operations Module
                </div>
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Complete Operations Management
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                After you win the bid, manage inspections, crews, compliance, purchase orders, and invoicing—all in one platform.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-5">
              {[
                { icon: ClipboardCheck, label: 'Inspections' },
                { icon: Users, label: 'Crews' },
                { icon: Shield, label: 'Compliance' },
                { icon: Package, label: 'Purchase Orders' },
                { icon: FileSpreadsheet, label: 'Invoicing' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center gap-3 p-5 rounded-xl bg-zinc-900/50 border border-zinc-700/80 hover:border-emerald-400/40 transition-all duration-300">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 flex items-center justify-center">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-white text-sm text-center">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-zinc-500 text-center">
              Add the Operations module to your plan for complete janitorial business management—from sales to delivery.
            </p>
          </div>
        </div>
      </section>

      <section id="book-demo" className="relative py-20 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto rounded-2xl border border-amber-400/40 bg-zinc-900/60 px-6 py-10 md:px-12 md:py-12 text-center shadow-xl shadow-black/30 ring-1 ring-amber-400/20">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight">
              Ready to Book a 15-Minute Demo?
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
              Get a personalized demo. We&apos;ll show you how <BrandName /> handles bids, proposals, and operations—and configure pricing for your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link href="/demo" className="w-full sm:w-auto">
                <Button size="lg" className="landing-cta landing-cta-lg text-base px-8 h-12 w-full sm:w-auto">
                  Book a 15-Minute Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="landing-cta-secondary shrink-0">
                  See Plans
                </Button>
              </Link>
            </div>
            <p className="text-sm text-zinc-400 mt-6">
              We&apos;ll reach out within one business day • Bring your pricing sheet—we&apos;ll configure it
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-black text-zinc-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="[&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              <Image src="/logo.png" alt="JANIBEAR" width={220} height={72} className="h-14 md:h-16 w-auto mb-4 object-contain bg-transparent" unoptimized />
              <p className="text-sm text-zinc-500">
                AI-powered bidding, proposals, and follow-up automation for janitorial companies. Win more bids, close more deals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo" className="hover:text-white transition-colors">Book a 15-Minute Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">See Plans</Link></li>
                <li><Link href="/survey" className="hover:text-white transition-colors">Find Your Plan</Link></li>
                <li><Link href="/#features" className="hover:text-white transition-colors">Features</Link></li>
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
  );
}
