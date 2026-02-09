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
  TrendingUp,
  DollarSign,
  Repeat,
  Wand2,
  CalendarDays,
  AlertCircle,
  Menu,
  X,
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
    <div className="landing-page min-h-screen bg-black text-white pb-20 md:pb-0">
      <nav
        className={`landing-header border-b border-amber-400/30 sticky top-0 z-50 h-24 md:h-36 py-0 flex items-center overflow-visible transition-all duration-300 ${
          navScrolled ? 'landing-header-scrolled shadow-sm' : ''
        }`}
        style={{ backgroundColor: '#000' }}
      >
        <div className="container relative mx-auto px-4 h-full flex items-center justify-between gap-4 min-h-0">
          <Link href="/" className="landing-logo-wrap flex items-center shrink-0 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/janibear-logo.png"
              alt="JANIBEAR"
              width={280}
              height={91}
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
          {/* Desktop: Sign in + Get a Demo — right side */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0 ml-auto">
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
            Get a Demo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <section className="relative w-full overflow-hidden bg-black pt-12 md:pt-16 pb-20 md:pb-28">
        <div className="relative container mx-auto px-4 text-center">
          <p
            className={`text-zinc-500 text-xs mb-6 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ maxWidth: '28rem', marginLeft: 'auto', marginRight: 'auto' }}
          >
            Built for janitorial sales and operations
          </p>

          <h1
            className={`hero-headline font-heading text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-extrabold text-white tracking-tight leading-[1.2] max-w-3xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            See how top janitorial companies win bids, prove quality, and scale —{' '}
            <span
              className="hero-gradient-text inline-block"
              style={{
                background: 'linear-gradient(to right, #fbbf24, #fcd34d)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              all in one system.
            </span>
          </h1>

          <p
            className={`hero-subhead text-lg text-zinc-300 max-w-2xl mx-auto mt-9 leading-relaxed transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '80ms' }}
          >
            JANIBEAR AI replaces spreadsheets, PDFs, and guesswork with a single platform for <span className="hero-gradient-text inline-block" style={{ background: 'linear-gradient(to right, #fbbf24, #fcd34d)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>bidding</span>, inspections, reporting, and accountability.
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

          <blockquote
            className={`mt-10 text-base md:text-lg text-zinc-300 font-medium italic max-w-xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '200ms' }}
          >
            &ldquo;We stopped losing bids to cheaper competitors once we could prove our quality.&rdquo;
            <footer className="mt-2 text-sm font-normal not-italic text-zinc-500">— Regional Janitorial Owner</footer>
          </blockquote>

          <p
            className={`mt-8 text-sm text-zinc-500 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '240ms' }}
          >
            Trusted by 500+ cleaning companies · Starting at $59/mo
          </p>
        </div>
      </section>

      <section id="features" className="py-24 border-b border-amber-400/30 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              How JANIBEAR helps you win more bids
            </h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
              From walkthrough to closed deal—JANIBEAR removes the manual work that slows your sales team down.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: Camera, title: 'Intelligent Building Capture', desc: 'Walk properties once. Never miss details. Never re-measure.', features: ['Floor types & fixtures', 'Square footage', 'Special requirements'] },
              { icon: Wand2, title: 'Professional Proposals', desc: 'Scope, pricing, and assumptions in one document. Ready to send in minutes.', features: ['Branded PDFs', 'Consistent pricing', 'Less back-and-forth'] },
              { icon: Repeat, title: 'Follow-ups that close', desc: 'Stay in front of leads until the deal closes—without the manual chase.', features: ['Right timing', 'Fewer dropped leads', 'Clear status'] },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={`relative p-8 rounded-2xl bg-white/5 border border-amber-400/50 hover:border-amber-400 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
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

      <section id="operations-qa" className="py-24 border-b border-amber-400/30 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Quality and operations—handled automatically
            </h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto">
              After the bid is won, JANIBEAR helps you deliver consistently, catch issues early, and keep every location on track.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { icon: ClipboardCheck, title: 'Inspections & scoring', desc: 'Consistent quality checks, photo documentation, and trend tracking so you catch issues before the customer does.' },
              { icon: CalendarDays, title: 'Crews & coverage', desc: 'Match crews to locations, see coverage gaps, and reduce missed cleans so service stays reliable.' },
              { icon: AlertCircle, title: 'Issue resolution', desc: 'Track work orders, prioritize by urgency, and keep resolution and communication in one place.' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className={`relative p-8 rounded-2xl bg-white/5 border border-amber-400/50 hover:border-amber-400 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}>
                  <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-zinc-300 leading-relaxed text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="text-center text-sm text-zinc-500 mt-10">
            Optional operations modules available—inventory, purchase orders, invoicing, and more.
          </p>
        </div>
      </section>

      <section className="py-24 border-b border-amber-400/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Measurable Results for Janitorial Companies
            </h2>
            <p className="text-lg text-zinc-300 max-w-2xl mx-auto mb-2">
              See why janitorial sales teams choose JANIBEAR to win more bids.
            </p>
            <p className="text-sm text-zinc-500 max-w-xl mx-auto">
              Results based on early customer usage and internal benchmarks.
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

      <section id="book-demo" className="py-24 border-b border-amber-400/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to See It in Action?
            </h2>
            <p className="text-lg text-zinc-300 mb-8">
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
                <Button size="lg" variant="outline" className="text-lg px-8 h-14 border-white/30 text-zinc-200 hover:text-white hover:border-white/50 w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-zinc-400 mt-6">
              We&apos;ll reach out within one business day • Bring your pricing sheet—we&apos;ll configure it
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-amber-400/30 text-zinc-400 py-12">
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
