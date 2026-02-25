'use client';

import { Check, ScanLine, FileText, LayoutDashboard, Zap } from 'lucide-react';

const CARD_BORDER_GLOW = `0 0 0 1px rgba(255, 193, 7, 0.25), 0 0 20px rgba(255, 193, 7, 0.08)`;
const CARD_BORDER_GLOW_HOVER = `0 0 0 1px rgba(255, 193, 7, 0.45), 0 0 28px rgba(255, 193, 7, 0.18)`;

const cards = [
  {
    badge: 'Native LiDAR Engine',
    title: 'Built-In LiDAR Site Capture',
    body: 'Walk in with a phone. Walk out with a complete scope. JANIBEAR includes native LiDAR scanning for instant square footage measurement, floor detection, fixture counting, and structured room mapping—no add-ons required.',
    bullets: [
      'Native LiDAR scanning',
      'Automatic square footage',
      'Floor-type detection',
      'Scope-ready room tagging',
    ],
    subline: 'No clipboards. No laser measurers. No third-party integrations.',
    Icon: ScanLine,
  },
  {
    badge: 'Proposal & Margin Engine',
    title: 'Instant, Margin-Controlled Proposals',
    body: 'Stop quoting off instinct. Generate branded proposals with automated pricing logic and built-in margin controls—ready in minutes.',
    bullets: [
      'Automated pricing rules',
      'Margin visibility',
      'Branded PDF generation',
      'Scope documentation',
    ],
    subline: 'Protect revenue before the deal is even signed.',
    Icon: FileText,
  },
  {
    badge: 'Pipeline Management',
    title: 'Intelligent Pipeline Control',
    body: "JANIBEAR doesn't just create proposals—it runs your pipeline. Track every deal, stage, activity, and engagement signal in one unified dashboard.",
    bullets: [
      'Visual deal stages',
      'Activity logging',
      'Proposal engagement tracking',
      'Revenue forecasting',
    ],
    subline: "No more deals living in someone's memory.",
    Icon: LayoutDashboard,
  },
  {
    badge: 'Sales Automation & Competition',
    title: 'Automated Follow-Up & Performance Competition',
    body: 'Follow-ups trigger automatically based on behavior, timing, and deal stage. Even solo reps can benchmark against national teams.',
    bullets: [
      'Smart follow-up sequences',
      'Auto-reminders',
      'Close-rate leaderboards',
      'National benchmarking (opt-in)',
    ],
    subline: 'Make performance visible. Watch output rise.',
    Icon: Zap,
  },
];

export function SalesInfrastructureSection() {
  return (
    <section
      id="sales-infrastructure"
      className="relative py-[110px] md:py-[120px] bg-black border-t border-white/5"
      aria-labelledby="sales-infra-heading"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2
            id="sales-infra-heading"
            className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight"
          >
            The Native LiDAR Sales Platform Built to Scale Janitorial Revenue
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base md:text-lg text-zinc-400 leading-relaxed">
            From first walkthrough to closed deal—JANIBEAR turns site data, proposals, pipeline, and performance into one unified system.
          </p>
        </div>

        {/* 2x2 grid — 36–40px gap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-9 md:gap-10">
          {cards.map((card) => {
            const Icon = card.Icon;
            return (
              <article
                key={card.badge}
                className="group rounded-2xl p-8 md:p-9 bg-zinc-900/80 border border-amber-400/20 transition-all duration-200 hover:-translate-y-1 hover:border-amber-400/40"
                style={{
                  boxShadow: `${CARD_BORDER_GLOW}, inset 0 1px 0 rgba(255,255,255,0.03)`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `${CARD_BORDER_GLOW_HOVER}, inset 0 1px 0 rgba(255,255,255,0.04)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `${CARD_BORDER_GLOW}, inset 0 1px 0 rgba(255,255,255,0.03)`;
                }}
              >
                <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-300 mb-5">
                  {card.badge}
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-500/5 text-amber-400">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-heading text-xl md:text-2xl font-bold text-white tracking-tight pt-1">
                    {card.title}
                  </h3>
                </div>
                <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-6">
                  {card.body}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={2.5} aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {card.subline}
                </p>
              </article>
            );
          })}
        </div>

        {/* Divider line + tagline */}
        <div className="mt-20 md:mt-24 pt-16 border-t border-white/10">
          <p
            className="text-center text-lg md:text-xl font-bold text-white tracking-tight"
            style={{ textShadow: `0 0 24px rgba(255, 193, 7, 0.2)` }}
          >
            Sales isn&apos;t guesswork. It&apos;s a system.
          </p>
        </div>
      </div>
    </section>
  );
}
