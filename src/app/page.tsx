'use client';

import { useEffect, useState } from 'react';
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

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
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
                See It in Action
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
            See It in Action
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <section className="relative w-full overflow-hidden bg-black pt-10 md:pt-14 pb-5 md:pb-6">
        {/* Subtle radial glow for depth */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] max-w-4xl h-[80%] bg-gradient-radial-hero opacity-40" />
        </div>
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] hero-noise" aria-hidden />
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="max-w-3xl mx-auto space-y-0.5">
            <span
              className={`hero-headline block font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '0ms' }}
            >
              Win more bids.
            </span>
            <span
              className={`hero-headline block font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '80ms' }}
            >
              Keep customers longer.
            </span>
            <span
              className={`hero-headline block font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: '160ms' }}
            >
              Scale—without adding headcount.
            </span>
          </h1>

          <p
            className={`hero-subhead text-base md:text-lg text-zinc-300 max-w-2xl mx-auto mt-5 leading-relaxed transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '240ms' }}
          >
            A single system for bidding, inspections, and accountability—{' '}
            <span className="hero-gradient-text gradient-text font-semibold bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 bg-clip-text text-transparent">
              built by janitorial operators
            </span>
          </p>

          {/* Trust strip: in the gap between subheader and review */}
          <p
            className={`hero-micro mt-3 text-xs md:text-sm text-zinc-500 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '280ms' }}
          >
            Trusted by 500+ commercial janitorial teams nationwide
          </p>

          {/* Review: bold text quote with stars and minimal border */}
          <div
            className={`mt-4 flex flex-col items-center justify-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '320ms' }}
          >
            <div className="w-full max-w-2xl mx-auto rounded-lg border border-amber-400/25 bg-white/[0.02] px-6 py-5 text-center">
              <div className="flex justify-center gap-0.5 mb-3" aria-hidden>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-lg md:text-xl font-bold text-white leading-snug">
                &ldquo;Once we could prove our quality, price stopped being the main objection.&rdquo;
              </p>
              <p className="text-sm text-zinc-400 mt-2">— Chris K., Owner, Regional Janitorial Company ($11.2M)</p>
            </div>
          </div>

          <div
            className={`flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mt-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '400ms' }}
          >
            <Link href="/demo">
              <Button size="lg" className="landing-cta landing-cta-lg text-base px-8 h-12">
                See It in Action
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" className="landing-cta-secondary shrink-0">
                See Plans
              </Button>
            </Link>
          </div>

          <ul
            className={`hero-micro flex flex-wrap justify-center gap-x-6 gap-y-1.5 mt-3 text-sm text-zinc-400 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '480ms' }}
          >
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-amber-400 shrink-0" />
              <span>Monthly or Annual Plans</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-amber-400 shrink-0" />
              <span>No Contracts</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-5 w-5 text-amber-400 shrink-0" />
              <span>Built for cleaning companies</span>
            </li>
          </ul>
        </div>
      </section>

      <section id="features" className="pt-10 md:pt-14 pb-16 md:pb-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-sm font-medium mb-4">
              <Brain className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              <BrandName /> Wins More Bids
            </h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
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
              const colorClasses = { gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20', cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
              return (
                <div key={index} className={`relative p-8 rounded-2xl bg-white/5 border border-amber-400/50 hover:border-amber-400 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colorClasses[item.color as keyof typeof colorClasses]} text-xs font-semibold mb-4`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.badge}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-300 leading-relaxed text-sm mb-4">{item.desc}</p>
                  <ul className="space-y-2">
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

      <section id="operations-qa" className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-sm font-medium mb-4">
              <ClipboardCheck className="h-4 w-4" />
              <span>Operations & QA</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              <BrandName /> Keeps Clients Longer
            </h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
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
              const colorClasses = { gold: 'bg-amber-500/10 text-amber-400 border-amber-500/20', cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
              return (
                <div key={index} className={`relative p-8 rounded-2xl bg-white/5 border border-amber-400/50 hover:border-amber-400 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colorClasses[item.color as keyof typeof colorClasses]} text-xs font-semibold mb-4`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.badge}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-300 leading-relaxed text-sm mb-4">{item.desc}</p>
                  <ul className="space-y-2">
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

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Measurable Results for Janitorial Companies
            </h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
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
                <div key={index} className="bg-white/5 rounded-xl p-6 border border-amber-400/50 text-center hover:border-amber-400 transition-colors">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-amber-400/80" />
                  <div className="text-3xl font-bold text-white mb-1">{item.stat}</div>
                  <div className="text-zinc-300 font-medium text-sm mb-1">{item.label}</div>
                  <div className="text-zinc-400 text-xs">{item.sublabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Built by Janitorial Operators, For Janitorial Operators.
            </h2>
            <p className="text-lg text-zinc-300 max-w-xl mx-auto">
              Designed by janitorial industry experts to not only win business, but keep it.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: UserCheck, label: 'Janitorial Sales Reps', desc: 'Close more deals faster' },
              { icon: Building2, label: 'Owner-Operators', desc: 'Scale without hiring' },
              { icon: Users, label: 'Franchise Operators', desc: '', note: 'We cater to both Area Franchisors and Unit Franchisees' },
              { icon: Target, label: 'Facility Services', desc: 'Expand into janitorial' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col items-center p-6 rounded-xl bg-white/5 border border-amber-400/50 hover:border-amber-400 transition-colors text-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-300 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-white text-sm mb-1">{item.label}</span>
                  {item.desc ? <span className="text-zinc-400 text-xs">{item.desc}</span> : null}
                  {'note' in item && item.note && (
                    <span className="text-zinc-500 text-xs mt-2">{item.note}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Sales Module
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Complete Sales Management
            </h2>
            <p className="text-lg text-zinc-300 mb-12 max-w-2xl mx-auto">
              From first walkthrough to closed deal—building capture, proposals, follow-ups, and pricing—all in one platform.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { icon: Camera, label: 'Building Capture' },
                { icon: Wand2, label: 'Proposals' },
                { icon: Repeat, label: 'Follow-Ups' },
                { icon: DollarSign, label: 'Pricing' },
                { icon: TrendingUp, label: 'Close Deals' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-amber-400/50 hover:border-amber-400 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-300 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-white text-sm text-center">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-zinc-400 text-center">
              The Sales module is included in every plan—from first walkthrough to closed deal.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Operations Module
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Complete Operations Management
            </h2>
            <p className="text-lg text-zinc-300 mb-12 max-w-2xl mx-auto">
              After you win the bid, manage inspections, crews, compliance, purchase orders, and invoicing—all in one platform.
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-6">
              {[
                { icon: ClipboardCheck, label: 'Inspections' },
                { icon: Users, label: 'Crews' },
                { icon: Shield, label: 'Compliance' },
                { icon: Package, label: 'Purchase Orders' },
                { icon: FileSpreadsheet, label: 'Invoicing' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/5 border border-amber-400/50 hover:border-amber-400 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-300 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-white text-sm text-center">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-zinc-400 text-center">
              Add the Operations module to your plan for complete janitorial business management—from sales to delivery.
            </p>
          </div>
        </div>
      </section>

      <section id="book-demo" className="py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to See It in Action?
            </h2>
            <p className="text-lg text-zinc-300 mb-8">
              Get a personalized demo. We&apos;ll show you how <BrandName /> handles bids, proposals, and operations—and configure pricing for your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Link href="/demo" className="w-full sm:w-auto">
                <Button size="lg" className="landing-cta landing-cta-lg text-base px-8 h-12 w-full sm:w-auto">
                  See It in Action
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
                <li><Link href="/demo" className="hover:text-white transition-colors">See It in Action</Link></li>
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
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
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
