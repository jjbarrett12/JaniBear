'use client';

import { HOMEPAGE } from '@/content/homepage';

const CARD_STYLES = [
  { border: 'border-blue-500/50', bg: 'bg-blue-500/10', accent: 'text-blue-400' },
  { border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', accent: 'text-emerald-400' },
  { border: 'border-amber-500/50', bg: 'bg-amber-500/10', accent: 'text-amber-400' },
];

export default function PlatformModelSection() {
  const { headline, subhead, steps } = HOMEPAGE.platformModel;
  return (
    <section
      id="platform-model"
      className="relative py-16 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50"
      aria-labelledby="platform-model-heading"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 id="platform-model-heading" className="font-heading text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
            {headline}
          </h2>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">{subhead}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
          {steps.map((step, i) => {
            const style = CARD_STYLES[i % CARD_STYLES.length];
            return (
              <div
                key={step.title}
                className={`relative rounded-2xl border ${style.border} ${style.bg} bg-zinc-900/50 p-6 md:p-8 text-center hover:shadow-lg transition-all`}
              >
                <span className={`text-sm font-semibold uppercase tracking-wider ${style.accent}`}>
                  {String(i + 1)}. {step.title}
                </span>
                <p className="mt-3 text-zinc-300 text-base">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
