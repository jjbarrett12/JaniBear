'use client';

import { Check, ScanLine, FileText, LayoutDashboard } from 'lucide-react';

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
];

export function SalesInfrastructureSection() {
  return (
    <section
      id="sales-infrastructure"
      className="relative py-[110px] md:py-[120px]"
      aria-labelledby="sales-infra-heading"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section intro — glass card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-8 md:px-10 md:py-10 mb-12 md:mb-16 max-w-4xl mx-auto text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex justify-center mb-5">
            <span className="inline-flex items-center rounded-full border border-indigo-400/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-indigo-300">
              For Sales Teams That Want to Dominate
            </span>
          </div>
          <h2
            id="sales-infra-heading"
            className="font-heading text-4xl md:text-5xl font-semibold text-white tracking-tight"
          >
            The Native LiDAR Sales Platform Built to Scale Janitorial Revenue
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg text-gray-400 leading-relaxed">
            From first walkthrough to closed deal—JANIBEAR turns site data, proposals, pipeline, and performance into one unified system.
          </p>
        </div>

        {/* Single row of 3 cards — glass morphism, indigo icon containers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {cards.map((card) => {
            const Icon = card.Icon;
            return (
              <article
                key={card.badge}
                className="group rounded-2xl p-8 md:p-10 min-w-0 bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40"
              >
                <div className="inline-flex items-center rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-5">
                  {card.badge}
                </div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-400">
                    <Icon className="h-6 w-6 transition-transform duration-300 group-hover:rotate-6" strokeWidth={1.5} aria-hidden />
                  </div>
                  <h3 className="font-heading text-xl md:text-2xl font-semibold text-white tracking-tight pt-1">
                    {card.title}
                  </h3>
                </div>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
                  {card.body}
                </p>
                <ul className="space-y-2.5 mb-6">
                  {card.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-center gap-2.5 text-sm text-zinc-300">
                      <Check className="h-4 w-4 shrink-0 text-indigo-400" strokeWidth={2.5} aria-hidden />
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

        {/* Tagline — glass card */}
        <div className="mt-20 md:mt-24">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-6 py-8 max-w-2xl mx-auto text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <p
              className="text-lg md:text-xl font-bold text-white tracking-tight"
              style={{ textShadow: `0 0 24px rgba(255, 193, 7, 0.2)` }}
            >
              Sales isn&apos;t guesswork. It&apos;s a system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
