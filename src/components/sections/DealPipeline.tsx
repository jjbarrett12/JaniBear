'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Scan,
  LayoutGrid,
  Calculator,
  FileText,
  PenLine,
  ClipboardCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  { id: 'walkthrough', label: 'Walkthrough', icon: Scan, metric: '$0', time: '0 min' },
  { id: 'scope', label: 'Scope', icon: LayoutGrid, metric: '12 zones', time: '2 min' },
  { id: 'labor', label: 'Labor + Margin', icon: Calculator, metric: '$6,200', time: '5 min' },
  { id: 'proposal', label: 'Proposal', icon: FileText, metric: 'PDF ready', time: '8 min' },
  { id: 'signed', label: 'Signed', icon: PenLine, metric: 'Contract', time: '12 min' },
  { id: 'execute', label: 'Execute', icon: ClipboardCheck, metric: 'Live', time: '15 min' },
] as const;

type DealSummary = {
  contractValueMonthly: string;
  frequency: string;
  laborHoursPerVisit: string;
  marginPercent: string;
  proposalCreatedAt: string;
  signedAtEstimated: string;
  outputArtifacts: string[];
};

const DEAL_SUMMARY_BY_STEP: DealSummary[] = [
  { contractValueMonthly: '$0', frequency: '—', laborHoursPerVisit: '—', marginPercent: '—', proposalCreatedAt: '—', signedAtEstimated: '—', outputArtifacts: [] },
  { contractValueMonthly: '—', frequency: '—', laborHoursPerVisit: '—', marginPercent: '—', proposalCreatedAt: '—', signedAtEstimated: '—', outputArtifacts: ['Cleaning zones'] },
  { contractValueMonthly: '$8,000', frequency: '5×/wk', laborHoursPerVisit: '24 hrs', marginPercent: '32%', proposalCreatedAt: '—', signedAtEstimated: '—', outputArtifacts: ['Zones', 'Task list', 'Labor model'] },
  { contractValueMonthly: '$8,000', frequency: '5×/wk', laborHoursPerVisit: '24 hrs', marginPercent: '32%', proposalCreatedAt: '8 min ago', signedAtEstimated: '—', outputArtifacts: ['Zones', 'Tasks', 'Proposal PDF', 'Pricing breakdown'] },
  { contractValueMonthly: '$8,000', frequency: '5×/wk', laborHoursPerVisit: '24 hrs', marginPercent: '32%', proposalCreatedAt: '12 min ago', signedAtEstimated: 'Just now', outputArtifacts: ['Zones', 'Tasks', 'PDF', 'Contract terms', 'Signatures'] },
  { contractValueMonthly: '$8,000', frequency: '5×/wk', laborHoursPerVisit: '24 hrs', marginPercent: '32%', proposalCreatedAt: '15 min ago', signedAtEstimated: '3 min ago', outputArtifacts: ['Zones', 'Tasks', 'PDF', 'Contract', 'Checklists', 'First visit scheduled'] },
];

const DEFAULT_ACTIVE_STEP = 2; // Labor + Margin ($$$)

