import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { PricingCards } from '@/components/pricing/pricing-cards';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-1.5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center shrink-0 bg-transparent [&>span]:bg-transparent [&>span]:shadow-none [&>span]:block" style={{ minHeight: 40 }}>
            <Image src="/janibear-logo.png" alt="Janibear" width={560} height={182} className="!h-8 md:!h-10 w-auto !max-h-none object-contain bg-transparent" unoptimized />
          </Link>
          <div className="flex items-center justify-end gap-4 md:gap-6 flex-1 min-w-0">
            <Link href="/pricing"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Pricing</Button></Link>
            <Link href="/survey"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Find Your Plan</Button></Link>
            <Link href="/#features"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Features</Button></Link>
            <Link href="/contact"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Contact</Button></Link>
            <Link href="/auth/login"><Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white hover:bg-zinc-800 shrink-0">Sign In</Button></Link>
            <Link href="/auth/signup"><Button size="sm" className="bg-orange-500 text-white hover:bg-orange-400 border-0 shrink-0">Get Started</Button></Link>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-zinc-400">
            Choose strictly sales (Sales 1 or Sales 2) or add QC and admin help (Sales 1 + QC 1 or Sales 2 + QC 2).
          </p>
        </div>

        <PricingCards dark />
      </section>

      <section className="py-16 border-t border-zinc-800/80 bg-zinc-900/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Can I change plans later?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately.' },
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

      <section className="py-16 border-t border-zinc-800/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Not sure which plan is right?</h2>
          <p className="text-zinc-400 mb-6">
            Take our quick survey or book a demo. We&apos;ll configure your pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/survey">
              <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-400 border-0">
                Take our survey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" className="bg-orange-500 text-white hover:bg-orange-400 border-0">
                Book a demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
