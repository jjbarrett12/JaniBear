'use client';

import { Check } from 'lucide-react';
import { HOMEPAGE } from '@/content/homepage';
import { BrandName } from '@/components/ui/brand-name';

export default function WhyJanibearWinsSection() {
  const { bullets } = HOMEPAGE.whyWins;
  return (
    <section
      id="why-janibear-wins"
      className="relative py-16 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50"
      aria-labelledby="why-wins-heading"
    >
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 id="why-wins-heading" className="font-heading text-3xl md:text-4xl font-bold text-white mb-10 tracking-tight text-center">
          Why <BrandName /> wins
        </h2>
        <ul className="space-y-4">
          {bullets.map((bullet) => (
            <li key={bullet.slice(0, 28)} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
              <span className="text-zinc-300 text-base md:text-lg">{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
