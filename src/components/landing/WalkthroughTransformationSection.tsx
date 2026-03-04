'use client';

import { useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import { LayoutGrid, MapPin, Calculator, FileText } from 'lucide-react';
import { CtaGlowButton } from '@/components/marketing/CtaGlowButton';

const BEFORE_BULLETS = [
  'Measuring rooms manually',
  'Writing notes',
  'Estimating later',
];

const AFTER_CARDS = [
  { id: 'floorplan', title: 'Floorplan detection', icon: MapPin },
  { id: 'zones', title: 'Cleaning zones', icon: LayoutGrid },
  { id: 'pricing', title: 'Labor pricing', icon: Calculator },
  { id: 'proposal', title: 'Proposal generated', icon: FileText },
];

export function WalkthroughTransformationSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percent);
    },
    []
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );
  const handlePointerLeave = useCallback(() => setIsDragging(false), []);

  return (
    <section
      ref={sectionRef}
      id="walkthrough-transformation"
      className="relative overflow-hidden py-24 md:py-32"
      aria-labelledby="walkthrough-transformation-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-4xl h-[60%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <motion.header
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          <h2
            id="walkthrough-transformation-heading"
            className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white"
          >
            Walkthrough Transformation
          </h2>
          <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
            From manual building walkthrough to structured janitorial proposal — see the difference.
          </p>
        </motion.header>

        {/* Before/After comparison with draggable slider */}
        <motion.div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.3)] min-h-[420px] md:min-h-[480px]"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerUp}
        >
          {/* BEFORE — left side (full width, visible 0 to sliderPosition%) */}
          <div
            className="absolute inset-0 flex flex-col md:flex-row"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <div className="flex-1 flex flex-col md:flex-row w-full min-h-[320px] md:min-h-0">
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-center border-r border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 mb-4">
                  Before
                </p>
                <h3 className="font-heading text-xl md:text-2xl font-semibold text-white mb-4">
                  Manual Walkthrough
                </h3>
                <ul className="space-y-2" role="list">
                  {BEFORE_BULLETS.map((bullet) => (
                    <li
                      key={bullet}
                      className="flex items-center gap-2 text-sm text-zinc-300"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" aria-hidden />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              {/* iPhone video placeholder */}
              <div className="flex-1 flex items-center justify-center p-6 md:p-8">
                <div className="relative w-full max-w-[220px] aspect-[9/19] rounded-[2.5rem] border-[10px] border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/80">
                    <div className="text-center text-zinc-500">
                      <div className="w-14 h-14 mx-auto mb-2 rounded-full border-2 border-zinc-500 flex items-center justify-center">
                        <span className="text-2xl">▶</span>
                      </div>
                      <p className="text-xs font-medium">Walkthrough video</p>
                      <p className="text-[10px] mt-1">Loop</p>
                    </div>
                  </div>
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-zinc-900 rounded-b-xl z-10" />
                </div>
              </div>
            </div>
          </div>

          {/* AFTER — right side (clipped from sliderPosition% to 100%) */}
          <div
            className="absolute inset-0 flex flex-col md:flex-row md:justify-end"
            style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
          >
            <div className="flex-1 w-full min-h-[320px] md:min-h-0 md:w-1/2 md:max-w-[50%] p-6 md:p-8 flex flex-col justify-center md:ml-auto">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 mb-4">
                After
              </p>
              <h3 className="font-heading text-xl md:text-2xl font-semibold text-white mb-6">
                With JANIBEAR
              </h3>
              <div className="space-y-3">
                {AFTER_CARDS.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={
                      isInView
                        ? {
                            opacity: 1,
                            x: 0,
                            y: [0, -4, 0],
                            transition: {
                              opacity: { duration: 0.35 },
                              x: { duration: 0.4, delay: index * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
                              y: {
                                repeat: Infinity,
                                duration: 4,
                                repeatDelay: 1,
                                delay: 0.8 + index * 0.2,
                                ease: 'easeInOut',
                              },
                            },
                          }
                        : {}
                    }
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm shadow-[0_0_20px_rgba(99,102,241,0.12)] hover:border-indigo-500/30 transition-colors"
                  >
                    <card.icon className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden />
                    <span className="text-sm font-medium text-white">{card.title}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Draggable slider handle */}
          <div
            className="absolute top-0 bottom-0 w-1.5 md:w-2 z-20 cursor-ew-resize select-none touch-none group"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            onPointerDown={handlePointerDown}
            role="slider"
            aria-label="Compare before and after"
            aria-valuenow={sliderPosition}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onKeyDown={(e) => {
              const step = e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0;
              if (step) {
                e.preventDefault();
                setSliderPosition((p) => Math.max(0, Math.min(100, p + step)));
              }
            }}
          >
            <div className="absolute inset-y-0 -left-2 -right-2 md:-left-3 md:-right-3" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-indigo-400/80 bg-zinc-900 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="flex gap-0.5">
                <span className="w-0.5 h-3 bg-indigo-400/80 rounded-full" />
                <span className="w-0.5 h-3 bg-indigo-400/80 rounded-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <CtaGlowButton href="/demo" variant="primary">
            Start a LiDAR Walkthrough
          </CtaGlowButton>
          <CtaGlowButton href="/demo" variant="secondary">
            See 2-Minute Demo
          </CtaGlowButton>
        </motion.div>
      </div>
    </section>
  );
}
