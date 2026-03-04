'use client';

import { X, Check } from 'lucide-react';

const ROWS: Array<{
  boardroom: { title: string; sub: string };
  janibear: { title: string; sub: string };
}> = [
  {
    boardroom: {
      title: "Designed by people who've never cleaned a building.",
      sub: 'Generic SaaS logic applied to field work.',
    },
    janibear: {
      title: 'Built inside a commercial cleaning company.',
      sub: '20+ years operating. 30,000 buildings bid.',
    },
  },
  {
    boardroom: {
      title: '6 logins. 4 spreadsheets. Zero visibility.',
      sub: 'Sales, ops, and finance live in different tools.',
    },
    janibear: {
      title: 'Sales, scope, contracts, inspections — one system.',
      sub: 'No disconnect between growth and execution.',
    },
  },
  {
    boardroom: {
      title: "You find out there's a problem when the account cancels.",
      sub: 'No early warning system.',
    },
    janibear: {
      title: 'Account health alerts before revenue drops.',
      sub: '30/60/90 decay tracking built-in.',
    },
  },
  {
    boardroom: {
      title: 'Still building proposals in Word.',
      sub: 'Manual scope creation slows growth.',
    },
    janibear: {
      title: 'AI builds scopes and proposals in minutes.',
      sub: 'Focus on winning, not formatting.',
    },
  },
];

export function OperatorVsBoardroomSection() {
  return (
    <section
      id="why-janibear-wins"
      className="bg-[#0E1116] py-32 md:py-40"
      aria-labelledby="operator-vs-boardroom-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="operator-vs-boardroom-heading"
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-[-0.03em] text-white"
          >
            Built for Operators. Not Boardrooms.
          </h2>
          <p className="mt-8 text-lg md:text-xl text-zinc-400 leading-[1.55] max-w-xl mx-auto">
            Most cleaning software was designed in conference rooms. This one was built inside live contracts.
          </p>
        </div>

        {/* Single comparison table */}
        <div className="mt-16 md:mt-20 rounded-2xl border border-zinc-700/80 bg-zinc-900/80 overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-700/80">
            {/* Column headers */}
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-zinc-700/80 bg-zinc-900/95">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                Boardroom Software
              </p>
            </div>
            <div className="p-6 md:p-8 bg-zinc-900/60 border-l-0 border-amber-400/20 md:border-l-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
                JANIBEAR
              </p>
            </div>
          </div>

          {ROWS.map((row, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-700/60 hover:bg-zinc-800/30 transition-colors ${i < ROWS.length - 1 ? 'border-b border-zinc-700/60' : ''}`}
            >
              {/* Boardroom cell */}
              <div className="flex items-start gap-4 p-6 md:p-8">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-950/50 border border-red-900/40 mt-0.5"
                  aria-hidden
                >
                  <X className="h-4 w-4 text-red-400/80" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="text-zinc-400 font-semibold leading-snug text-[15px] md:text-base">
                    {row.boardroom.title}
                  </p>
                  <p className="mt-1.5 text-sm text-zinc-500">{row.boardroom.sub}</p>
                </div>
              </div>
              {/* JANIBEAR cell */}
              <div className="flex items-start gap-4 p-6 md:p-8 md:bg-amber-500/[0.03] md:border-l-4 md:border-l-amber-400/30">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/10 mt-0.5"
                  aria-hidden
                >
                  <Check className="h-4 w-4 text-amber-400" strokeWidth={2.25} />
                </span>
                <div className="min-w-0">
                  <p className="text-white font-semibold leading-snug text-[15px] md:text-base">
                    {row.janibear.title}
                  </p>
                  <p className="mt-1.5 text-sm text-zinc-400">{row.janibear.sub}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          The difference is experience
        </p>
      </div>
    </section>
  );
}
