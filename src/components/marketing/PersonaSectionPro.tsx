'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Network,
  Building2,
  ArrowRight,
  ListChecks,
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
    badge: 'MOST POPULAR',
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
  const [selected, setSelected] = useState<PersonaKey>('franchise');
  const [previewKey, setPreviewKey] = useState<PersonaKey>('franchise');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setPreviewKey(selected);
  }, [selected]);

  const persona = PERSONAS[previewKey];
  const accentStyles = ACCENT_STYLES[persona.accent] ?? ACCENT_STYLES.cyan;

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

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
          {/* Cards column (2/3 on desktop) */}
          <div className="relative lg:col-span-2">
            {/* SVG network lines - desktop only */}
            {!reducedMotion && (
              <div
                className="absolute inset-0 hidden lg:block"
                aria-hidden
              >
                <NetworkLines reducedMotion={false} />
              </div>
            )}

            <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
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

          {/* Preview panel (1/3 on desktop) */}
          <div className="lg:col-span-1">
            <PreviewPanel
              key={previewKey}
              persona={persona}
              accentStyles={accentStyles}
              reducedMotion={reducedMotion}
            />
          </div>
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
      className={`group relative flex flex-col rounded-2xl border bg-zinc-950/40 p-6 backdrop-blur-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
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
        className={`relative z-10 mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-zinc-800/80 backdrop-blur-sm ${data.accent === 'amber' ? 'border-amber-400/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]' : data.accent === 'cyan' ? 'border-cyan-400/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-violet-400/30 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]'}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <h3 className="relative z-10 font-heading text-lg font-semibold text-white">
        {data.title}
      </h3>
      <p className="relative z-10 mt-1 text-sm text-zinc-400">{data.desc}</p>

      <ul className="relative z-10 mt-4 space-y-1.5">
        {data.bullets.slice(0, 3).map((b) => (
          <li key={b} className="flex items-center gap-2 text-xs text-zinc-300">
            <span
              className={`h-1 w-1 rounded-full ${data.accent === 'amber' ? 'bg-amber-400' : data.accent === 'cyan' ? 'bg-cyan-400' : 'bg-violet-400'}`}
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
  accentStyles,
  reducedMotion,
}: {
  persona: (typeof PERSONAS)[PersonaKey];
  accentStyles: { glow: string; border: string };
  reducedMotion: boolean;
}) {
  const Icon = persona.icon;

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-zinc-950/60 p-6 backdrop-blur-xl md:p-8 ${!reducedMotion ? 'animate-fade-in-up transition-all duration-300' : ''}`}
      style={{
        boxShadow: `0 0 30px ${accentStyles.glow}`,
      }}
    >
      <div
        className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${persona.accent === 'amber' ? 'bg-amber-500/15 text-amber-400' : persona.accent === 'cyan' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-violet-500/15 text-violet-400'}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <h3 className="font-heading text-xl font-semibold text-white">
        {persona.title}
      </h3>
      <p className="mt-2 text-sm text-zinc-400">{persona.bestFor}</p>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          What you get
        </p>
        <ul className="mt-2 space-y-2">
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
        <ul className="mt-2 space-y-2">
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

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href={persona.ctaHref}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Book a Demo
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={persona.ctaHref}
          className="text-center text-sm font-medium text-cyan-400 hover:text-cyan-300 focus:outline-none focus-visible:underline"
        >
          {persona.cta} →
        </Link>
      </div>
    </div>
  );
}

function NetworkLines({ reducedMotion }: { reducedMotion: boolean }) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;
    let raf: number;
    const tick = () => {
      setOffset((o) => (o + 0.4) % 100);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  return (
    <svg
      className="h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="persona-line-glow" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.22)" />
          <stop offset="0.5" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.22)" />
        </linearGradient>
      </defs>
      {/* Left -> middle */}
      <path
        d="M 16 50 Q 33 35 50 50"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="0.35"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 16 50 Q 33 35 50 50"
        stroke="url(#persona-line-glow)"
        strokeWidth="0.3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="3 5"
        strokeDashoffset={-offset}
        style={{ filter: 'blur(0.3px)' }}
      />
      {/* Middle -> right */}
      <path
        d="M 50 50 Q 67 65 84 50"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="0.35"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 50 50 Q 67 65 84 50"
        stroke="url(#persona-line-glow)"
        strokeWidth="0.3"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="3 5"
        strokeDashoffset={-(offset + 50) % 100}
        style={{ filter: 'blur(0.3px)' }}
      />
    </svg>
  );
}
