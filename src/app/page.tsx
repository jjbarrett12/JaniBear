'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Send,
  Users,
  Clock,
  Shield,
  Check,
  Building2,
  UserCheck,
  Zap,
  Target,
  ClipboardCheck,
  Package,
  FileSpreadsheet,
  Plus,
  TrendingUp,
  DollarSign,
  Repeat,
  Brain,
  Wand2,
  CalendarDays,
  AlertCircle,
  Menu,
  X,
  Bot,
  Play,
} from 'lucide-react';

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
    <div className="landing-page min-h-screen bg-zinc-950 text-zinc-100 pb-20 md:pb-0">
      <div className="hero-dark-wrap">
      <nav
        className={`landing-header border-b sticky top-0 z-50 h-14 md:h-16 py-0 flex items-center overflow-visible transition-all duration-300 ${
          navScrolled ? 'landing-header-scrolled shadow-sm' : ''
        }`}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4 min-h-0">
          <Link href="/" className="landing-logo-wrap flex items-center shrink-0 overflow-visible bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block [&>span]:overflow-visible">
            <Image
              src="/janibear-logo.png"
              alt="JANIBEAR"
              width={320}
              height={104}
              className="landing-logo w-auto object-contain object-center bg-transparent"
              priority
              unoptimized
            />
          </Link>
          {/* Desktop: nav categories (Pricing, Plans, Features, Contact) - centered */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 flex-1 justify-center">
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
          {/* Desktop: Sign in + Get a Demo */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0">
            <Link href="/auth/login" className="landing-nav-link landing-nav-link-text text-sm font-medium shrink-0 h-9 flex items-center px-3 hover:underline">
              Sign in
            </Link>
            <Link href="/demo">
              <Button size="sm" className="landing-cta shrink-0 h-10 px-4 md:px-5 font-semibold">
                Get a Demo
              </Button>
            </Link>
          </div>
          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="md:hidden landing-nav-link p-2 rounded-md -mr-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-zinc-900 border-l border-zinc-800 shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <span className="text-sm font-medium text-zinc-400">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1">
              <Link href="/#features" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-zinc-800">
                Features
              </Link>
              <Link href="/pricing" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-zinc-800">
                Pricing
              </Link>
              <Link href="/#features" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-zinc-800">
                How it works
              </Link>
              <Link href="/contact" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-white font-medium rounded-lg hover:bg-zinc-800">
                Contact
              </Link>
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="px-3 py-3 text-zinc-400 text-sm hover:text-white hover:bg-zinc-800 rounded-lg mt-2">
                Sign in
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Sticky bottom CTA — mobile only */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 safe-bottom bg-[#121B3A]/95 border-t border-[#3B4FA3] backdrop-blur md:hidden">
        <Link href="/demo" className="block w-full">
          <Button className="landing-cta w-full h-12 text-base font-semibold rounded-lg">
            Get a Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Hero: dark theme #121B3A, grid, headline, CTAs, floating cards, logos */}
      <section className="hero-bg-pattern relative min-h-[90vh] overflow-hidden pt-12 md:pt-20 pb-24 md:pb-32">
        {/* Decorative data / grid overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[10%] text-[#3B4FA3]/40 text-sm font-mono">8,620.06</div>
          <div className="absolute top-[25%] right-[15%] text-[#3B4FA3]/40 text-sm font-mono">78.53%</div>
          <div className="absolute bottom-[35%] left-[20%] text-[#3B4FA3]/40 text-sm font-mono">47%</div>
          <div className="absolute top-[40%] right-[8%] w-16 h-10 border border-[#3B4FA3]/30 rounded opacity-50" />
          <div className="absolute bottom-[45%] left-[12%] w-20 h-12 border border-[#3B4FA3]/30 rounded opacity-50" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-[#3B4FA3]/50 text-[#F3F4F6] text-sm font-medium mb-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}
          >
            <Play className="h-4 w-4 text-[#F28C28]" />
            <span>Powered by Jani</span>
          </div>

          <h1
            className={`hero-headline text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-extrabold text-[#F3F4F6] tracking-tight leading-[1.2] max-w-4xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Win more bids.{' '}
            <span className="text-[#F28C28]">Prove your quality.</span>{' '}
            Scale with confidence.
          </h1>

          <p
            className={`text-lg text-[#F3F4F6]/90 max-w-2xl mx-auto mt-6 leading-relaxed transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '80ms' }}
          >
            All in <span className="text-[#F28C28] font-semibold">one system</span> to bid smarter, ensure quality, and operate with ease.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-3 justify-center items-center mt-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '160ms' }}
          >
            <Link href="/demo">
              <Button size="lg" className="landing-cta landing-cta-lg text-base px-8 h-12">
                Get a Demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="landing-outline text-base px-6 h-12">
                View Pricing
              </Button>
            </Link>
          </div>

          <p
            className={`mt-8 text-sm text-[#F3F4F6]/70 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '200ms' }}
          >
            Used daily by 500+ janitorial companies · Plans start at $59/month
          </p>
        </div>

        {/* Floating document cards */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <div className={`absolute left-[5%] top-[45%] w-64 bg-white rounded-lg shadow-2xl p-4 -rotate-6 transition-all duration-700 ${mounted ? 'opacity-95 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
            <div className="flex items-center gap-2 mb-2">
              <Image src="/janibear-logo.png" alt="" width={80} height={26} className="h-5 w-auto object-contain" unoptimized />
            </div>
            <p className="text-xs font-semibold text-zinc-800 mb-2">Bid Proposal</p>
            <div className="text-[10px] text-zinc-600 space-y-1">
              <p>JANIBEAR Cleaning Services</p>
              <p>Daily Cleaning · Monthly Refills · Deep Clean</p>
            </div>
            <div className="mt-2 pt-2 border-t border-zinc-200 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">David Simon</span>
              <span className="text-[10px] font-medium text-emerald-600">APPROVED</span>
            </div>
          </div>
          <div className={`absolute right-[5%] top-[40%] w-64 bg-white rounded-lg shadow-2xl p-4 rotate-6 transition-all duration-700 ${mounted ? 'opacity-95 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '350ms' }}>
            <p className="text-[10px] text-zinc-500 mb-1">Pinnacle Properties</p>
            <p className="text-xs font-semibold text-zinc-800 mb-2">Inspection Report</p>
            <p className="text-[10px] text-zinc-600 mb-2">Apr 22, 2024 · Scott H.</p>
            <ul className="text-[10px] text-zinc-600 space-y-1">
              <li className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Restrooms sanitized</li>
              <li className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Floors inspected</li>
              <li className="flex items-center gap-1"><Check className="h-3 w-3 text-emerald-500" /> Supplies restocked</li>
            </ul>
            <p className="mt-2 text-[10px] font-medium text-emerald-600">All tasks completed successfully</p>
          </div>
        </div>

        {/* Partner logos */}
        <div className={`relative container mx-auto px-4 mt-16 md:mt-24 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
          <p className="text-xs text-[#F3F4F6]/50 uppercase tracking-wider mb-4">Trusted by industry leaders</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {['JIT', 'SUPERCLEAN', 'Vanygard', 'BSC'].map((name) => (
              <span key={name} className="text-[#F3F4F6]/60 font-semibold text-sm tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>
      </div>

      <section id="features" className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4">
              <Brain className="h-4 w-4" />
              <span>Powered by AI</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Three AI Capabilities That Win More Bids
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
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
                <div key={index} className={`relative p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colorClasses[item.color as keyof typeof colorClasses]} text-xs font-semibold mb-4`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.badge}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm mb-4">{item.desc}</p>
                  <ul className="space-y-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-400 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
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

      <section id="operations-qa" className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
              <ClipboardCheck className="h-4 w-4" />
              <span>Operations & QA</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Three AI Capabilities for Operations & Quality Assurance
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
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
                <div key={index} className={`relative p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${colorClasses[item.color as keyof typeof colorClasses]} text-xs font-semibold mb-4`}>
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.badge}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm mb-4">{item.desc}</p>
                  <ul className="space-y-2">
                    {item.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-400 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
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

      <section className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-4">
                <Package className="h-4 w-4" />
                <span>Inventory & Orders</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                Organize Supplies—Stop the Paper Notes and Text Threads
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Most companies are still using paper notes, text messages, or Excel if they&apos;re lucky. JANIBEAR gives you one place to track inventory and build orders—then email them straight to your preferred vendor.
              </p>
            </div>
            <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Simple inventory, ready-to-send orders</h3>
                  <p className="text-zinc-300 mb-4">
                    Track what you need by location or job, build orders in one place, and send them to your vendor by email—no more scattered notes or digging through threads. Built for how janitorial companies actually work.
                  </p>
                  <ul className="space-y-2 text-zinc-400 text-sm">
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span>One place to inventory supplies by site or job</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span>Build orders and email them to your preferred vendor</span></li>
                    <li className="flex items-start gap-2"><Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span>Replace paper notes, texts, and spreadsheet chaos</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Measurable Results for Janitorial Companies
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              See why janitorial sales teams choose JANIBEAR to win more bids.
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
                <div key={index} className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 text-center hover:border-zinc-700 transition-colors">
                  <Icon className="h-8 w-8 mx-auto mb-3 text-amber-400/80" />
                  <div className="text-3xl font-bold text-white mb-1">{item.stat}</div>
                  <div className="text-zinc-300 font-medium text-sm mb-1">{item.label}</div>
                  <div className="text-zinc-500 text-xs">{item.sublabel}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Built Specifically for Janitorial Companies
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Designed by janitorial industry experts, for janitorial sales teams.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: UserCheck, label: 'Janitorial Sales Reps', desc: 'Close more deals faster' },
              { icon: Building2, label: 'Owner-Operators', desc: 'Scale without hiring' },
              { icon: Users, label: 'Franchise Operators', desc: 'Standardize across locations' },
              { icon: Target, label: 'Facility Services', desc: 'Expand into janitorial' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col items-center p-6 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors text-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-semibold text-white text-sm mb-1">{item.label}</span>
                  <span className="text-zinc-500 text-xs">{item.desc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Operations Module
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Complete Operations Management
            </h2>
            <p className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto">
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
                  <div key={index} className="flex flex-col items-center gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
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

      <section id="book-demo" className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to See It in Action?
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Get a personalized demo. We&apos;ll show you how JANIBEAR handles bids, proposals, and operations—and configure pricing for your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="text-lg px-8 h-14 bg-amber-500 text-white hover:bg-amber-400 border-0 shadow-lg hover:shadow-xl hover:shadow-amber-500/25 transition-all w-full sm:w-auto">
                  Get a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-zinc-500 mt-6">
              We&apos;ll reach out within one business day • Bring your pricing sheet—we&apos;ll configure it
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="[&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              <Image src="/janibear-logo.png" alt="JANIBEAR" width={220} height={72} className="h-14 md:h-16 w-auto mb-4 object-contain bg-transparent opacity-95" unoptimized />
              <p className="text-sm text-zinc-500">
                AI-powered bidding, proposals, and follow-up automation for janitorial companies. Win more bids, close more deals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo" className="hover:text-white transition-colors">Get a Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
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
            <p>&copy; {new Date().getFullYear()} JANIBEAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
