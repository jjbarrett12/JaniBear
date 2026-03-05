'use client';

import { useEffect, useState, useRef } from 'react';

const KPI_ITEMS = [
  { label: 'Buildings cleaned today', value: 24, suffix: '' },
  { label: 'Inspections due', value: 3, suffix: '' },
  { label: 'Accounts below health', value: 5, suffix: '' },
  { label: 'Revenue today', value: 9912, prefix: '$', suffix: '' },
] as const;

function AnimatedCount({
  value,
  prefix = '',
  suffix = '',
  duration = 800,
  reduceMotion = false,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  reduceMotion?: boolean;
}) {
  const [display, setDisplay] = useState(reduceMotion ? value : 0);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated) return;
        setHasAnimated(true);
        let start = 0;
        const startTime = performance.now();
        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - (1 - progress) ** 2;
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.2, rootMargin: '0px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, reduceMotion, hasAnimated]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export function HeroKpiStrip({ reduceMotion = false }: { reduceMotion?: boolean }) {
  return (
    <div
      className="inline-flex flex-wrap items-stretch justify-center gap-2 md:gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
      role="region"
      aria-label="Command center KPIs"
    >
      {KPI_ITEMS.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 min-w-[100px] md:min-w-[110px] text-center"
        >
          <span className="text-[10px] md:text-[11px] font-medium uppercase tracking-wider text-zinc-500 block mb-0.5">
            {item.label}
          </span>
          <span className="text-lg md:text-xl font-semibold text-white tracking-tight">
            <AnimatedCount
              value={item.value}
              prefix={item.prefix ?? ''}
              suffix={item.suffix}
              reduceMotion={reduceMotion}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
