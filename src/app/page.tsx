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
  Sparkles,
  FileText,
  Users,
  Clock,
  Shield,
  Lock,
  Sliders,
  Check,
  Building2,
  UserCheck,
  Zap,
  Target,
  ClipboardCheck,
  Package,
  FileSpreadsheet,
  Plus,
  Bot,
  TrendingUp,
  Mail,
  Calendar,
  BarChart3,
  DollarSign,
  MessageSquare,
  Repeat,
  Brain,
  Wand2,
} from 'lucide-react';
import { ProposalSampleScroll } from '@/components/sales/proposal-sample-scroll';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="landing-page min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav - white header, black text, large logo */}
      <nav className="landing-header border-b border-gray-200 bg-white sticky top-0 z-50 min-h-[4rem] h-auto py-1.5 flex items-center">
        <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block landing-logo-wrap">
            <Image
              src="/janibear-logo.png"
              alt="Janibear"
              width={320}
              height={104}
              className="landing-logo w-auto object-contain object-center bg-transparent"
              priority
              unoptimized
            />
          </Link>
          <div className="flex items-center justify-end gap-4 md:gap-6 flex-1 min-w-0">
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0">
                Pricing
              </Button>
            </Link>
            <Link href="/survey">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0">
                Find Your Plan
              </Button>
            </Link>
            <Link href="/#features">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0">
                Features
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0">
                Contact
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="landing-nav-link shrink-0">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="landing-cta shrink-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative container mx-auto px-4 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/80 text-zinc-300 text-sm font-medium mb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <Bot className="h-4 w-4 text-orange-400" />
            <span>AI-Powered Bidding & Proposals for Janitorial Companies</span>
          </div>

          <h1
            className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            From walkthrough to proposal
            <br />
            <span className="gradient-text bg-gradient-to-r from-orange-400 via-orange-500 to-cyan-400 bg-clip-text text-transparent">
              —automatically.
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto leading-relaxed transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '100ms' }}
          >
            Jani-Bear transforms your building walkthrough into a professional cleaning proposal with detailed scope, service frequencies, and accurate pricing.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <Link href="/auth/signup">
              <Button size="lg" className="landing-cta landing-cta-lg text-lg px-8 h-14">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="landing-outline text-lg px-8 h-14 border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600">
                View Pricing
              </Button>
            </Link>
          </div>

          <p
            className={`mt-6 text-sm text-zinc-500 max-w-xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '300ms' }}
          >
            Trusted by janitorial companies nationwide. No more manual counting, spreadsheet errors, or missed follow-ups.
          </p>
        </div>
      </section>

      {/* AI Features - Three Core Capabilities */}
      <section id="features" className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium mb-4">
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
              {
                icon: Camera,
                badge: 'AI Bidding',
                title: 'Intelligent Building Capture',
                desc: 'Point your phone camera at rooms, floors, and fixtures. AI automatically detects flooring types, counts fixtures, measures square footage, and identifies special requirements—all in real-time.',
                features: ['Floor type detection', 'Fixture counting', 'Square footage calculation', 'Special area identification'],
                color: 'orange',
              },
              {
                icon: Wand2,
                badge: 'AI Proposals',
                title: 'Instant Professional Proposals',
                desc: 'AI generates complete, branded proposals with scope of work, frequency schedules, pricing tables, and assumptions—ready to send in minutes, not hours.',
                features: ['Branded PDF generation', 'Automated pricing', 'Scope documentation', 'Professional formatting'],
                color: 'cyan',
              },
              {
                icon: Repeat,
                badge: 'AI Follow-Ups',
                title: 'Automated Follow-Up Cadences',
                desc: 'Never lose a lead. AI tracks proposal status, sends personalized follow-ups at optimal times, and maintains engagement until the deal closes—all automatically.',
                features: ['Smart timing', 'Personalized messaging', 'Status tracking', 'Engagement optimization'],
                color: 'emerald',
              },
            ].map((item, index) => {
              const Icon = item.icon;
              const colorClasses = {
                orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
                emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              };
              return (
                <div
                  key={index}
                  className={`relative p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}
                >
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

      {/* How It Works - Streamlined Process */}
      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              From Walkthrough to Closed Deal
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Your complete sales workflow, automated with AI.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                {
                  step: '1',
                  icon: Camera,
                  title: 'Capture Building Details',
                  desc: 'Walk through the property with your phone. AI captures flooring types, fixture counts, square footage, and special requirements—all automatically.',
                  detail: 'Works offline during walkthrough, syncs when connected',
                },
                {
                  step: '2',
                  icon: Wand2,
                  title: 'AI Generates Proposal',
                  desc: 'Within minutes, AI creates a complete, branded proposal with scope of work, frequency schedules, pricing, and all necessary documentation.',
                  detail: 'Customizable pricing rules, branded templates, professional formatting',
                },
                {
                  step: '3',
                  icon: Send,
                  title: 'Send & Track',
                  desc: 'Send the proposal via email or PDF. AI automatically tracks delivery, opens, and engagement—so you know exactly when to follow up.',
                  detail: 'Delivery tracking, open rates, engagement metrics',
                },
                {
                  step: '4',
                  icon: Repeat,
                  title: 'Automated Follow-Up Cadences',
                  desc: 'AI sends personalized follow-ups at optimal times based on proposal status, client engagement, and best practices—keeping you top-of-mind until the deal closes.',
                  detail: 'Smart timing, personalized messaging, status-aware automation',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className={`flex gap-6 p-6 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                    style={{ transitionDelay: `${index * 100}ms`, transitionDuration: '500ms' }}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-bold text-lg">
                        {item.step}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="h-5 w-5 text-orange-400" />
                        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                      </div>
                      <p className="text-zinc-400 mb-2 leading-relaxed">{item.desc}</p>
                      <p className="text-sm text-zinc-500">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* What Your Client Receives - 6–8 Page Proposal Sample (Auto-Scroll) */}
      <section className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              What Your Client Receives
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              A polished, 6–8 page proposal—the kind that wins bids. Use your own custom template; we merge in customer and job details for every bid.
            </p>
          </div>

          <ProposalSampleScroll />
        </div>
      </section>

      {/* AI Follow-Up Cadences - Detailed Section */}
      <section className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
                <Repeat className="h-4 w-4" />
                <span>AI Follow-Up Automation</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                Never Lose a Lead Again
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                AI-powered follow-up cadences ensure every proposal gets the attention it deserves—automatically.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              {[
                {
                  icon: Clock,
                  title: 'Smart Timing',
                  desc: 'AI determines optimal follow-up times based on proposal sent date, industry benchmarks, and client engagement signals.',
                },
                {
                  icon: MessageSquare,
                  title: 'Personalized Messaging',
                  desc: 'Each follow-up is customized with client name, proposal details, and relevant value propositions—never generic.',
                },
                {
                  icon: BarChart3,
                  title: 'Status Tracking',
                  desc: 'Automatically tracks proposal status, opens, clicks, and responses—so you always know where each deal stands.',
                },
                {
                  icon: TrendingUp,
                  title: 'Engagement Optimization',
                  desc: 'AI learns from response patterns and adjusts cadence timing and messaging to maximize engagement and close rates.',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Automated Follow-Up Workflow</h3>
                  <p className="text-zinc-300 mb-4">
                    Set it and forget it. AI handles follow-ups at days 3, 7, 14, and 30 after proposal delivery—or customize your own cadence. Each message is personalized, tracked, and optimized for maximum response rates.
                  </p>
                  <ul className="space-y-2 text-zinc-400 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Automatic follow-up scheduling based on best practices</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Personalized email templates with proposal details</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Engagement tracking and response detection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Pause automation when client responds or closes</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI & Results */}
      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Measurable Results for Janitorial Companies
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              See why janitorial sales teams choose Janibear to win more bids.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            {[
              { icon: Clock, stat: '75%', label: 'Time saved per proposal', sublabel: 'From 2 hours to 30 minutes' },
              { icon: Zap, stat: 'Same-day', label: 'Proposal delivery', sublabel: 'Before you leave the property' },
              { icon: TrendingUp, stat: '40%', label: 'Higher close rate', sublabel: 'With automated follow-ups' },
              { icon: DollarSign, stat: '3x', label: 'More proposals sent', sublabel: 'Same team, more opportunities' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 text-center hover:border-zinc-700 transition-colors"
                >
                  <Icon className="h-8 w-8 mx-auto mb-3 text-orange-400/80" />
                  <div className="text-3xl font-bold text-white mb-1">{item.stat}</div>
                  <div className="text-zinc-300 font-medium text-sm mb-1">{item.label}</div>
                  <div className="text-zinc-500 text-xs">{item.sublabel}</div>
                </div>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: CheckCircle2, text: 'No more manual counting or spreadsheet errors' },
                { icon: CheckCircle2, text: 'Consistent, professional proposals every time' },
                { icon: CheckCircle2, text: 'Never miss a follow-up opportunity' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <Icon className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-zinc-400 font-medium text-sm leading-relaxed">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Built for Janitorial Companies */}
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
                <div
                  key={index}
                  className="flex flex-col items-center p-6 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors text-center"
                >
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

      {/* Operations Add-on */}
      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Operations Module
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Complete Operations Management
            </h2>
            <p className="text-lg text-zinc-400 mb-12 max-w-2xl">
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
                  <div
                    key={index}
                    className="flex flex-col items-center gap-3 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 transition-colors"
                  >
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

      {/* Trust & Security */}
      <section className="py-24 border-b border-zinc-800/80 bg-zinc-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Enterprise-Grade Security & Control
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Your data, your pricing rules, your brand—you stay in complete control.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, text: 'Enterprise security & encryption' },
              { icon: Lock, text: 'Your data stays private & secure' },
              { icon: Sliders, text: 'Customize pricing rules & templates' },
              { icon: CheckCircle2, text: 'Full control over AI suggestions' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-start gap-4 p-6 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-zinc-400 font-medium text-sm leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="book-demo" className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to Win More Bids?
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Sign up free and see how AI-powered bidding, proposals, and follow-ups can transform your janitorial sales process. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup">
                <Button size="lg" className="text-lg px-8 h-14 bg-orange-500 text-white hover:bg-orange-400 border-0 shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all w-full sm:w-auto">
                  Get Started
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
              Free 14-day trial • No credit card required • We&apos;ll configure your pricing
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 text-zinc-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="[&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
              <Image
                src="/janibear-logo.png"
                alt="Janibear"
                width={220}
                height={72}
                className="h-14 md:h-16 w-auto mb-4 object-contain bg-transparent opacity-95"
                unoptimized
              />
              <p className="text-sm text-zinc-500">
                AI-powered bidding, proposals, and follow-up automation for janitorial companies. Win more bids, close more deals.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/signup" className="hover:text-white transition-colors">Get Started</Link></li>
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
            <p>&copy; {new Date().getFullYear()} Janibear. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
