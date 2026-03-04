'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { ClipboardCheck, Network, Building2, ArrowRight, ListChecks } from 'lucide-react';

type PersonaKey = 'operators' | 'franchise' | 'enterprise';

const PERSONAS: Record<
  PersonaKey,
  {
    title: string;
    description: string;
    bullets: string[];
    accent: 'amber' | 'cyan' | 'purple';
    icon: typeof ClipboardCheck;
    badge?: string;
    whatYouGet: string[];
    exampleWorkflow: string[];
    secondaryCta: string;
  }
> = {
  operators: {
    title: 'Independent Operators',
    description: 'Run your entire cleaning business without hiring another manager.',
    bullets: ['AI Proposal Builder', 'QR Inspection Tracking', 'Crew Accountability'],
    accent: 'amber',
    icon: ClipboardCheck,
    whatYouGet: ['AI proposals', 'Inspection automation', 'Crew accountability'],
    exampleWorkflow: ['Create proposal', 'Schedule inspections', 'Track crew performance'],
    secondaryCta: 'See How Operators Use JANIBEAR →',
  },
  franchise: {
    title: 'Franchise Systems',
    description: 'Standardize how every location sells, inspects, and reports.',
    bullets: [
      'Franchise Performance Dashboards',
      'Territory Lead Routing',
      'Brand Standard Inspections',
    ],
    accent: 'cyan',
    icon: Network,
    badge: 'MOST POPULAR',
    whatYouGet: ['Franchise dashboards', 'Territory routing', 'Standardized inspections'],
    exampleWorkflow: ['Assign territories', 'Track franchise performance', 'Review brand compliance'],
    secondaryCta: 'Explore the Franchise System →',
  },
  enterprise: {
    title: 'Enterprise Cleaning Companies',
    description: 'Operate thousands of sites with real-time operational intelligence.',
    bullets: ['Multi-Site Reporting', 'Regional Operations Dashboards', 'Compliance Tracking'],
    accent: 'purple',
    icon: Building2,
    whatYouGet: ['Regional rollups', 'Compliance tracking', 'Executive dashboards'],
    exampleWorkflow: ['Configure regions', 'Automate inspections', 'Review executive KPIs'],
    secondaryCta: 'See Enterprise Capabilities →',
  },
};

const ACCENT_GLOW: Record<string, string> = {
  amber: 'rgba(245,158,11,0.15)',
  cyan: 'rgba(34,211,238,0.15)',
  purple: 'rgba(139,92,246,0.15)',
};

function useCardMouseGlow() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setPos({ x, y }));
  }, []);

  const onMouseLeave = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setPos(null);
  }, []);

  return { cardRef, pos, onMouseMove, onMouseLeave };
}

export default function PersonaSection() {
  const [active, setActive] = useState<PersonaKey>('franchise');
  const [previewKey, setPreviewKey] = useState<PersonaKey>('franchise');

  useEffect(() => {
    setPreviewKey(active);
  }, [active]);

  const persona = PERSONAS[previewKey];
  const Icon = persona.icon;

  return (
    <section
      id="who-its-for"
      className="relative border-t border-zinc-800/80 bg-zinc-950 py-28"
      aria-labelledby="persona-heading"
    >
      <div className="mx-auto max-w-7xl px-6">
        <header className="mx-auto max-w-3xl text-center">
          <h2
            id="persona-heading"
            className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            Built for Every Janitorial Business Model
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400 md:text-xl">
            Whether you&apos;re an independent operator, a franchise system, or a
            national cleaning company, JANIBEAR unifies sales, operations,
            inspections, and accountability in one platform.
          </p>
        </header>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Cards column — col-span-7 */}
          <div className="relative lg:col-span-7">
            {/* Animated connector lines — behind cards, hidden on small screens */}
            <div className="absolute inset-0 hidden lg:block" aria-hidden>
              <ConnectorLines />
            </div>

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-3">
              {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => (
                <PersonaCard
                  key={key}
                  personaKey={key}
                  isActive={active === key}
                  onSelect={() => setActive(key)}
                />
              ))}
            </div>
          </div>

          {/* Preview panel — col-span-5 */}
          <div className="lg:col-span-5">
            <PreviewPanel key={previewKey} persona={persona} />
          </div>
        </div>
      </div>
    </section>
  );
}