export function DealPipeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(DEFAULT_ACTIVE_STEP);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const summary = DEAL_SUMMARY_BY_STEP[activeStep];

  const duration = reduceMotion ? 0 : 0.35;
  const transition = { duration, ease: [0.25, 0.46, 0.45, 0.94] };

  return (
    <section
      ref={sectionRef}
      id="deal-pipeline"
      className="relative overflow-hidden py-24 md:py-32"
      aria-labelledby="deal-pipeline-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
        <div className="absolute top-1/2 right-0 w-[50%] max-w-2xl h-[70%] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <motion.header
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={transition}
        >
          <h2
            id="deal-pipeline-heading"
            className="font-heading text-3xl md:text-4xl font-semibold tracking-tight text-white"
          >
            Deal Pipeline ($0 → $8,000 Contract)
          </h2>
          <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
            Walkthrough → Scope → Labor & margin → Proposal → Signed → Execute. Same day.
          </p>
        </motion.header>

        {/* Desktop: two columns — pipeline left, sticky Deal Summary right */}
        <div className="hidden md:grid md:grid-cols-[1fr,340px] md:gap-10 lg:gap-14 items-start">
          <PipelineStrip
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            isInView={isInView}
            reduceMotion={!!reduceMotion}
            transition={transition}
          />
          <motion.div
            className="sticky top-28"
            initial={{ opacity: 0, x: 12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...transition, delay: 0.1 }}
          >
            <DealSummaryCard summary={summary} reduceMotion={!!reduceMotion} />
          </motion.div>
        </div>

        {/* Mobile: swipeable stepper + pinned Deal Summary */}
        <div className="md:hidden space-y-6">
          <div
            className="overflow-x-auto snap-x snap-mandatory hide-scrollbar -mx-4 px-4 pb-2"
            role="tablist"
            aria-label="Deal pipeline steps"
          >
            <div className="flex gap-4 min-w-max">
              {STEPS.map((step, index) => (
                <PipelineStepCard
                  key={step.id}
                  step={step}
                  index={index}
                  isActive={activeStep === index}
                  isHighlighted={activeStep >= index}
                  onClick={() => setActiveStep(index)}
                  onFocus={() => setActiveStep(index)}
                  isInView={isInView}
                  reduceMotion={!!reduceMotion}
                  transition={transition}
                  showConnector={index < STEPS.length - 1}
                  connectorProgress={activeStep > index ? 1 : activeStep === index ? 0.5 : 0}
                />
              ))}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={transition}
            >
              <DealSummaryCard summary={summary} reduceMotion={!!reduceMotion} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA row */}
        <motion.div
          className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...transition, delay: 0.2 }}
        >
          <Button asChild size="lg" className="landing-cta min-w-[200px] rounded-xl font-semibold text-white">
            <Link href="/signup?intent=scan">Scan Your First Building</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="min-w-[200px] rounded-xl border-indigo-400/40 bg-transparent font-semibold text-indigo-400 hover:bg-indigo-400/10 hover:text-indigo-300"
            onClick={() => setDemoModalOpen(true)}
          >
            Watch the 2-Min Demo
          </Button>
        </motion.div>
      </div>

      {/* Video / Demo modal */}
      {demoModalOpen && (
        <DemoModal onClose={() => setDemoModalOpen(false)} />
      )}
    </section>
  );
}

