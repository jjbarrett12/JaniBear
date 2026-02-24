'use client';

import { HOMEPAGE } from '@/content/homepage';

export default function TrustSection() {
  const { headline, subhead, quote, attribution } = HOMEPAGE.trust;
  return (
    <section
      id="trust"
      className="relative py-16 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50"
      aria-labelledby="trust-heading"
    >
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-8 md:p-10 text-center">
          <h2 id="trust-heading" className="font-heading text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
            {headline}
          </h2>
          <p className="text-zinc-500 text-sm mb-8">{subhead}</p>
          <blockquote className="text-lg md:text-xl text-zinc-300 leading-relaxed italic">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-amber-400/90">{attribution}</p>
        </div>
      </div>
    </section>
  );
}
