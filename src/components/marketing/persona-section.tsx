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
    description: string;
    bullets: string[];
    accent: 'amber' | 'cyan' | 'purple';
    icon: typeof ClipboardCheck;
    whatYouGet: string[];
    exampleWorkflow: string[];
  }
> = {
  operators: {
    title: 'Independent Operators',
    description:
      'Run your entire cleaning business without hiring another manager.',
    bullets: [
      'AI Proposal Builder',
      'QR Inspection Tracking',
      'Crew Accountability',
    ],
    accent: 'amber',
    icon: ClipboardCheck,
    whatYouGet: [
      'AI proposals',
      'Inspection automation',
      'Crew accountability',
    ],
    exampleWorkflow: [
      'Create proposal',
      'Schedule inspections',
      'Track crew performance',
    ],
  },
  franchise: {
    title: 'Franchise Systems',
    description:
      'Standardize how every location sells, operates, and reports.',
    bullets: [
      'Franchise Performance Dashboards',
      'Territory Lead Routing',
      'Brand Standard Reporting',
    ],
    accent: 'cyan',
    icon: Network,
    whatYouGet: [
      'Franchise dashboards',
      'Territory routing',
      'Brand standard reporting',
    ],
    exampleWorkflow: [
      'Assign territories',
      'Track franchise performance',
      'Monitor brand compliance',
    ],
  },
  enterprise: {
    title: 'Enterprise Cleaning Companies',
    description:
      'Operate thousands of sites with real-time operational intelligence.',
    bullets: [
      'Multi-Site Reporting',
      'Regional Operations Dashboards',
      'Compliance Tracking',
    ],
    accent: 'purple',
    icon: Building2,
    whatYouGet: [
      'Regional rollups',
      'Compliance tracking',
      'Executive dashboards',
    ],
    exampleWorkflow: [
      'Configure regions',
      'Automate inspections',
      'Review executive KPIs',
    ],
  },
};

const ACCENT_GLOW: Record<
  string,
  { border: string; borderDefault: string; shadow: string; shadowDefault: string; glow: string }
> = {
  amber: {
    border: 'border-amber-400/60',
    borderDefault: 'border-amber-400/45',
    shadow: '0 0 50px rgba(245, 158, 11, 0.4)',
    shadowDefault: '0 0 32px rgba(245, 158, 11, 0.2)',
    glow: 'rgba(255, 255, 255, 0.08)',
  },
  cyan: {
    border: 'border-cyan-400/60',
    borderDefault: 'border-cyan-400/45',
    shadow: '0 0 50px rgba(34, 211, 238, 0.4)',
    shadowDefault: '0 0 32px rgba(34, 211, 238, 0.2)',
    glow: 'rgba(255, 255, 255, 0.08)',
  },
  purple: {
    border: 'border-violet-400/60',
    borderDefault: 'border-violet-400/45',
    shadow: '0 0 50px rgba(139, 92, 246, 0.4)',
    shadowDefault: '0 0 32px rgba(139, 92, 246, 0.2)',
    glow: 'rgba(255, 255, 255, 0.08)',
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
  const [vars, setVars] = useState<{ x: number; y: number } | null>(null);
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
      rafRef.current = requestAnimationFrame(() => setVars({ x, y }));
    },
    [enabled]
  );

  const onMouseLeave = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    setVars(null);
  }, []);

  return { cardRef, vars, onMouseMove, onMouseLeave };
}

export default function PersonaSection() {
  const [selected, setSelected] = useState<PersonaKey | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <section
      id="who-its-for"
      className="relative py-28"
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

        {/* Three equal cards only — no preview panel */}
        <div className="relative mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8">
          {/* Animated connector flow — desktop only, behind cards */}
          {!reducedMotion && (
            <div
              className="absolute inset-0 hidden md:block"
              aria-hidden
            >
              <svg
                className="h-full w-full"
                preserveAspectRatio="none"
                viewBox="0 0 300 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M 30 50 Q 100 20 150 50"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  className="persona-connector-path"
                />
                <path
                  d="M 150 50 Q 200 80 270 50"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  className="persona-connector-path"
                  style={{ animationDelay: '3s' }}
                />
              </svg>
            </div>
          )}

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
  const accent = ACCENT_GLOW[data.accent] ?? ACCENT_GLOW.cyan;
  const { cardRef, vars, onMouseMove, onMouseLeave } =
    useCardMouseGlow(!reducedMotion);

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
      className={`group relative flex min-h-[380px] flex-col rounded-2xl border bg-zinc-950/40 p-8 backdrop-blur-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
        isSelected ? accent.border : accent.borderDefault
      } ${!reducedMotion ? 'hover:scale-[1.03] hover:-translate-y-2' : ''}`}
      style={{
        boxShadow: isSelected ? accent.shadow : accent.shadowDefault,
        ['--x' as string]: vars ? `${vars.x}px` : undefined,
        ['--y' as string]: vars ? `${vars.y}px` : undefined,
      }}
      aria-pressed={isSelected}
      aria-label={`Select ${data.title}`}
    >
      {/* Cursor-tracking radial glow — visible on hover */}
      {!reducedMotion && vars && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            background: `radial-gradient(600px circle at var(--x) var(--y), ${accent.glow}, transparent 40%)`,
          }}
          aria-hidden
        />
      )}

      <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900">
        <Icon
          className={`h-7 w-7 ${
            data.accent === 'amber'
              ? 'text-amber-400'
              : data.accent === 'cyan'
                ? 'text-cyan-400'
                : 'text-violet-400'
          }`}
          strokeWidth={1.75}
        />
      </div>

      <h3 className="relative z-10 font-heading text-xl font-semibold text-white">
        {data.title}
      </h3>
      <p className="relative z-10 mt-2 text-sm leading-relaxed text-zinc-400">
        {data.description}
      </p>

      <ul className="relative z-10 mt-5 space-y-2">
        {data.bullets.map((b) => (
          <li
            key={b}
            className="flex items-center gap-2 text-sm text-zinc-300"
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                data.accent === 'amber'
                  ? 'bg-amber-400'
                  : data.accent === 'cyan'
                    ? 'bg-cyan-400'
                    : 'bg-violet-400'
              }`}
            />
            {b}
          </li>
        ))}
      </ul>

      <div className="relative z-10 mt-auto pt-6">
        <Link
          href="/demo"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          Book a Demo
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

