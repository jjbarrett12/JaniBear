'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { HOMEPAGE } from '@/content/homepage';

const CARD_STYLES = [
  { border: 'border-blue-500/50', bg: 'bg-blue-500/10', accent: 'text-blue-400' },
  { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', accent: 'text-emerald-400' },
  { border: 'border-violet-500/50', bg: 'bg-violet-500/10', accent: 'text-violet-400' },
  { border: 'border-amber-500/50', bg: 'bg-amber-500/10', accent: 'text-amber-400' },
  { border: 'border-cyan-500/50', bg: 'bg-cyan-500/10', accent: 'text-cyan-400' },
];

export default function ModulesGridSection() {
  const { headline, subhead, items } = HOMEPAGE.modules;
  return (
    <section
      id="modules"
      className="relative py-16 md:py-24 bg-black border-t border-zinc-800/50"
      aria-labelledby="modules-heading"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 id="modules-heading" className="font-heading text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {headline}
          </h2>
          <p className="text-lg text-zinc-400 max-w-xl mx-auto">{subhead}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
          {items.map((item, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group rounded-2xl border ${style.border} ${style.bg} bg-zinc-900/50 p-5 md:p-6 hover:shadow-lg transition-all flex flex-col`}
              >
                <h3 className="font-semibold text-white text-base mb-1">{item.name}</h3>
                <p className="text-zinc-400 text-sm flex-1">{item.value}</p>
                <span className={`mt-3 inline-flex items-center gap-1 text-sm font-medium ${style.accent} group-hover:gap-2 transition-all`}>
                  Explore <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
