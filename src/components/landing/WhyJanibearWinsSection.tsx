'use client';

import { X, Check } from 'lucide-react';
import { HOMEPAGE } from '@/content/homepage';
import { BrandName } from '@/components/ui/brand-name';

export default function WhyJanibearWinsSection() {
  const { headline, comparison } = HOMEPAGE.whyWins;
  return (
    <section
      id="why-janibear-wins"
      className="relative py-16 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50"
      aria-labelledby="why-wins-heading"
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 id="why-wins-heading" className="font-heading text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight text-center">
          Why <BrandName /> wins
        </h2>
        <p className="text-center text-zinc-400 text-base md:text-lg mb-10 max-w-xl mx-auto">
          Compare. Then choose the system built for commercial cleaning.
        </p>

        <div className="rounded-2xl border border-zinc-700/80 overflow-hidden shadow-xl shadow-black/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="w-[50%] px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-500 bg-zinc-900/80 border-b border-r border-zinc-700/80">
                  Others
                </th>
                <th className="w-[50%] px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-400 bg-amber-500/10 border-b border-amber-500/30 border-l-2 border-l-amber-400/60">
                  <BrandName />
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-zinc-800/80 last:border-b-0 hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-6 py-4 bg-zinc-900/40 border-r border-zinc-700/80 align-top">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/15 border border-red-400/30" aria-hidden>
                        <X className="h-3.5 w-3.5 text-red-400" />
                      </span>
                      <span className="text-zinc-500 text-sm md:text-base leading-snug pt-0.5">{row.other}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-amber-500/5 border-l-2 border-l-amber-400/40 align-top">
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400/20 border border-amber-400/50" aria-hidden>
                        <Check className="h-3.5 w-3.5 text-amber-400" strokeWidth={2.5} />
                      </span>
                      <span className="text-white font-medium text-sm md:text-base leading-snug pt-0.5">{row.janibear}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-6">
          One system. Built by operators. <span className="text-amber-400/90 font-medium">No brainer.</span>
        </p>
      </div>
    </section>
  );
}
