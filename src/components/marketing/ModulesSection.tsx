'use client';

import Link from 'next/link';
import {
  TrendingUp,
  LayoutGrid,
  Gauge,
  FileText,
  ClipboardCheck,
  ArrowRight,
} from 'lucide-react';

const MODULES = [
  {
    id: 'sales',
    title: 'Sales',
    value: 'AI-assisted pipeline from walkthrough to launch.',
    bullets: [
      'Territory intelligence',
      'Follow-up automation',
      'Walkthrough → Proposal handoff',
      'Launch to Operations transfer',
    ],
    badge: 'Revenue',
    href: '/demo',
    icon: TrendingUp,
    accent: 'blue',
  },
  {
    id: 'operations',
    title: 'Operations',
    value: 'QR-enforced delivery. AI crew optimization.',
    bullets: [
      'QR check-in / check-out logs',
      'Crew assignments & capacity',
      'SLA enforcement',
      'Issue routing',
    ],
    badge: 'Core',
    href: '/demo',
    icon: LayoutGrid,
    accent: 'emerald',
  },
  {
    id: 'command-center',
    title: 'Command Center',
    value: 'See risk before it hits P&L.',
    bullets: [
      'Account health scoring (AI)',
      'Margin leakage detection',
      'Revenue forecasts',
      'Executive snapshot view',
    ],
    badge: 'Executive',
    href: '/demo',
    icon: Gauge,
    accent: 'amber',
  },
  {
    id: 'proposals',
    title: 'Proposals',
    value: 'AI scope + pricing in minutes.',
    bullets: [
      'Scope builder',
      'Pricing intelligence engine',
      'Branded templates',
      'Send & track engagement',
    ],
    badge: 'AI',
    href: '/demo',
    icon: FileText,
    accent: 'violet',
  },
  {
    id: 'inspections',
    title: 'Inspections & QA',
    value: 'QR-verified inspections with photo proof.',
    bullets: [
      'Mobile inspections',
      'QR site validation',
      'Photo documentation',
      'Score trends & issue escalation',
    ],
    badge: 'QR',
    href: '/demo',
    icon: ClipboardCheck,
    accent: 'cyan',
  },
] as const;

const ACCENT_STYLES: Record<string, { badge: string; glow: string; cta: string }> = {
  blue: { badge: 'bg-blue-500/15 text-blue-400 border-blue-400/30', glow: 'group-hover:shadow-[0_0_32px_rgba(59,130,246,0.15)]', cta: 'text-blue-400' },
  emerald: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30', glow: 'group-hover:shadow-[0_0_32px_rgba(16,185,129,0.15)]', cta: 'text-emerald-400' },
  amber: { badge: 'bg-amber-500/15 text-amber-400 border-amber-400/30', glow: 'group-hover:shadow-[0_0_32px_rgba(245,158,11,0.15)]', cta: 'text-amber-400' },
  violet: { badge: 'bg-violet-500/15 text-violet-400 border-violet-400/30', glow: 'group-hover:shadow-[0_0_32px_rgba(139,92,246,0.15)]', cta: 'text-violet-400' },
  cyan: { badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-400/30', glow: 'group-hover:shadow-[0_0_32px_rgba(34,211,238,0.15)]', cta: 'text-cyan-400' },
};

export default function ModulesSection() {
  return (
    <section
      id="modules"
      className="relative py-16 md:py-24 border-t border-white/10 bg-gradient-to-b from-zinc-950 via-zinc-900/95 to-black"
      aria-labelledby="modules-heading"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 id="modules-heading" className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Your Entire Company. One Operating System.
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            AI-powered sales. QR-enforced execution. Real-time financial control.
          </p>
        </div>

        {/* Desktop: row 1 (3) + row 2 (2). Tablet: 2-col. Mobile: stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((module) => {
            const Icon = module.icon;
            const styles = ACCENT_STYLES[module.accent] ?? ACCENT_STYLES.blue;
            return (
              <Link
                key={module.id}
                href={module.href}
                className={`group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 md:p-7 transition-all duration-200 hover:-translate-y-1 hover:border-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${styles.glow}`}
              >
                <span className={`absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${styles.badge}`}>
                  {module.badge}
                </span>
                <div className="flex items-center gap-3 mb-4 pr-16">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 group-hover:text-white transition-colors">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-heading text-lg font-semibold text-white">{module.title}</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-relaxed mb-4">{module.value}</p>
                <ul className="space-y-1.5 mb-6 flex-1">
                  {module.bullets.map((bullet) => (
                    <li key={bullet} className="text-zinc-500 text-sm flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-zinc-500 shrink-0" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <span className={`inline-flex items-center gap-2 text-sm font-medium ${styles.cta} group-hover:gap-3 transition-[gap]`}>
                  Explore
                  <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
