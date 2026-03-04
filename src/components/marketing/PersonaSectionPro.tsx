'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Network,
  Building2,
  ArrowRight,
} from 'lucide-react';

type PersonaKey = 'operators' | 'franchise' | 'enterprise';

const PERSONAS: Record<
  PersonaKey,
  {
    title: string;
    desc: string;
    bullets: string[];
    cta: string;
    ctaHref: string;
    icon: typeof ClipboardCheck;
    accent: string;
    badge?: string;
    bestFor: string;
    whatYouGet: string[];
    exampleWorkflow: string[];
  }
> = {
  operators: {
    title: 'Independent Operators',
    desc: 'Run your entire cleaning business without hiring another manager.',
    bullets: [
      'AI Proposal Builder',
      'QR Inspection Tracking',
      'Crew Accountability',
      'Client Reporting',
    ],
    cta: 'See How Operators Use JANIBEAR',
    ctaHref: '/demo',
    icon: ClipboardCheck,
    accent: 'amber',
    bestFor: 'Owner-operators and small teams running 1–50 accounts.',
    whatYouGet: ['Proposals in minutes', 'Inspection proof of work', 'Crew accountability'],
    exampleWorkflow: ['Capture scope on-site', 'Send branded proposal', 'Track inspections & issues'],
  },
  franchise: {
    title: 'Franchisors & Franchisees',
    desc: 'Standardize how every location sells, inspects, and reports.',
    bullets: [
      'Franchise Performance Dashboards',
      'Territory Lead Routing',
      'Brand Standard Inspections',
      'Corporate Reporting',
    ],
    cta: 'Explore the Franchise System',
    ctaHref: '/demo',
    icon: Network,
    accent: 'cyan',
    bestFor: 'Franchise systems and multi-unit operators under one brand.',
    whatYouGet: ['Location-level dashboards', 'Lead routing by territory', 'Brand standard compliance'],
    exampleWorkflow: ['Set brand standards', 'Franchisees adopt & report', 'Corporate views outcomes'],
  },
  enterprise: {
    title: 'Enterprise Cleaning Companies',
    desc: 'Operate thousands of sites with real-time operational intelligence.',
    bullets: [
      'Multi-Site Reporting',
      'Regional Operations Dashboards',
      'Compliance Tracking',
      'Executive Analytics',
    ],
    cta: 'See Enterprise Capabilities',
    ctaHref: '/demo',
    icon: Building2,
    accent: 'purple',
    bestFor: 'National and regional cleaning companies with 100+ locations.',
    whatYouGet: ['Regional rollups', 'Compliance & audit trails', 'Executive dashboards'],
    exampleWorkflow: ['Configure regions & sites', 'Automate inspections', 'Review executive KPIs'],
  },
};

const ACCENT_STYLES: Record<
  string,
  { glow: string; border: string; radial: string; focusRing: string }
> = {
  amber: {
    glow: 'rgba(245,158,11,0.25)',
    border: 'rgba(245,158,11,0.4)',
    radial: 'rgba(245,158,11,0.18)',
    focusRing: 'ring-amber-400/50',
  },
  cyan: {
    glow: 'rgba(34,211,238,0.25)',
    border: 'rgba(34,211,238,0.4)',
    radial: 'rgba(34,211,238,0.18)',
    focusRing: 'ring-cyan-400/50',
  },
  purple: {
    glow: 'rgba(139,92,246,0.25)',
    border: 'rgba(139,92,246,0.4)',
    radial: 'rgba(139,92,246,0.18)',
    focusRing: 'ring-violet-400/50',
  },
};

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useCardMouseGlow(enabled: boolean) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!enabled || !cardRef.current) return;
      const el = cardRef.current;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setPos({ x, y }));
    },
    [enabled]
  );

  const onMouseLeave = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setPos(null);
  }, []);

  return { cardRef, pos, onMouseMove, onMouseLeave };
}

export default function PersonaSectionPro() {
  const [selected, setSelected] = useState<PersonaKey | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="who-its-for-pro"
      className="relative overflow-hidden border-t border-zinc-800/80 bg-zinc-950 py-24"
      aria-labelledby="persona-pro-heading"
    >
      {/* Optional noise overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <header className="mx-auto max-w-3xl text-center">
          <h2
            id="persona-pro-heading"
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

        {/* Three equal cards only — no preview panel */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
          {(Object.keys(PERSONAS) as PersonaKey[]).map((key) => (
            <PersonaCard
              key={key}
              personaKey={key}
              isSelected={selected === key}
              reducedMotion={reducedMotion}
              onSelect={() => setSelected(key)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PersonaCard({
  personaKey,
  isSelected,
  reducedMotion,
  onSelect,
}: {
  personaKey: PersonaKey;
  isSelected: boolean;
  reducedMotion: boolean;
  onSelect: () => void;
}) {
  const data = PERSONAS[personaKey];
  const Icon = data.icon;
  const styles = ACCENT_STYLES[data.accent] ?? ACCENT_STYLES.cyan;
  const { cardRef, pos, onMouseMove, onMouseLeave } = useCardMouseGlow(
    !reducedMotion
  );

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
      className={`group relative flex min-h-[320px] flex-col rounded-2xl border bg-zinc-950/40 p-8 md:p-10 backdrop-blur-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
        isSelected ? styles.focusRing : 'border-white/10 focus-visible:ring-white/30'
      } ${!reducedMotion ? 'hover:-translate-y-0.5' : ''}`}
      style={{
        borderColor: isSelected ? styles.border : undefined,
        boxShadow: isSelected ? `0 0 40px ${styles.glow}` : undefined,
      }}
      aria-pressed={isSelected}
      aria-label={`Select ${data.title} persona`}
    >
      {/* Cursor-tracking radial glow */}
      {!reducedMotion && pos && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, ${styles.radial}, transparent 40%)`,
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
        className={`relative z-10 mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-zinc-800/80 backdrop-blur-sm ${data.accent === 'amber' ? 'border-amber-400/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : data.accent === 'cyan' ? 'border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-violet-400/30 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]'}`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </div>

      <h3 className="relative z-10 font-heading text-xl font-semibold text-white">
        {data.title}
      </h3>
      <p className="relative z-10 mt-2 text-base text-zinc-400">{data.desc}</p>

      <ul className="relative z-10 mt-5 space-y-2">
        {data.bullets.slice(0, 3).map((b) => (
          <li key={b} className="flex items-center gap-2 text-sm text-zinc-300">
            <span
              className={`h-1 w-1 rounded-full ${data.accent === 'amber' ? 'bg-amber-400' : data.accent === 'cyan' ? 'bg-cyan-400' : 'bg-violet-400'}`}
            />
            {b}
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-auto pt-6">
        <Link
          href={data.ctaHref}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Book a Demo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
