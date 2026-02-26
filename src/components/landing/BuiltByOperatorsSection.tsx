'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HOMEPAGE } from '@/content/homepage';
import { SectionWrap } from './SectionWrap';
import { Check } from 'lucide-react';

const PROOF_ROWS = [
  'We bid buildings.',
  'We ran crews.',
  'We fixed failed inspections.',
  'We lost sleep over client expectations.',
] as const;

const CHIPS = ['20+ Years', 'Operator-built', 'Account retention focus'] as const;

export function BuiltByOperatorsSection() {
  const { headline, subline, soWeBuiltIt } = HOMEPAGE.proofStrip;
  return (
    <SectionWrap
      id="proof"
      glow="left"
      topSeparator
      className="py-20 md:py-24"
      aria-labelledby="proof-heading"
    >
      <div className="container mx-auto px-4 max-w-7xl">
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
              <p className="text-xl md:text-2xl font-semibold text-white tracking-tight">
                Not built in a boardroom.
              </p>
              <ul className="mt-6 space-y-4 flex-1">
                {PROOF_ROWS.map((line) => (
                  <li key={line} className="flex items-center gap-3 text-zinc-300">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
                    </span>
                    <span className="text-base">{line}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                {CHIPS.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <Link
                href="/demo"
                className="mt-6 inline-flex items-center font-semibold text-amber-400 hover:text-amber-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050810] rounded"
              >
                {soWeBuiltIt}
                <span className="ml-1 border-b-2 border-amber-400/50 hover:border-amber-400 transition-colors">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}
