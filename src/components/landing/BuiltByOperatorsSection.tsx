'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HOMEPAGE } from '@/content/homepage';
import { SectionWrap } from './SectionWrap';

export function BuiltByOperatorsSection() {
  const { headline, subline } = HOMEPAGE.proofStrip;
  return (
    <SectionWrap
      id="proof"
      glow="left"
      topSeparator
      className="py-20 md:py-24"
      aria-labelledby="proof-heading"
    >
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 p-6 md:p-10 lg:p-12 shadow-lg shadow-black/20 overflow-hidden">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16 md:items-center">
            {/* Left: kicker + headline + subhead + watermark */}
            <div className="relative flex flex-col justify-center order-2 md:order-1">
            <div className="relative">
              {/* Watermark: large JANIBEAR behind headline, 5–8% opacity */}
              <Image
                src="/logo.png"
                alt=""
                width={420}
                height={140}
                className="absolute -left-4 top-1/2 -translate-y-1/2 w-[120%] max-w-[480px] h-auto object-contain opacity-[0.06] pointer-events-none select-none"
                aria-hidden
                unoptimized
              />
              <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-300 mb-6">
                Built in the field
              </span>
              <h2
                id="proof-heading"
                className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mt-2"
              >
                {headline}
                <br />
                <span className="text-zinc-500">{subline}</span>
              </h2>
              <p className="mt-6 text-lg text-zinc-400 leading-relaxed max-w-xl">
                Software that wins contracts, enforces accountability, and protects accounts long-term.
              </p>
            </div>
          </div>

          {/* Right: glass story card */}
          <div className="order-1 md:order-2">
            <div
              className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 md:p-10 shadow-xl min-h-[320px] flex flex-col"
              style={{
                boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 25px 50px -12px rgba(0,0,0,0.4), 0 0 60px -20px rgba(251, 191, 36, 0.08)',
                borderLeftWidth: '3px',
                borderLeftColor: 'rgba(251, 191, 36, 0.35)',
              }}
            >
              <div className="space-y-5 sm:space-y-6 text-slate-300 max-w-xl">
                <p className="text-base sm:text-lg text-slate-300">
                  JANIBEAR wasn&apos;t built in a boardroom. It was built inside a commercial cleaning company.
                </p>

                <div className="uppercase tracking-widest text-xs text-yellow-400 font-semibold">
                  20+ YEARS IN THE FIELD
                </div>

                <ul className="space-y-2 text-slate-300 text-sm">
                  <li>• Bid buildings</li>
                  <li>• Managed crews</li>
                  <li>• Fixed failed inspections</li>
                  <li>• Lost sleep over client expectations</li>
                </ul>

                <p className="text-slate-400 text-sm leading-relaxed">
                  When we went looking for software to run the business, we found generic CRMs, bloated platforms,
                  and tools that required massive customization just to make them work for cleaning companies.
                </p>

                <p className="text-slate-300 font-semibold text-sm leading-relaxed">
                  We didn&apos;t need another generic software tool. We needed a system that wins contracts, enforces
                  accountability, and protects client relationships long-term.
                </p>

                <Link
                  href="/demo"
                  className="inline-flex items-center text-yellow-400 font-semibold hover:text-yellow-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050810] rounded"
                >
                  So we built JANIBEAR →
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </SectionWrap>
  );
}
