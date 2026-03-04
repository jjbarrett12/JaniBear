'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  Scan,
  LayoutGrid,
  Calculator,
  FileText,
  CheckCircle2,
  ClipboardCheck,
} from 'lucide-react';
import { CtaGlowButton } from '@/components/marketing/CtaGlowButton';

const WORKFLOW_STEPS = [
  { id: 'scan', title: 'Scan', icon: Scan, description: 'Use native LiDAR to capture square footage, layout, and surfaces during a walkthrough.' },
  { id: 'scope', title: 'Scope', icon: LayoutGrid, description: 'JANIBEAR converts the scan into structured cleaning zones and task lists.' },
  { id: 'price', title: 'Price', icon: Calculator, description: 'Labor models estimate staffing, cleaning time, and margin automatically.' },
  { id: 'proposal', title: 'Proposal', icon: FileText, description: 'Generate a professional proposal with scope, pricing, and contract terms.' },
  { id: 'win', title: 'Win', icon: CheckCircle2, description: 'Clients review and sign proposals digitally in minutes.' },
  { id: 'execute', title: 'Execute', icon: ClipboardCheck, description: 'Crew checklists, inspections, and photo proof ensure contracts are delivered perfectly.' },
] as const;

const container = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 * i },
  }),
};

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export function ConversionWorkflowSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="relative overflow-hidden py-24 md:py-32"
      aria-labelledby="conversion-workflow-heading"
    >
      {/* Radial glow behind workflow */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div className="h-[70%] w-[90%] max-w-4xl rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.header
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">
            How it works
          </p>
          <h2
            id="conversion-workflow-heading"
            className="mt-4 font-heading text-4xl md:text-5xl font-semibold tracking-tight text-white"
          >
            From Walkthrough to Contract in Minutes
          </h2>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed">
            JANIBEAR transforms building walkthroughs into structured scopes, accurate pricing,
            and professional proposals — all before you leave the property.
          </p>
        </motion.header>

        {/* Horizontal connection: [Scan]───[Scope]───[Price]───[Proposal]───[Win]───[Execute] with animated pulse dot */}
        <motion.div
          className="mt-16 relative"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={container}
        >
          {/* Connection line + pulse dot — desktop */}
          <div className="hidden lg:block absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px z-0 pt-px" style={{ marginTop: '-2.5rem' }} aria-hidden>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div
              className="workflow-pulse-dot top-0 left-0 -translate-y-1/2 -translate-x-1/2 rounded-full bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
              style={{ width: 8, height: 8 }}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-2">
            {WORKFLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.id}
                  variants={item}
                  className="relative z-10"
                >
                  <div
                    className="group relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/40 md:p-6"
                  >
                    <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-400 transition-transform duration-300 group-hover:rotate-6">
                      <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white md:text-lg">
                      {step.title}
                    </h3>
                    <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-400 md:text-sm">
                      {step.description}
                    </p>
                    <span className="absolute right-3 top-3 text-[10px] font-medium tabular-nums text-zinc-500" aria-hidden>
                      {index + 1}/6
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA row — cursor-tracking glow buttons */}
        <motion.div
          className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <CtaGlowButton href="/demo" variant="primary">
            See a 2-Minute Demo
          </CtaGlowButton>
          <CtaGlowButton href="/demo" variant="secondary">
            Start a LiDAR Walkthrough
          </CtaGlowButton>
        </motion.div>
      </div>
    </section>
  );
}
