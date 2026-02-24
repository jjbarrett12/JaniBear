'use client';

import { HOMEPAGE } from '@/content/homepage';

export default function TrustSection() {
  const { headline, subhead, quote, attribution } = HOMEPAGE.trust;
  return (
    <section
      id="trust"
      className="relative py-12 md:py-16 border-t border-zinc-800/50"
      style={{ backgroundColor: '#0a0a0a' }}
      aria-labelledby="trust-heading"
    >
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="rounded-2xl border border-amber-500/50 bg-black/90 p-8 md:p-10 text-center">
          <h2 id="trust-heading" className="font-heading text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
            {headline}
          </h2>
          <p className="text-zinc-400 text-sm md:text-base mb-6">{subhead}</p>
          <blockquote className="text-lg md:text-xl text-white leading-relaxed italic">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-zinc-400">{attribution}</p>
        </div>
      </div>
    </section>
  );
}