function PipelineStrip({
  activeStep,
  setActiveStep,
  isInView,
  reduceMotion,
  transition,
}: {
  activeStep: number;
  setActiveStep: (n: number) => void;
  isInView: boolean;
  reduceMotion: boolean;
  transition: { duration: number; ease: number[] };
}) {
  return (
    <div className="flex items-stretch gap-0 w-full">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <PipelineStepCard
            step={step}
            index={index}
            isActive={activeStep === index}
            isHighlighted={activeStep >= index}
            onClick={() => setActiveStep(index)}
            onFocus={() => setActiveStep(index)}
            isInView={isInView}
            reduceMotion={reduceMotion}
            transition={transition}
            showConnector={index < STEPS.length - 1}
            connectorProgress={activeStep > index ? 1 : activeStep === index ? 0.5 : 0}
            />
          </div>
          {index < STEPS.length - 1 && (
            <div className="hidden md:block w-6 shrink-0 h-px self-center relative overflow-hidden">
              <div
                className="absolute inset-0 bg-white/20 rounded-full"
                aria-hidden
              />
              <motion.div
                className="absolute inset-y-0 left-0 bg-indigo-400/60 rounded-full origin-left"
                initial={false}
                animate={{ scaleX: activeStep > index ? 1 : activeStep === index ? 0.5 : 0 }}
                transition={transition}
                style={{ width: '100%' }}
                aria-hidden
              />
              {!reduceMotion && (
                <div className="absolute inset-0 rounded-full opacity-50 pipeline-connector-shimmer" aria-hidden />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PipelineStepCard({
  step,
  index,
  isActive,
  isHighlighted,
  onClick,
  onFocus,
  isInView,
  reduceMotion,
  transition,
  showConnector,
  connectorProgress,
}: {
  step: (typeof STEPS)[number];
  index: number;
  isActive: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  onFocus: () => void;
  isInView: boolean;
  reduceMotion: boolean;
  transition: { duration: number; ease: number[] };
  showConnector: boolean;
  connectorProgress: number;
}) {
  const Icon = step.icon;
  return (
    <motion.button
      type="button"
      className={`snap-center shrink-0 flex flex-col items-center text-left rounded-xl border bg-white/5 backdrop-blur-md px-4 py-5 min-w-[120px] md:min-w-0 md:flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0F] transition-colors ${
        isActive
          ? 'border-indigo-400/60 shadow-[0_0_24px_rgba(99,102,241,0.25)] scale-[1.02]'
          : 'border-white/10 hover:border-indigo-400/30'
      }`}
      onClick={onClick}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...transition, delay: index * 0.06 }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
      role="tab"
      aria-selected={isActive}
      aria-label={`${step.label}: ${step.metric}, ${step.time}`}
      tabIndex={0}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 text-indigo-400 mb-2">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{step.label}</span>
      <motion.span
        className="mt-1 font-heading text-lg font-bold text-white tabular-nums"
        key={`${index}-metric`}
        initial={false}
        animate={{ opacity: 1 }}
        transition={transition}
      >
        {step.metric}
      </motion.span>
      <span className="text-xs text-zinc-500 mt-0.5">{step.time}</span>
    </motion.button>
  );
}

function DealSummaryCard({ summary, reduceMotion }: { summary: DealSummary; reduceMotion: boolean }) {
  const transition = { duration: reduceMotion ? 0 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] };
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-4">
        Deal Summary
      </h3>
      <dl className="space-y-3 text-sm">
        <SummaryRow label="Contract value (mo)" value={summary.contractValueMonthly} transition={transition} />
        <SummaryRow label="Frequency" value={summary.frequency} transition={transition} />
        <SummaryRow label="Labor hours / visit" value={summary.laborHoursPerVisit} transition={transition} />
        <SummaryRow label="Margin" value={summary.marginPercent} transition={transition} />
        <SummaryRow label="Proposal created" value={summary.proposalCreatedAt} transition={transition} />
        <SummaryRow label="Signed (est.)" value={summary.signedAtEstimated} transition={transition} />
      </dl>
      {summary.outputArtifacts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Output artifacts</p>
          <ul className="flex flex-wrap gap-2" role="list">
            {summary.outputArtifacts.map((item) => (
              <motion.li
                key={item}
                initial={reduceMotion ? false : { opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={transition}
                className="rounded-md bg-indigo-500/15 px-2 py-1 text-xs text-indigo-300 border border-indigo-400/20"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  transition,
}: {
  label: string;
  value: string;
  transition: { duration: number; ease: number[] };
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <motion.dd
        className="font-medium text-white tabular-nums"
        key={value}
        initial={false}
        animate={{ opacity: 1 }}
        transition={transition}
      >
        {value}
      </motion.dd>
    </div>
  );
}

function DemoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Watch 2-Minute Demo"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl max-w-2xl w-full overflow-hidden">
        <div className="aspect-video bg-zinc-800 flex items-center justify-center">
          <div className="text-center p-8">
            <p className="text-zinc-400 font-medium">2-Minute Demo</p>
            <p className="text-sm text-zinc-500 mt-2">Video placeholder — link to your demo video or embed below.</p>
            <Link
              href="/demo"
              className="inline-block mt-4 px-6 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
            >
              Go to Demo →
            </Link>
          </div>
        </div>
        <div className="p-4 border-t border-white/10 flex justify-end">
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
