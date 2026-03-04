'use client';

import { useEffect, useState } from 'react';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';

/**
 * Pipeline section: "Win the account. Run the work. Protect the margin."
 * Used on the homepage — import in src/app/page.tsx and render as <WhatJanibearDoesSection />.
 * Section id: #what-janibear-does.
 */

/** Type-safe card definition for the pipeline section */
export type PipelineCard = {
  id: string;
  pillLabel: string;
  promise: string;
  bullets: string[];
  proof: string;
  /** Shown on hover (desktop); hidden when prefers-reduced-motion */
  expandLine?: string;
  /** Accent: amber (sales), cyan (ops), emerald (exec) */
  accent: 'amber' | 'cyan' | 'emerald';
  /** Pipeline step label under card */
  stepLabel: string;
};

const PIPELINE_CARDS: PipelineCard[] = [
  {
    id: 'sales',
    pillLabel: 'Sales Engine',
    promise: 'Turn walkthroughs into signed contracts—fast.',
    bullets: [
      'AI walkthrough → scope + task list',
      'Auto frequency + labor assumptions',
      'Proposal + pricing in one flow',
      'Territory + pipeline visibility',
    ],
    proof: 'Cut bid time from hours to minutes.',
    expandLine: 'Win more bids with less back-and-forth.',
    accent: 'amber',
    stepLabel: 'Walkthrough',
  },
  {
    id: 'ops',
    pillLabel: 'Operations Engine',
    promise: 'Deliver clean, consistent service—without babysitting.',
    bullets: [
      'Crew schedules + coverage checks',
      'Inspections + photo proof',
      'Issues → escalation → resolution log',
      'Client portal for visibility + trust',
    ],
    proof: 'Fewer surprises. Faster fixes. Higher retention.',
    expandLine: 'One place for scope, proof, and handoffs.',
    accent: 'cyan',
    stepLabel: 'Launch',
  },
  {
    id: 'exec',
    pillLabel: 'Executive Command',
    promise: 'Stop margin bleed before it becomes churn.',
    bullets: [
      'Financial health + leakage signals',
      'Account decay + required touchpoints',
      'At-risk contracts + save plays',
      'KPI command center (daily/weekly)',
    ],
    proof: 'Protect margin + prevent silent churn.',
    expandLine: 'See risk before it hits the P&L.',
    accent: 'emerald',
    stepLabel: 'Retention + Margin',
  },
];

const PROOF_STRIP = [
  { label: 'Faster Bids', sub: 'Minutes, not hours' },
  { label: 'Cleaner Ops', sub: 'Accountability by default' },
  { label: 'Protected Margin', sub: 'Leakage surfaced early' },
] as const;

const accentClasses = {
  amber: {
    pill: 'bg-amber-500/20 border-amber-400/40 text-amber-300',
    dot: 'bg-amber-400',
    border: 'border-amber-400/40',
    borderHover: 'hover:border-amber-400/70',
    bullet: 'text-amber-400',
    gradient: 'from-amber-500/5 to-transparent',
  },
  cyan: {
    pill: 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300',
    dot: 'bg-cyan-400',
    border: 'border-cyan-400/40',
    borderHover: 'hover:border-cyan-400/70',
    bullet: 'text-cyan-400',
    gradient: 'from-cyan-500/5 to-transparent',
  },
  emerald: {
    pill: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300',
    dot: 'bg-emerald-400',
    border: 'border-emerald-400/40',
    borderHover: 'hover:border-emerald-400/70',
    bullet: 'text-emerald-400',
    gradient: 'from-emerald-500/5 to-transparent',
  },
} as const;

