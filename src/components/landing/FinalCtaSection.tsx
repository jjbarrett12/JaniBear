'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HOMEPAGE } from '@/content/homepage';
import { BrandName } from '@/components/ui/brand-name';

export default function FinalCtaSection() {
  const { headline, subhead, cta } = HOMEPAGE.finalCta;
  const [before, after] = subhead.split('JANIBEAR');
  return (
    <section
      id="book-demo"
      className="relative py-16 md:py-24 bg-black border-t border-zinc-800/50"
      aria-labelledby="final-cta-heading"
    >
      <div className="container mx-auto px-4 text-center max-w-2xl">
        <h2 id="final-cta-heading" className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight capitalize">
          {headline}
        </h2>
        <p className="text-lg text-zinc-400 mb-10 leading-relaxed">
          {before}<BrandName />{after}
        </p>
        <Link href="/demo">
          <Button size="lg" className="landing-cta landing-cta-lg text-base font-semibold px-10 min-h-[58px] rounded-xl shadow-[0_4px_32px_rgba(250,204,21,0.5)] hover:shadow-[0_8px_40px_rgba(250,204,21,0.6)] transition-all duration-200 active:scale-[0.99]">
            {cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
