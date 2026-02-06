'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Camera,
  Check,
  Send,
  Users,
  Clock,
  Shield,
  Building2,
  UserCheck,
  Zap,
  Target,
  ClipboardCheck,
  Package,
  FileSpreadsheet,
  Brain,
  Wand2,
  CalendarDays,
  AlertCircle,
  Quote,
} from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-page min-h-screen bg-neutral-50 text-neutral-900">
      {/* Nav */}
      <nav
        className={`landing-header border-b sticky top-0 z-50 h-16 flex items-center transition-all duration-300 ${
          navScrolled ? 'landing-header-scrolled' : ''
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 lg:px-8 h-full flex items-center justify-between max-w-6xl">
          <Link href="/" className="landing-logo-wrap">
            <Image
              src="/janibear-logo.png"
              alt="JaniBear"
              width={160}
              height={40}
              className="landing-logo w-auto object-contain object-left"
              priority
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-1 md:gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="landing-nav-link h-9 px-3">
                Pricing
              </Button>
            </Link>
            <Link href="/survey">
              <Button variant="ghost" size="sm" className="landing-nav-link h-9 px-3">
                Plans
              </Button>
            </Link>
            <Link href="/#features">
              <Button variant="ghost" size="sm" className="landing-nav-link h-9 px-3">
                Features
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="landing-nav-link h-9 px-3">
                Contact
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="landing-nav-link h-9 px-3">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="landing-cta h-9 px-4">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
          <div
            className={`text-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <p className="section-label mb-4">Jani — AI for janitorial operations</p>
            <h1 className="hero-headline text-4xl sm:text-5xl md:text-6xl lg:text-[3.25rem] text-neutral-900 tracking-tight leading-[1.15] text-balance">
              Win more contracts.<br />Run operations at scale.
            </h1>
            <p className="hero-subhead mt-6 text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              AI-powered sales and operations for cleaning companies. Proposals, follow-ups, inspections, and supply management in one platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="landing-cta landing-cta-lg">
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="landing-outline">
                  View pricing
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-neutral-500">
              Trusted by 500+ cleaning companies · Starting at $59/mo
            </p>
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-12 border-y border-neutral-200/80 bg-white">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-semibold text-neutral-900">500+</div>
              <div className="text-sm text-neutral-500 mt-0.5">Cleaning companies</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-semibold text-neutral-900">75%</div>
              <div className="text-sm text-neutral-500 mt-0.5">Less time per proposal</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-semibold text-neutral-900">32%</div>
              <div className="text-sm text-neutral-500 mt-0.5">Fewer bid errors</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-semibold text-neutral-900">Same day</div>
              <div className="text-sm text-neutral-500 mt-0.5">Proposal delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features — Sales */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Sales</p>
            <h2 className="section-title text-3xl md:text-4xl mb-4">
              From walkthrough to closed deal
            </h2>
            <p className="section-desc text-lg max-w-2xl mx-auto">
              AI handles capture, proposals, and follow-ups so your team can focus on relationships.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                icon: Camera,
                title: 'Intelligent capture',
                desc: 'Point your phone at the building. AI detects flooring, fixtures, and square footage in real time.',
              },
              {
                icon: Wand2,
                title: 'Proposals in minutes',
                desc: 'Branded proposals with scope, pricing, and assumptions—ready to send without the manual work.',
              },
              {
                icon: Send,
                title: 'Follow-up cadences',
                desc: 'Automated follow-ups at the right time so leads stay warm until the deal closes.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border border-neutral-200/80 bg-white p-8 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features — Operations & QA */}
      <section className="py-20 md:py-28 bg-white border-y border-neutral-200/80">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-16">
            <p className="section-label mb-3">Operations & quality</p>
            <h2 className="section-title text-3xl md:text-4xl mb-4">
              Deliver consistently, at scale
            </h2>
            <p className="section-desc text-lg max-w-2xl mx-auto">
              Inspections, scheduling, and issue resolution in one place—so quality doesn&apos;t slip as you grow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-10">
            {[
              {
                icon: ClipboardCheck,
                title: 'Inspections & scoring',
                desc: 'Consistent quality checks with photo documentation and trend tracking.',
              },
              {
                icon: CalendarDays,
                title: 'Crews & scheduling',
                desc: 'Match crews to locations, see coverage gaps, and reduce missed cleans.',
              },
              {
                icon: AlertCircle,
                title: 'Issue resolution',
                desc: 'Track work orders, prioritize by urgency, and keep resolution in one place.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={`rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${(3 + i) * 80}ms` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Inventory */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="section-label mb-2">Inventory & orders</p>
                <h2 className="section-title text-2xl md:text-3xl mb-3">
                  One place for supplies and orders
                </h2>
                <p className="section-desc text-neutral-600 mb-6">
                  Track inventory by site or job, build orders in one place, and email them to your vendor. No more paper notes or scattered threads.
                </p>
                <ul className="space-y-2 text-sm text-neutral-600">
                  {['Inventory by location or job', 'Build and email orders to your vendor', 'Replace spreadsheets and sticky notes'].map((line, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 md:py-28 bg-white border-y border-neutral-200/80">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-3xl text-center">
          <Quote className="h-10 w-10 text-neutral-300 mx-auto mb-6" />
          <blockquote className="text-xl md:text-2xl font-medium text-neutral-800 leading-relaxed">
            &ldquo;We went from 2 hours per proposal to under 30 minutes. Same-day bids are the norm now, and our close rate went up.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-neutral-500">
            Janitorial operator, multi-location franchise
          </p>
        </div>
      </section>

      {/* Who it&apos;s for */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl">
          <div className="text-center mb-12">
            <p className="section-label mb-3">Built for the industry</p>
            <h2 className="section-title text-3xl md:text-4xl mb-4">
              From owner-operators to enterprise
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: UserCheck, label: 'Sales reps' },
              { icon: Building2, label: 'Owner-operators' },
              { icon: Users, label: 'Franchise operators' },
              { icon: Target, label: 'Facility services' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center p-6 rounded-xl border border-neutral-200/80 bg-white text-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-neutral-800 text-sm">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full platform */}
      <section className="py-20 md:py-28 bg-neutral-100/80 border-y border-neutral-200/80">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-4xl text-center">
          <p className="section-label mb-3">Platform</p>
          <h2 className="section-title text-3xl md:text-4xl mb-4">
            Sales and operations in one place
          </h2>
          <p className="section-desc text-lg mb-10 max-w-2xl mx-auto">
            After you win the bid: inspections, crews, compliance, purchase orders, and invoicing—all in JaniBear.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: ClipboardCheck, label: 'Inspections' },
              { icon: Users, label: 'Crews' },
              { icon: Shield, label: 'Compliance' },
              { icon: Package, label: 'Purchase orders' },
              { icon: FileSpreadsheet, label: 'Invoicing' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-neutral-200/80 text-neutral-700 text-sm font-medium"
                >
                  <Icon className="h-4 w-4 text-neutral-500" />
                  {item.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-2xl text-center">
          <h2 className="section-title text-3xl md:text-4xl mb-4">
            Ready to win more bids?
          </h2>
          <p className="section-desc text-lg mb-8">
            Start free. No credit card required. We&apos;ll help you configure pricing and get your first proposal out.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="landing-cta landing-cta-lg w-full sm:w-auto">
                Get started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="landing-outline w-full sm:w-auto">
                View pricing
              </Button>
            </Link>
          </div>
          <p className="text-sm text-neutral-500 mt-6">
            14-day free trial · Starting at $59/mo per company
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
            <div className="col-span-2 md:col-span-1 [&>span]:block">
              <Image
                src="/janibear-logo.png"
                alt="JaniBear"
                width={120}
                height={32}
                className="h-8 w-auto object-contain object-left mb-4 opacity-90"
                unoptimized
              />
              <p className="text-sm text-neutral-500 leading-relaxed">
                AI-powered sales and operations for janitorial companies.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li><Link href="/auth/signup" className="hover:text-neutral-900">Get started</Link></li>
                <li><Link href="/pricing" className="hover:text-neutral-900">Pricing</Link></li>
                <li><Link href="/survey" className="hover:text-neutral-900">Find your plan</Link></li>
                <li><Link href="/#features" className="hover:text-neutral-900">Features</Link></li>
                <li><Link href="/contact" className="hover:text-neutral-900">Contact</Link></li>
                <li><Link href="/auth/login" className="hover:text-neutral-900">Sign in</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li><a href="#" className="hover:text-neutral-900">About</a></li>
                <li><a href="#" className="hover:text-neutral-900">Contact</a></li>
                <li><a href="#" className="hover:text-neutral-900">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li><a href="#" className="hover:text-neutral-900">Privacy</a></li>
                <li><a href="#" className="hover:text-neutral-900">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-200 text-center text-sm text-neutral-500">
            &copy; {new Date().getFullYear()} JaniBear. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
