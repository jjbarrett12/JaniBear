'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Lifecycle section: horizontal timeline (desktop) / vertical stack (mobile).
 * Scroll-triggered fade-in, gold accents, connector lines between stages.
 * Use on homepage: pass stages with title, description, icon (ReactNode).
 */

export type LifecycleStage = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

export type LifecycleSectionProps = {
  stages: LifecycleStage[];
  /** Section id for anchor links */
  id?: string;
  /** Optional headline override */
  headline?: string;
  /** Optional subhead override */
  subhead?: string;
};

const defaultHeadline = 'See It In Action';
const defaultSubhead = 'This is how it works. One workflow from walkthrough to account health.';

export default function LifecycleSection({
  stages,
  id = 'see-it-in-action',
  headline = defaultHeadline,
  subhead = defaultSubhead,
}: LifecycleSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const showAnimation = inView || reducedMotion;

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative py-16 md:py-24 bg-zinc-950/80 border-t border-zinc-800/50"
      aria-labelledby={`${id}-heading`}
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2
            id={`${id}-heading`}
            className="font-heading text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            {headline}
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-2">
            {subhead}
          </p>
          <p className="text-sm text-zinc-500">
            One continuous system. No disconnected tools.
          </p>
        </div>

        {/* Desktop: horizontal timeline with connector segments between stages */}
        <div className="hidden md:block overflow-x-auto">
          <div className="flex items-stretch justify-center gap-0 min-w-max px-4 py-2">
            {stages.map((stage, index) => (
              <div key={index} className="flex items-stretch">
                {/* Connector line between stages */}
                {index > 0 && (
                  <div
                    className="w-6 lg:w-8 shrink-0 self-center h-px bg-gradient-to-r from-amber-400/20 to-amber-400/40"
                    aria-hidden
                  />
                )}
                <div
                  className={`
                    w-[160px] lg:w-[180px] shrink-0 rounded-2xl border border-zinc-700/80
                    bg-zinc-900/60 bg-gradient-to-b from-amber-500/[0.06] to-transparent
                    px-4 py-5 text-center
                    transition-all duration-300 ease-out
                    ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                    ${!reducedMotion ? 'hover:-translate-y-1 hover:border-amber-400/50 hover:shadow-lg hover:shadow-amber-500/10' : ''}
                  `}
                  style={
                    reducedMotion
                      ? undefined
                      : { transitionDelay: `${Math.min(index * 80, 400)}ms` }
                  }
                >
                  <div
                    className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 mx-auto mb-3"
                    aria-hidden
                  >
                    {stage.icon}
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1.5 leading-tight">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {stage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: vertical stack with connector */}
        <div className="md:hidden max-w-sm mx-auto space-y-0">
          {stages.map((stage, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Vertical line */}
              {index < stages.length - 1 && (
                <div
                  className="absolute left-5 top-14 bottom-0 w-px bg-gradient-to-b from-amber-400/40 to-transparent"
                  aria-hidden
                />
              )}
              <div
                className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 mt-0.5"
                aria-hidden
              >
                {stage.icon}
              </div>
              <div
                className={`
                  flex-1 min-w-0 rounded-2xl border border-zinc-700/80
                  bg-zinc-900/60 bg-gradient-to-b from-amber-500/[0.06] to-transparent
                  px-4 py-4 pb-6
                  transition-all duration-300 ease-out
                  ${showAnimation ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}
                `}
                style={
                  reducedMotion
                    ? undefined
                    : { transitionDelay: `${Math.min(index * 60, 300)}ms` }
                }
              >
                <h3 className="font-semibold text-white text-sm mb-1 leading-tight">
                  {stage.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
