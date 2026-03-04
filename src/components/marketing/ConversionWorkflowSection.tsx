'use client';

import Link from 'next/link';
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
import { Button } from '@/components/ui/button';

const WORKFLOW_STEPS = [
  {
    id: 'scan',
    title: 'Scan the Building',
    icon: Scan,
    description:
      'Use native LiDAR to capture square footage, layout, and surfaces during a walkthrough.',
  },
  {
    id: 'scope',
    title: 'Auto-Build the Scope',
    icon: LayoutGrid,
    description:
      'JANIBEAR converts the scan into structured cleaning zones and task lists.',
  },
  {
    id: 'price',
    title: 'Generate Pricing',
    icon: Calculator,
    description:
      'Labor models estimate staffing, cleaning time, and margin automatically.',
  },
  {
    id: 'proposal',
    title: 'Create the Proposal',
    icon: FileText,
    description:
      'Generate a professional proposal with scope, pricing, and contract terms.',
  },
  {
    id: 'win',
    title: 'Win the Contract',
    icon: CheckCircle2,
    description:
      'Clients review and sign proposals digitally in minutes.',
  },
  {
    id: 'execute',
    title: 'Execute & Verify',
    icon: ClipboardCheck,
    description:
      'Crew checklists, inspections, and photo proof ensure contracts are delivered perfectly.',
  },
] as const;

const container = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 * i },
  }),
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
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
      {/* Subtle background */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.header
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
            How it works
          </p>
          <h2
            id="conversion-workflow-heading"
            className="mt-4 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            From Walkthrough to Contract in Minutes
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400 md:text-xl">
            JANIBEAR transforms building walkthroughs into structured scopes, accurate pricing,
            and professional proposals — all before you leave the property.
          </p>
        </motion.header>

        {/* Workflow grid: 3x2 desktop, stacked mobile with connectors */}
        <motion.div
          className="mt-16 grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {WORKFLOW_STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.id}
                variants={item}
                className="group relative"
              >
                <div
                  className="relative flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:shadow-[0_0_40px_rgba(34,211,238,0.08)] md:p-8"
                  style={{
                    boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-400/20 transition-colors group-hover:ring-cyan-400/40">
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                  {/* Step number for flow */}
                  <span
                    className="absolute right-5 top-5 text-xs font-medium tabular-nums text-zinc-500"
                    aria-hidden
                  >
                    {index + 1}/6
                  </span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Connector line — desktop only, subtle */}
        <div
          className="absolute left-6 right-6 top-[calc(50%+4rem)] hidden h-px lg:block"
          aria-hidden
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.06) 80%, transparent)',
          }}
        />

        {/* CTA row */}
        <motion.div
          className="mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Button
            asChild
            size="lg"
            className="min-w-[200px] rounded-xl bg-cyan-500 font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] hover:bg-cyan-400 hover:shadow-[0_0_32px_rgba(34,211,238,0.3)]"
          >
            <Link href="/demo">See a 2-Minute Demo</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="min-w-[200px] rounded-xl border-cyan-400/40 bg-transparent font-semibold text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300"
          >
            <Link href="/demo">Try LiDAR Walkthrough</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