function PipelineCardBlock({
  card,
  index,
  mounted,
  reducedMotion,
}: {
  card: PipelineCard;
  index: number;
  mounted: boolean;
  reducedMotion: boolean;
}) {
  const [hover, setHover] = useState(false);
  const c = accentClasses[card.accent];

  return (
    <article
      aria-labelledby={`${card.id}-title`}
      className={`
        relative rounded-2xl border-2 ${c.border} ${c.borderHover}
        bg-zinc-900/60 bg-gradient-to-b ${c.gradient}
        p-6 md:p-8
        shadow-lg shadow-black/10
        transition-all duration-300 ease-out
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${reducedMotion ? '' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 hover:bg-zinc-900/80'}
      `}
      style={reducedMotion ? undefined : { transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        id={`${card.id}-title`}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold uppercase tracking-wider mb-5 ${c.pill}`}
      >
        <span className={`w-2 h-2 rounded-full ${c.dot}`} aria-hidden />
        {card.pillLabel}
      </div>

      <p className="font-semibold text-white text-lg md:text-xl mb-4 leading-snug">
        {card.promise}
      </p>

      <ul className="space-y-2.5 text-zinc-300 text-sm md:text-base" aria-label="Outcomes">
        {card.bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className={`h-4 w-4 ${c.bullet} shrink-0 mt-0.5`} aria-hidden />
            <span>{b}</span>
          </li>
        ))}
        {card.expandLine && (hover || reducedMotion) && (
          <li
            className="flex items-start gap-2 text-zinc-400 transition-opacity duration-200"
          >
            <Check className={`h-4 w-4 ${c.bullet} shrink-0 mt-0.5`} aria-hidden />
            <span>{card.expandLine}</span>
          </li>
        )}
      </ul>

      <p className="mt-5 text-xs text-zinc-500 leading-relaxed">
        {card.proof}
      </p>

      {/* Pipeline step label under card (visible on desktop under card, on mobile after card) */}
      <p
        className="mt-4 pt-4 border-t border-zinc-800/80 text-xs font-medium uppercase tracking-wider text-zinc-500"
        aria-hidden
      >
        {card.stepLabel}
      </p>
    </article>
  );
}

export default function WhatJanibearDoesSection() {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <section
      id="what-janibear-does"
      className="relative py-16 md:py-24 bg-black border-t border-zinc-800/50"
      aria-labelledby="pipeline-headline"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Headline block */}
        <div className="text-center mb-12 md:mb-16">
          <h2
            id="pipeline-headline"
            className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Win the account. Run the work. Protect the margin.
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-2">
            Three engines that replace busywork, stop misses, and keep accounts healthy—from walkthrough to margin protection.
          </p>
          <p className="text-sm text-zinc-500">
            Built by operators. Designed to eliminate leaks.
          </p>
        </div>

        {/* Cards + pipeline flow */}
        <div className="space-y-6 md:space-y-0">
          {/* Desktop: 3 cards with arrow connectors between */}
          <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 lg:gap-6 items-stretch max-w-6xl mx-auto">
            {PIPELINE_CARDS.flatMap((card, index) =>
              index === 0
                ? [
                    <div key={card.id} className="min-w-0">
                      <PipelineCardBlock
                        card={card}
                        index={index}
                        mounted={mounted}
                        reducedMotion={reducedMotion}
                      />
                    </div>,
                  ]
                : [
                    <div key={`arrow-${card.id}`} className="flex items-center justify-center text-zinc-600 py-4" aria-hidden>
                      <ArrowRight className="h-5 w-5 shrink-0" />
                    </div>,
                    <div key={card.id} className="min-w-0">
                      <PipelineCardBlock
                        card={card}
                        index={index}
                        mounted={mounted}
                        reducedMotion={reducedMotion}
                      />
                    </div>,
                  ]
            )}
          </div>

          {/* Mobile: stacked with Next / ↓ */}
          <div className="md:hidden space-y-6">
            {PIPELINE_CARDS.map((card, index) => (
              <div key={card.id}>
                <PipelineCardBlock
                  card={card}
                  index={index}
                  mounted={mounted}
                  reducedMotion={reducedMotion}
                />
                {index < PIPELINE_CARDS.length - 1 && (
                  <div
                    className="flex items-center justify-center gap-2 py-2 text-zinc-500 text-xs font-medium"
                    aria-hidden
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span>Next</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline label strip (desktop: under cards as one line) */}
        <div
          className="hidden md:flex items-center justify-center gap-2 lg:gap-4 mt-6 text-xs font-medium uppercase tracking-wider text-zinc-500"
          aria-hidden
        >
          <span>{PIPELINE_CARDS[0].stepLabel}</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
          <span>{PIPELINE_CARDS[1].stepLabel}</span>
          <ArrowRight className="h-4 w-4 shrink-0" />
          <span>{PIPELINE_CARDS[2].stepLabel}</span>
        </div>

        {/* Proof strip */}
        <div
          className="mt-12 md:mt-16 pt-8 border-t border-zinc-800/50 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center"
          aria-label="Proof points"
        >
          {PROOF_STRIP.map((item, i) => (
            <div key={i} className="space-y-1">
              <p className="font-semibold text-white text-sm uppercase tracking-wider">
                {item.label}
              </p>
              <p className="text-xs text-zinc-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
