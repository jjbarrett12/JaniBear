'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, HelpCircle } from 'lucide-react';
import { BusinessModelSelector, type BusinessModel } from '@/components/pricing/business-model-selector';
import { ModularPricing } from '@/components/pricing/modular-pricing';
import { BrandName } from '@/components/ui/brand-name';

export default function PricingPage() {
  const [selectedModel, setSelectedModel] = useState<BusinessModel | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const handleSelectModel = (model: BusinessModel) => {
    setSelectedModel(model);
    pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ minHeight: 40 }}>
            <Image src="/yellow.png" alt="JANIBEAR" width={560} height={182} className="!h-16 md:!h-20 w-auto !max-h-none object-contain bg-transparent" unoptimized />
          </Link>
          <div className="flex items-center justify-end gap-4 md:gap-6 flex-1 min-w-0">
            <Link href="/pricing"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Pricing</Button></Link>
            <Link href="/survey"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Find Your Plan</Button></Link>
            <Link href="/#features"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Features</Button></Link>
            <Link href="/contact"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Contact</Button></Link>
            <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Sign In</Button></Link>
            <Link href="/auth/signup"><Button size="sm" className="bg-amber-500 text-white hover:bg-amber-400 border-0 shrink-0">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      {/* 1. Hero — Reframe the decision */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            One Janitorial Platform. Built for How You Operate.
          </h1>
          <p className="text-lg text-zinc-400">
            Whether you sell, operate, franchise, or scale—<BrandName /> adapts to your model, not the other way around.
          </p>
        </div>

        {/* 2. Choose Your Business Model (primary gate) */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Choose your business model
          </h2>
          <p className="text-sm text-zinc-500 text-center mb-8">
            This isn’t pricing yet—it’s routing. We’ll show plans that fit.
          </p>
          <BusinessModelSelector onSelect={handleSelectModel} />
        </div>

        {/* Not sure? Survey CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/survey"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-400 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Not sure? Show me the recommended setup
          </Link>
        </div>
      </section>

      {/* 3. Modular Pricing (same engine, different defaults) */}
      <section ref={pricingRef} className="container mx-auto px-4 py-16 md:py-20 border-t border-zinc-800/80 bg-zinc-900/30">
        <div className="max-w-6xl mx-auto">
          <ModularPricing businessModel={selectedModel} dark />

          {/* 6. Microcopy — confidence anchors */}
          <div className="mt-12 pt-10 border-t border-zinc-800">
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-zinc-400">
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400 shrink-0" />
                All plans include onboarding
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400 shrink-0" />
                No per-employee pricing
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400 shrink-0" />
                Built for janitorial workflows—nothing generic
              </span>
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4 text-amber-400 shrink-0" />
                Switch modules anytime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-zinc-800/80 bg-zinc-900/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: 'What’s the difference between Sales Engine and Ops Engine?', a: 'Sales Engine focuses on winning bids: lead intake, proposals, pipeline, and analytics. Ops Engine focuses on proving performance: inspections, scope verification, issue tracking, and accountability. Full Platform includes both, connected with handoff workflows.' },
              { q: <>How does <BrandName /> adapt to my business model?</>, a: 'We route you by how you operate—owner/operator, area franchisor, or unit franchisee. Pricing tiers (Cub, Black Bear, Grizzly) scale with locations, users, and volume. Same platform; different defaults and ceilings for each model.' },
              { q: 'Can I change plans or modules later?', a: 'Yes. You can upgrade or downgrade tiers and switch between Sales, Ops, or Full Platform at any time. Changes take effect immediately.' },
              { q: 'What payment methods do you accept?', a: 'We accept all major credit cards through Stripe. All payments are secure and encrypted.' },
              { q: 'Is there a free trial?', a: 'Yes, all plans include a 14-day free trial. No credit card required to start.' },
              { q: 'Do you offer refunds?', a: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund." },
            ].map((faq, i) => (
              <div key={i} className="p-6 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <h3 className="font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-zinc-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 border-t border-zinc-800/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Not sure which plan is right?</h2>
          <p className="text-zinc-400 mb-6">
            Take our quick survey or book a demo. We&apos;ll configure your pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/survey">
              <Button size="lg" className="bg-amber-500 text-white hover:bg-amber-400 border-0">
                Show me my recommended setup
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-zinc-600 text-zinc-200 hover:bg-zinc-800 hover:text-white">
                Book a demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
