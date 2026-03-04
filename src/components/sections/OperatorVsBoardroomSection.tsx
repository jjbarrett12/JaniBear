'use client';

import { X, Check } from 'lucide-react';

const BOARDROOM_ITEMS = [
  {
    title: "Designed by people who've never cleaned a building.",
    sub: 'Generic SaaS logic applied to field work.',
  },
  {
    title: '6 logins. 4 spreadsheets. Zero visibility.',
    sub: 'Sales, ops, and finance live in different tools.',
  },
  {
    title: "You find out there's a problem when the account cancels.",
    sub: 'No early warning system.',
  },
  {
    title: 'Still building proposals in Word.',
    sub: 'Manual scope creation slows growth.',
  },
];

const JANIBEAR_ITEMS = [
  {
    title: 'Built inside a commercial cleaning company.',
    sub: '20+ years operating. 30,000 buildings bid.',
  },
  {
    title: 'Sales, scope, contracts, inspections — one system.',
    sub: 'No disconnect between growth and execution.',
  },
  {
    title: 'Account health alerts before revenue drops.',
    sub: '30/60/90 decay tracking built-in.',
  },
  {
    title: 'AI builds scopes and proposals in minutes.',
    sub: 'Focus on winning, not formatting.',
  },
];

export function OperatorVsBoardroomSection() {
  return (
    <section
      id="why-janibear-wins"
      className="bg-[#0E1116] py-32 md:py-40"
      aria-labelledby="operator-vs-boardroom-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
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

        {/* Cards + optional divider */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 md:gap-0 mt-24 md:mt-28 items-stretch">
          {/* Left card — Boardroom (muted, weaker) */}
          <div className="md:pr-4">
            <div className="h-full rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-8 md:p-10 flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500 mb-8">
                Boardroom Software
              </p>
              <ul className="space-y-7 flex-1">
                {BOARDROOM_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-950/50 border border-red-900/40 shadow-[0_0_12px_rgba(185,28,28,0.08)]"
                      aria-hidden
                    >
                      <X className="h-4 w-4 text-red-400/80" strokeWidth={2.25} />
                    </span>
                    <div>
                      <p className="text-zinc-400 font-semibold leading-snug text-[15px]">{item.title}</p>
                      <p className="mt-1.5 text-sm text-zinc-500">{item.sub}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Divider — understated */}
          <div className="hidden md:flex flex-col items-center justify-center px-4 py-8">
            <span className="text-[10px] font-medium uppercase tracking-[0.25em] text-zinc-600 whitespace-nowrap [writing-mode:vertical-lr] rotate-180">
              The difference is experience
            </span>
          </div>

          {/* Right card — JANIBEAR (dominant) */}
          <div className="md:pl-4">
            <div
              className="relative h-full rounded-2xl overflow-hidden flex flex-col"
              style={{
                padding: 'clamp(1.75rem, 4vw, 2.75rem)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                backgroundColor: 'rgba(10, 10, 12, 0.98)',
                boxShadow: '0 0 40px rgba(245, 158, 11, 0.07)',
                transform: 'scale(1.025)',
              }}
            >
              {/* Inner gradient warmth */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 35%, transparent 100%)',
                }}
                aria-hidden
              />
              <div className="relative">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400/95 mb-8">
                  JANIBEAR
                </p>
                <ul className="space-y-7 flex-1">
                  {JANIBEAR_ITEMS.map((item, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/10 shadow-[0_0_24px_rgba(245,158,11,0.09)]"
                        aria-hidden
                      >
                        <Check className="h-4 w-4 text-amber-400" strokeWidth={2.25} />
                      </span>
                      <div>
                        <p className="text-white font-semibold leading-snug text-[15px]">{item.title}</p>
                        <p className="mt-1.5 text-sm text-zinc-400">{item.sub}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