function PersonaCard({
  personaKey,
  isActive,
  onSelect,
}: {
  personaKey: PersonaKey;
  isActive: boolean;
  onSelect: () => void;
}) {
  const data = PERSONAS[personaKey];
  const Icon = data.icon;
  const glow = ACCENT_GLOW[data.accent] ?? 'rgba(255,255,255,0.08)';
  const { cardRef, pos, onMouseMove, onMouseLeave } = useCardMouseGlow();

  return (
    <div
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-zinc-950/40 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      style={{
        boxShadow: isActive ? `0 0 40px ${glow}` : undefined,
        borderColor: isActive ? (data.accent === 'amber' ? 'rgba(245,158,11,0.35)' : data.accent === 'cyan' ? 'rgba(34,211,238,0.35)' : 'rgba(139,92,246,0.35)') : undefined,
      }}
      aria-pressed={isActive}
      aria-label={`Select ${data.title}`}
    >
      {/* Cursor-tracking radial glow — only on hover */}
      {pos && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.08), transparent 40%)`,
          }}
          aria-hidden
        />
      )}

      {data.badge && (
        <div className="absolute top-4 right-4 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
          {data.badge}
        </div>
      )}

      <div
        className={`relative z-10 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border backdrop-blur-sm ${data.accent === 'amber' ? 'border-amber-400/25 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.12)]' : data.accent === 'cyan' ? 'border-cyan-400/25 bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.12)]' : 'border-violet-400/25 bg-violet-500/10 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.12)]'}`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <h3 className="relative z-10 font-heading text-lg font-semibold text-white">
        {data.title}
      </h3>
      <p className="relative z-10 mt-2 text-sm text-zinc-400">{data.description}</p>

      <ul className="relative z-10 mt-5 space-y-2">
        {data.bullets.map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-zinc-300">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${data.accent === 'amber' ? 'bg-amber-400' : data.accent === 'cyan' ? 'bg-cyan-400' : 'bg-violet-400'}`}
            />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewPanel({
  persona,
}: {
  persona: (typeof PERSONAS)[PersonaKey];
}) {
  const Icon = persona.icon;

  return (
    <div
      className="rounded-2xl border border-white/10 bg-zinc-950/60 p-10 backdrop-blur-xl animate-fade-in-up"
      style={{
        boxShadow: `0 0 30px ${ACCENT_GLOW[persona.accent] ?? 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div
        className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${persona.accent === 'amber' ? 'bg-amber-500/15 text-amber-400' : persona.accent === 'cyan' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-violet-500/15 text-violet-400'}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <h3 className="font-heading text-xl font-semibold text-white">
        {persona.title}
      </h3>
      <p className="mt-2 text-sm text-zinc-400">{persona.description}</p>

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          What you get
        </p>
        <ul className="mt-3 space-y-2">
          {persona.whatYouGet.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-zinc-300">
              <ListChecks className="h-4 w-4 shrink-0 text-zinc-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Example workflow
        </p>
        <ul className="mt-3 space-y-2">
          {persona.exampleWorkflow.map((step, i) => (
            <li key={step} className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/demo"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Book a Demo
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href="/demo"
          className="text-center text-sm font-medium text-cyan-400 hover:text-cyan-300 focus:outline-none focus-visible:underline"
        >
          {persona.secondaryCta}
        </Link>
      </div>
    </div>
  );
}

function ConnectorLines() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let raf: number;
    const duration = 6000;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) % duration;
      setOffset((elapsed / duration) * 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      className="h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Card1 → Card2 */}
      <path
        d="M 8 50 Q 33 30 50 50"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 8 50 Q 33 30 50 50"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.35"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4 8"
        strokeDashoffset={-offset * 0.24}
        style={{ filter: 'blur(0.2px)' }}
      />
      {/* Card2 → Card3 */}
      <path
        d="M 50 50 Q 67 70 92 50"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 50 50 Q 67 70 92 50"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.35"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="4 8"
        strokeDashoffset={-(offset * 0.24 + 50) % 100}
        style={{ filter: 'blur(0.2px)' }}
      />
    </svg>
  );
}
