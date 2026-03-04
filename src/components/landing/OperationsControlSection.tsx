'use client';

import { Check, LayoutDashboard, ClipboardCheck, Users, ShieldAlert } from 'lucide-react';

const cards = [
  {
    badge: 'COMMAND',
    title: 'Real-Time Operational Oversight',
    bullets: [
      'Multi-location visibility',
      'Performance rollups',
      'Live account health scoring',
      'Regional oversight',
    ],
    subline: 'No blind spots. No surprises.',
    Icon: LayoutDashboard,
  },
  {
    badge: 'PRECISION',
    title: 'Standardized Inspections That Actually Get Done',
    bullets: [
      'QR inspection system',
      'Trend tracking',
      'Photo verification',
      'Scoring consistency',
    ],
    subline: 'Consistency becomes non-negotiable.',
    Icon: ClipboardCheck,
  },
  {
    badge: 'EXECUTION',
    title: 'Intelligent Crew & Coverage Control',
    bullets: [
      'Crew-to-location matching',
      'Missed-clean alerts',
      'Schedule optimization',
      'Coverage visibility',
    ],
    subline: 'Execution becomes predictable.',
    Icon: Users,
  },
];

export function OperationsControlSection() {
  return (
    <section
      id="operations-control"
      className="relative py-[120px]"
      aria-labelledby="ops-control-heading"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section intro — glass card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-8 md:px-10 md:py-10 mb-12 md:mb-16 max-w-4xl mx-auto text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-emerald-300">
              Protect the Revenue
            </span>
          </div>
          <h2
            id="ops-control-heading"
            className="font-heading text-4xl md:text-5xl font-semibold text-white tracking-tight text-center leading-[1.1]"
          >
            Winning the Account Is Only Half the Battle.
          </h2>
          <p className="mx-auto mt-6 max-w-[900px] text-center text-lg text-gray-400 leading-relaxed">
            High attrition rates kill janitorial companies. What happens after the contract is signed determines whether you stay a $100K company — or scale into a $100M operation.
          </p>
        </div>

        {/* Single row of 3 cards — glass morphism, indigo-style icon containers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {cards.map((card) => {
            const Icon = card.Icon;
            return (
              <article
                key={card.badge}
                className="group rounded-2xl p-8 md:p-10 min-w-0 bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40"
              >
                <div className="inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-5">
                  {card.badge}
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-400">
                    <Icon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" strokeWidth={2} aria-hidden />
                  </div>
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-white tracking-tight pt-1">
                    {card.title}
                  </h3>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2.5} aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-white/90 font-semibold">
                  {card.subline}
                </p>
              </article>
            );
          })}
        </div>

        {/* Final tagline — glass card */}
        <div className="mt-20 md:mt-24">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-8 max-w-2xl mx-auto text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug">
              Half the battle is winning the account.
              <br />
              The difference between $100K and $100M is what happens next.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
