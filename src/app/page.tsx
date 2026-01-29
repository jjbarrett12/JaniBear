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
  Layers,
  Bath,
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
} from 'lucide-react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Nav */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block">
            <Image
              src="/janibear-logo.png"
              alt="Janibear"
              width={280}
              height={91}
              className="h-14 md:h-20 w-auto object-contain bg-transparent"
              priority
              unoptimized
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                Pricing
              </Button>
            </Link>
            <Link href="/survey" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Find Your Plan
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800">
                Sign In
              </Button>
            </Link>
            <Link href="/demo">
              <Button className="bg-orange-500 text-white hover:bg-orange-400 border-0 shadow-lg hover:shadow-orange-500/25">
                Book a Demo
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

        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/80 text-zinc-300 text-sm font-medium mb-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
          >
            <Camera className="h-4 w-4 text-orange-400" />
            <span>Built for janitorial sales teams</span>
          </div>

          <h1
            className={`text-4xl md:text-6xl font-bold text-white mb-6 leading-tight tracking-tight transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            Walk the building.
            <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
              Janibear writes the proposal.
            </span>
          </h1>

          <p
            className={`text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto leading-relaxed transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '100ms' }}
          >
            Use your phone camera to capture flooring, square footage, and fixture counts. Janibear instantly generates a professional cleaning proposal with scope, frequencies, and pricing.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '200ms' }}
          >
            <Link href="/demo">
              <Button size="lg" className="text-lg px-8 h-14 bg-orange-500 text-white hover:bg-orange-400 border-0 shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all">
                Book a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p
            className={`mt-6 text-sm text-zinc-500 max-w-xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '300ms' }}
          >
            Stop scribbling notes, counting fixtures twice, and spending your night building quotes.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              How it works
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              From walkthrough to proposal before you reach your car.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: '1', icon: Camera, title: 'Scan', desc: 'Capture rooms, floors, restrooms, glass, break rooms. Open Janibear → Start Walkthrough → point your camera.' },
              { step: '2', icon: CheckCircle2, title: 'Confirm', desc: 'Tap to verify flooring + counts. AI suggestions are editable—you stay in control.' },
              { step: '3', icon: Send, title: 'Send', desc: 'Proposal + scope + pricing generated instantly. Branded PDF or email—send before you leave the lot.' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`relative p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                  style={{ transitionDelay: `${index * 80}ms`, transitionDuration: '500ms' }}
                >
                  <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Janibear captures */}
      <section className="py-24 bg-zinc-900/30 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              What Janibear captures
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              AI detects flooring, areas, and fixtures—you confirm or edit. Everything is editable before sending.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-10">
            {[
              { icon: Layers, title: 'Flooring', items: ['Type (tile, LVT, carpet, concrete)', 'Condition notes (traffic, stains, stripping)', 'Area grouping by room type'] },
              { icon: Bath, title: 'Restrooms & fixtures', items: ['Toilets, urinals, sinks, mirrors', 'Dispensers, hand dryers', 'Trash cans / liners'] },
              { icon: Sparkles, title: 'Specials & other', items: ['Entry glass, stairwells, elevators', 'Break room appliances', 'High dusting / vents', 'Consumables estimate (optional)'] },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="bg-zinc-900/80 p-8 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-4">{item.title}</h3>
                  <ul className="space-y-2">
                    {item.items.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-400 text-sm">
                        <Check className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <p className="text-center text-zinc-500 text-sm font-medium">Everything is editable before sending.</p>
        </div>
      </section>

      {/* Output: what the client gets */}
      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              What your client gets
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              A professional, branded proposal—ready to send.
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-2xl border border-zinc-700 bg-zinc-900/80 overflow-hidden">
            <div className="bg-zinc-800 px-4 py-3 flex items-center gap-2 border-b border-zinc-700">
              <FileText className="h-4 w-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-400">Proposal_Acme_Cleaning_2025.pdf</span>
            </div>
            <div className="p-8 md:p-10 space-y-6 text-left">
              {['Cover & summary', 'Scope of work by area', 'Frequency schedule', 'Optional add-ons', 'Pricing table', 'Assumptions & exclusions • Signature block'].map((label, i) => (
                <div key={i}>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">{label}</div>
                  <div className="h-3 bg-zinc-800 rounded w-full" />
                  {i < 2 && <div className="h-3 bg-zinc-800/60 rounded w-5/6 mt-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for — Sales teams */}
      <section className="py-24 bg-zinc-900/30 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Built for janitorial sales teams
            </h2>
            <p className="text-lg text-zinc-400 max-w-xl mx-auto">
              Close more bids with less effort.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: UserCheck, label: 'Janitorial sales reps' },
              { icon: Building2, label: 'Owner-operators' },
              { icon: Users, label: 'Franchise operators' },
              { icon: Target, label: 'Facility services scaling quoting' },
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
                  <span className="font-medium text-white text-sm">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operations add-on */}
      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add-on
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              For operations teams
            </h2>
            <p className="text-lg text-zinc-400 mb-12 max-w-2xl">
              Need to run inspections, crews, compliance, and billing after the sale? Add the Operations module and keep sales and delivery in one place.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: ClipboardCheck, label: 'Inspections & quality' },
                { icon: Users, label: 'Crews & assignments' },
                { icon: Shield, label: 'Compliance & SDS' },
                { icon: Package, label: 'Purchase orders' },
                { icon: FileSpreadsheet, label: 'Invoicing' },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-white text-sm">{item.label}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-8 text-sm text-zinc-500">
              Add the Operations module to your plan for inspections, crew management, compliance, POs, and invoicing—all in one platform.
            </p>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              Speed + accuracy + consistency + win rate
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Same-day response. Close more by being first and professional.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: Clock, stat: '45–90 min', label: 'Saved per quote' },
              { icon: Zap, stat: 'Same-day', label: 'Respond, not next-day' },
              { icon: Sliders, stat: 'Standardize', label: 'Scopes across reps' },
              { icon: Target, stat: 'Close more', label: 'First + professional' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/80 rounded-xl p-6 border border-zinc-800 text-center hover:border-zinc-700 transition-colors"
                >
                  <Icon className="h-8 w-8 mx-auto mb-3 text-orange-400/80" />
                  <div className="text-2xl font-bold text-white mb-1">{item.stat}</div>
                  <div className="text-zinc-400 text-sm">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-24 bg-zinc-900/30 border-b border-zinc-800/80">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
              You stay in control
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              No vaporware. Honest about what we do—and what you control.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Shield, text: 'Works offline during walkthrough, syncs when connected' },
              { icon: Lock, text: 'Data is encrypted' },
              { icon: Sliders, text: 'You control pricing rules' },
              { icon: CheckCircle2, text: 'No more missed fixtures' },
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
          <p className="text-center text-zinc-500 text-sm mt-10 max-w-xl mx-auto">
            Square footage from camera is AI-assisted—accuracy varies by device. We anchor on auto floor type, fixture counts, structured scope, pricing automation, and proposal speed.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section id="book-demo" className="py-24 border-b border-zinc-800/80">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              From walkthrough to proposal before you reach your car
            </h2>
            <p className="text-lg text-zinc-400 mb-8">
              Book a demo or get early access. Bring your pricing sheet—we&apos;ll configure it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="text-lg px-8 h-14 bg-orange-500 text-white hover:bg-orange-400 border-0 shadow-lg hover:shadow-xl hover:shadow-orange-500/25 transition-all w-full sm:w-auto">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button size="lg" className="text-lg px-8 h-14 bg-orange-500 text-white hover:bg-orange-400 border-0 w-full sm:w-auto">
                  Get Early Access
                </Button>
              </Link>
            </div>
            <p className="text-sm text-zinc-500 mt-6">
              Demo • Early access • We&apos;ll configure your pricing rules
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
                Turn walkthroughs into proposals—camera + AI. Built for janitorial sales teams. Operations add-on available.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/demo" className="hover:text-white transition-colors">Book a Demo</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/survey" className="hover:text-white transition-colors">Find Your Plan</Link></li>
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
