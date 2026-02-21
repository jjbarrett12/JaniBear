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
            <Link href="/#what-janibear-does">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                What It Does
              </Button>
            </Link>
            <Link href="/#see-it-in-action">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0 h-9 px-3">
                See It In Action
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
                See the Command Center
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
              <Link href="/#what-janibear-does" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                What It Does
              </Link>
              <Link href="/#see-it-in-action" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-white/10">
                See It In Action
              </Link>
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
            See the Command Center
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Hero: compact; laptop and CTAs with no gap */}
      <section className="relative w-full overflow-hidden pt-8 md:pt-10 pb-10 md:pb-12 flex flex-col">
        {/* Backdrop: image + overlays so content owns the fold */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <HeroBackdropImage />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/80" />
        </div>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] max-w-7xl h-[95%] bg-gradient-radial-hero opacity-50" />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.06] hero-noise" aria-hidden />

        <div className="relative container mx-auto px-4 flex flex-col items-center pt-0 md:pt-1">
          {/* Headline — category: operating system, not "software" */}
          <h1
            className={`text-center max-w-4xl mx-auto font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight hero-headline transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '0ms' }}
          >
            The{' '}
            <span className="hero-headline-gradient">Operating System</span>
            {' '}for Commercial Cleaning Companies
          </h1>
          <p
            className={`text-center max-w-xl mx-auto mt-2 md:mt-3 text-zinc-100 text-base md:text-lg font-semibold hero-subhead transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '40ms' }}
          >
            Win bids. Keep accounts. Catch margin leaks. One command center.
          </p>

          {/* Laptop — tight to CTAs below */}
          <div
            className={`w-full flex justify-center mt-1 md:mt-2 transition-all duration-700 ${mounted ? 'opacity-100 -translate-y-10 md:-translate-y-16' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '80ms' }}
          >
            <HeroCenterImage />
          </div>

          {/* CTAs — pulled up to kill gap under laptop */}
          <div
            className={`flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center -mt-2 md:-mt-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '160ms' }}
          >
            <Link href="/demo">
              <Button size="lg" className="landing-cta landing-cta-lg text-base font-semibold px-8 h-14 rounded-xl shadow-[0_4px_28px_rgba(250,204,21,0.45)] hover:shadow-[0_8px_36px_rgba(250,204,21,0.55)] transition-all hover:scale-[1.02]">
                See the Command Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="landing-cta-secondary border-2 border-amber-400/50 text-zinc-200 hover:bg-white/5 hover:border-amber-400/70 h-12 px-6 rounded-xl font-medium">
                Get a Live Walkthrough
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Highlight: Built by Operators — two columns on desktop */}
      <section className="relative border-t border-zinc-800/50 bg-zinc-900/80 py-14 md:py-20 border-l-4 border-l-amber-400/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 max-w-6xl mx-auto md:items-center">
            <div className="flex flex-col justify-center md:min-h-0 md:py-4">
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                <span className="text-white">Built by Operators.</span>
                <br />
                <span className="text-amber-400">Not Software Guys.</span>
              </h2>
            </div>
            <div className="space-y-5 text-zinc-300 text-base md:text-lg leading-relaxed border-l border-zinc-700/80 pl-8 md:pl-10">
              <p>
                <BrandName /> wasn&apos;t built in a boardroom. It was built inside a commercial cleaning company.
              </p>
              <p>
                For over 20 years, we&apos;ve bid buildings, managed crews, fixed failed inspections, and lost sleep over client expectations. We&apos;ve lost bids. We&apos;ve battled scope creep. We&apos;ve chased down crews when quality slipped.
              </p>
              <p>
                We didn&apos;t need another generic software tool. We needed a system that wins contracts, enforces accountability, and protects client relationships long term.
              </p>
              <p className="font-semibold text-white">
                So we built it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What JANIBEAR Actually Does — 3 pillars: Sales, Ops, Executive */}
      <section id="what-janibear-does" className="relative py-16 md:py-24 bg-black border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              What <BrandName /> Actually Does
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              One platform. Three engines. From first walkthrough to margin protection.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Sales Engine — yellow */}
            <div className={`rounded-2xl border-2 border-amber-400/40 bg-zinc-900/60 p-6 md:p-8 transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden /> Sales Engine
              </div>
              <ul className="space-y-3 text-zinc-300 text-sm md:text-base">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> AI Walkthrough Capture</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> Auto Scope Extraction</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> Proposal Builder</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> Territory Mapping</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-amber-400 shrink-0" /> Bid Win Tracking</li>
              </ul>
            </div>
            {/* Operations Engine — blue */}
            <div className={`rounded-2xl border-2 border-cyan-400/40 bg-zinc-900/60 p-6 md:p-8 transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '80ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-cyan-400" aria-hidden /> Operations Engine
              </div>
              <ul className="space-y-3 text-zinc-300 text-sm md:text-base">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Crew Scheduling</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Site Health Score</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Inspections</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Issue Escalation</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Client Visibility Portal</li>
              </ul>
            </div>
            {/* Executive Command — green */}
            <div className={`rounded-2xl border-2 border-emerald-400/40 bg-zinc-900/60 p-6 md:p-8 transition-all duration-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '160ms' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden /> Executive Command
              </div>
              <ul className="space-y-3 text-zinc-300 text-sm md:text-base">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Financial Health Module</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Account Decay Model</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> Margin Protection</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> At-Risk Contracts</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-400 shrink-0" /> KPI Dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* See It In Action — lifecycle flow */}
      <section id="see-it-in-action" className="relative py-16 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              See It In Action
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              This is how it works. One workflow from walkthrough to account health.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
              {[
                { step: 1, label: 'Capture walkthrough with phone', icon: Camera },
                { step: 2, label: 'AI extracts scope', icon: Wand2 },
                { step: 3, label: 'Proposal generated', icon: FileSpreadsheet },
                { step: 4, label: 'Crew assigned', icon: Users },
                { step: 5, label: 'Inspections logged', icon: ClipboardCheck },
                { step: 6, label: 'Account health tracked', icon: TrendingUp },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="flex items-center gap-2 md:gap-3">
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/60 px-4 py-4 md:px-5 md:py-4 min-w-[140px] md:min-w-[160px] hover:border-amber-400/40 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-zinc-400 text-center">Step {item.step}</span>
                      <span className="text-sm font-medium text-white text-center leading-tight">{item.label}</span>
                    </div>
                    {index < 5 && (
                      <ArrowRight className="h-5 w-5 text-zinc-500 shrink-0 hidden md:block" aria-hidden />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-sm text-zinc-500 mt-8">
              You&apos;re not just buying software. You&apos;re replacing disconnected spreadsheets and guesswork with one lifecycle.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="relative pt-16 md:pt-20 pb-20 md:pb-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-sm font-medium mb-5">
              <Brain className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Win More Bids
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              AI handles scope and proposals so you focus on winning bids and keeping accounts.
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
          <div className="text-center mb-14 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-sm font-medium mb-5">
              <ClipboardCheck className="h-4 w-4" />
              <span>Operations & QA</span>
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Keep Clients Longer
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Catch issues before the customer does. Fewer surprises, less churn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ClipboardCheck, badge: 'AI Quality', title: 'Consistent Inspections & Scoring', desc: 'Run quality checks that actually get completed. AI supports consistent scoring, photo documentation, and trend tracking so you catch issues before the customer does.', features: ['Consistent scoring', 'Issue detection', 'Photo documentation', 'Trend tracking'], color: 'gold' },
              { icon: CalendarDays, badge: 'AI Scheduling', title: 'Smarter Crews & Coverage', desc: 'Put the right crew on the right job. AI helps match crews to sites, surface coverage gaps, and reduce missed cleans so service stays reliable.', features: ['Crew-to-site matching', 'Coverage visibility', 'Schedule optimization', 'Missed-clean alerts'], color: 'cyan' },
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

      {/* Social proof — even if early */}
      <section className="py-12 md:py-16 bg-black border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center gap-2">
              <Building2 className="h-8 w-8 text-amber-400" />
              <p className="text-white font-semibold">Built in a 20-year commercial cleaning operation</p>
              <p className="text-zinc-400 text-sm">Not in a boardroom.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <DollarSign className="h-8 w-8 text-amber-400" />
              <p className="text-white font-semibold">Designed for companies from $500K to $20M</p>
              <p className="text-zinc-400 text-sm">One platform scales with you.</p>
            </div>
            <div className="flex flex-col items-center gap-2 sm:col-span-2 lg:col-span-1">
              <Target className="h-8 w-8 text-amber-400" />
              <p className="text-white font-semibold">Trusted by operators managing 10+ sites</p>
              <p className="text-zinc-400 text-sm">From first site to hundreds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Who — make them feel seen */}
      <section className="py-16 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Built For
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              Commercial janitorial companies. 5–500 employees. Managing 10–500 sites.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Building2, line: 'Owners tired of babysitting', sub: 'Scale without hiring more supervisors' },
              { icon: Briefcase, line: 'Sales teams bidding weekly', sub: 'Win more. Close faster.' },
              { icon: ClipboardCheck, line: 'Ops managers drowning in inspections', sub: 'One place for quality and issues' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="rounded-2xl border border-zinc-700/80 bg-zinc-900/50 p-6 text-center hover:border-amber-400/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mx-auto mb-3 text-amber-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-semibold text-white mb-1">{item.line}</p>
                  <p className="text-sm text-zinc-400">{item.sub}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Competitive positioning — why JANIBEAR vs generic */}
      <section className="py-16 md:py-24 bg-black border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Why <BrandName /> vs Generic CRM or Scheduling Software
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              We&apos;re not a CRM with a calendar. We&apos;re the command center for commercial cleaning.
            </p>
          </div>
          <div className="overflow-x-auto max-w-4xl mx-auto">
            <table className="w-full border-collapse rounded-2xl overflow-hidden border border-zinc-700/80">
              <thead>
                <tr className="bg-zinc-900/80">
                  <th className="text-left py-4 px-4 md:px-6 text-sm font-semibold text-zinc-400 border-b border-zinc-700/80">Feature</th>
                  <th className="text-center py-4 px-4 md:px-6 text-sm font-semibold text-zinc-400 border-b border-zinc-700/80">Generic CRM</th>
                  <th className="text-center py-4 px-4 md:px-6 text-sm font-semibold text-zinc-400 border-b border-zinc-700/80">Scheduling Software</th>
                  <th className="text-center py-4 px-4 md:px-6 text-sm font-semibold text-amber-300 border-b border-zinc-700/80"><BrandName /></th>
                </tr>
              </thead>
              <tbody className="bg-zinc-900/40">
                {[
                  { feature: 'AI Scope Extraction', crm: false, sched: false, jb: true },
                  { feature: 'Account Health Decay', crm: false, sched: false, jb: true },
                  { feature: 'Walkthrough to Proposal', crm: false, sched: false, jb: true },
                  { feature: 'Sales + Ops in One', crm: false, sched: false, jb: true },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-zinc-700/50 last:border-b-0">
                    <td className="py-3 px-4 md:px-6 text-sm font-medium text-white">{row.feature}</td>
                    <td className="py-3 px-4 md:px-6 text-center text-zinc-500">{row.crm ? <Check className="h-5 w-5 inline text-emerald-400" /> : <span className="text-red-400/80">—</span>}</td>
                    <td className="py-3 px-4 md:px-6 text-center text-zinc-500">{row.sched ? <Check className="h-5 w-5 inline text-emerald-400" /> : <span className="text-red-400/80">—</span>}</td>
                    <td className="py-3 px-4 md:px-6 text-center"><Check className="h-5 w-5 inline text-amber-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Measurable Results
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              Win more bids. Catch issues before the customer does. Protect margin.
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

      <section className="py-20 md:py-24 bg-black border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Who Runs <BrandName />
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 max-w-xl mx-auto">
              Sales reps who close. Ops who deliver. Owners who stop babysitting.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: UserCheck, label: 'Sales Reps', desc: 'Close more deals faster' },
              { icon: Building2, label: 'Owner-Operators', desc: 'Scale without hiring more supervisors' },
              { icon: Users, label: 'Franchise Operators', desc: '', note: 'Area franchisors and unit franchisees' },
              { icon: Target, label: 'Facility Services', desc: 'Expand into janitorial' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col items-center p-8 rounded-2xl bg-zinc-900/50 border border-zinc-700/80 hover:border-cyan-400/40 transition-all duration-300 text-center">
                  <div className="w-14 h-14 rounded-xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-300 flex items-center justify-center mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="font-semibold text-white text-base mb-1">{item.label}</span>
                  {item.desc ? <span className="text-zinc-400 text-sm">{item.desc}</span> : null}
                  {'note' in item && item.note && (
                    <span className="text-zinc-500 text-xs mt-2">{item.note}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Sales Module
              </div>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Complete Sales Management
            </h2>
            <p className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto">
              From first walkthrough to closed deal—building capture, proposals, follow-ups, and pricing—all in one platform.
            </p>
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
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Operations Module
              </div>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Complete Operations Management
            </h2>
            <p className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto">
              After you win the bid, manage inspections, crews, compliance, purchase orders, and invoicing—all in one platform.
            </p>
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
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-5 tracking-tight">
              See the Command Center
            </h2>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed">
              Get a live walkthrough. We&apos;ll show you how <BrandName /> wins contracts, keeps accounts, and protects margin—and configure pricing for your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center flex-wrap">
              <Link href="/demo" className="w-full sm:w-auto">
                <Button size="lg" className="landing-cta landing-cta-lg text-base px-8 h-12 w-full sm:w-auto">
                  See the Command Center
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="landing-cta-secondary shrink-0">
                  Watch How It Wins Contracts
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
                The operating system for commercial cleaning companies. Win bids. Keep accounts. Catch margin leaks.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo" className="hover:text-white transition-colors">See the Command Center</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">See Plans</Link></li>
                <li><Link href="/survey" className="hover:text-white transition-colors">Find Your Plan</Link></li>
                <li><Link href="/#what-janibear-does" className="hover:text-white transition-colors">What It Does</Link></li>
                <li><Link href="/#see-it-in-action" className="hover:text-white transition-colors">See It In Action</Link></li>
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
