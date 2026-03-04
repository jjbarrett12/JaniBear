'use client';

import { HOMEPAGE } from '@/content/homepage';

export default function TrustSection() {
  const { headline, subhead, quote, attribution, attributionLocation } = HOMEPAGE.trust;
  return (
    <section
      id="trust"
      className="relative py-24"
      aria-labelledby="trust-heading"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative mx-auto max-w-5xl rounded-3xl border-2 border-yellow-500/80 bg-black/70 px-10 py-14 text-center backdrop-blur-sm shadow-[0_0_40px_rgba(234,179,8,0.15)]">
          <h2 id="trust-heading" className="font-heading text-4xl md:text-5xl font-black tracking-tight text-white">
            {headline}
          </h2>
          {subhead ? <p className="mt-4 text-zinc-400 text-sm md:text-base">{subhead}</p> : null}
          <p className="mt-8 text-xl md:text-2xl leading-relaxed text-gray-200 italic">
            &ldquo;{quote}&rdquo;
          </p>
          <p className="mt-6 text-sm uppercase tracking-widest text-gray-400">
            {attribution}
            {attributionLocation && (
              <>
                <br />
                {attributionLocation}
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
