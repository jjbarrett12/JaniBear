'use client';

import { Check, LayoutDashboard, ClipboardCheck, Users, ShieldAlert } from 'lucide-react';

const CARD_BORDER = '0 0 0 1px rgba(52, 211, 153, 0.4), 0 0 24px rgba(52, 211, 153, 0.12)';
const CARD_BORDER_HOVER = '0 0 0 1px rgba(52, 211, 153, 0.7), 0 0 32px rgba(52, 211, 153, 0.22)';

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
        {/* Section intro — anchored in card */}
        <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 px-6 py-8 md:px-10 md:py-10 mb-12 md:mb-16 max-w-4xl mx-auto text-center shadow-lg shadow-black/20">
          <div className="flex justify-center mb-5">
            <span
              className="inline-flex items-center rounded-full border-2 border-emerald-400/70 bg-zinc-900/95 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-emerald-400"
              style={{
                boxShadow: '0 0 0 1px rgba(52, 211, 153, 0.2), 0 0 20px rgba(52, 211, 153, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
                textShadow: '0 0 12px rgba(52, 211, 153, 0.4)',
              }}
            >
              Protect the Revenue
            </span>
          </div>
          <h2
            id="ops-control-heading"
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight text-center leading-[1.1]"
          >
            Winning the Account Is Only Half the Battle.
          </h2>
          <p className="mx-auto mt-6 max-w-[900px] text-center text-lg md:text-xl text-white font-medium leading-relaxed">
            High attrition rates kill janitorial companies. What happens after the contract is signed determines whether you stay a $100K company — or scale into a $100M operation.
          </p>
        </div>

        {/* Single row of 3 cards — larger */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {cards.map((card) => {
            const Icon = card.Icon;
            return (
              <article
                key={card.badge}
                className="group rounded-2xl p-8 md:p-10 bg-black border border-emerald-400/40 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/70 min-w-0"
                style={{
                  boxShadow: CARD_BORDER,
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = CARD_BORDER_HOVER;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = CARD_BORDER;
                }}
              >
                <div
                  className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-300 mb-5"
                  style={{ textShadow: '0 0 12px rgba(52, 211, 153, 0.4)' }}
                >
                  {card.badge}
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-400"
                    style={{ boxShadow: '0 0 12px rgba(52, 211, 153, 0.2)' }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight pt-1">
                    {card.title}
                  </h3>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5 text-sm text-white font-medium">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" strokeWidth={2.5} aria-hidden style={{ filter: 'drop-shadow(0 0 4px rgba(52, 211, 153, 0.5))' }} />
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

        {/* Final tagline — in card */}
        <div className="mt-20 md:mt-24">
          <div className="rounded-2xl border border-zinc-700/70 bg-zinc-900/50 px-6 py-8 max-w-2xl mx-auto text-center shadow-lg shadow-black/20">
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
