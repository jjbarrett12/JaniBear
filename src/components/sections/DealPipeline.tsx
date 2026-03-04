'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useReducedMotion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion';
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
  {
    contractValueMonthly: '$0',
    frequency: '—',
    laborHoursPerVisit: '—',
    marginPercent: '—',
    proposalCreatedAt: '—',
    signedAtEstimated: '—',
    outputArtifacts: [],
  },
  {
    contractValueMonthly: '—',
    frequency: '—',
    laborHoursPerVisit: '—',
    marginPercent: '—',
    proposalCreatedAt: '—',
    signedAtEstimated: '—',
    outputArtifacts: ['Cleaning zones'],
  },
  {
    contractValueMonthly: '$8,000',
    frequency: '5×/wk',
    laborHoursPerVisit: '24 hrs',
    marginPercent: '32%',
    proposalCreatedAt: '—',
    signedAtEstimated: '—',
    outputArtifacts: ['Zones', 'Task list', 'Labor model'],
  },
  {
    contractValueMonthly: '$8,000',
    frequency: '5×/wk',
    laborHoursPerVisit: '24 hrs',
    marginPercent: '32%',
    proposalCreatedAt: '8 min ago',
    signedAtEstimated: '—',
    outputArtifacts: ['Zones', 'Tasks', 'Proposal PDF', 'Pricing breakdown'],
  },
  {
    contractValueMonthly: '$8,000',
    frequency: '5×/wk',
    laborHoursPerVisit: '24 hrs',
    marginPercent: '32%',
    proposalCreatedAt: '12 min ago',
    signedAtEstimated: 'Just now',
    outputArtifacts: ['Zones', 'Tasks', 'PDF', 'Contract terms', 'Signatures'],
  },
  {
    contractValueMonthly: '$8,000',
    frequency: '5×/wk',
    laborHoursPerVisit: '24 hrs',
    marginPercent: '32%',
    proposalCreatedAt: '15 min ago',
    signedAtEstimated: '3 min ago',
    outputArtifacts: ['Zones', 'Tasks', 'PDF', 'Contract', 'Checklists', 'First visit scheduled'],
  },
];

const CARD_WIDTH_DESKTOP = 152;

export function DealPipeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const displayStep = hoveredStep !== null ? hoveredStep : activeStep;
  const summary = DEAL_SUMMARY_BY_STEP[displayStep];

  const [travelStep, setTravelStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const interval = setInterval(() => {
      setTravelStep((prev) => (prev >= 5 ? 0 : prev + 1));
    }, 1200);
    return () => clearInterval(interval);
  }, [reduceMotion]);

  const connectorStep = hoveredStep !== null ? displayStep : travelStep;

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const stepProgress = useTransform(
    scrollYProgress,
    [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1],
    [0, 1, 2, 3, 4, 5, 5]
  );

  useMotionValueEvent(stepProgress, 'change', (latest) => {
    const step = Math.min(5, Math.floor(latest + 0.01));
    setActiveStep(step);
  });

  const duration = reduceMotion ? 0 : 0.35;
  const transition = { duration, ease: [0.25, 0.46, 0.45, 0.94] as const };

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
          <p className="mt-3 text-sm md:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Walkthrough → Scope → Labor & margin → Proposal → Signed → Execute. Same day.
          </p>
        </motion.header>

        {/* Desktop: two columns — pipeline left (fixed-width cards + strong line), sticky Deal Summary right */}
        <div className="hidden md:grid md:grid-cols-[1fr,340px] md:gap-10 lg:gap-14 items-start">
          <PipelineStrip
            activeStep={displayStep}
            connectorStep={connectorStep}
            isInView={isInView}
            reduceMotion={!!reduceMotion}
            transition={transition}
            onStepHover={setHoveredStep}
            onStepLeave={() => setHoveredStep(null)}
          />
          <motion.div
            className="sticky top-28"
            initial={{ opacity: 0, x: 12 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...transition, delay: 0.1 }}
          >
            <DealSummaryCard
              summary={summary}
              activeStep={displayStep}
              reduceMotion={!!reduceMotion}
            />
          </motion.div>
        </div>

        {/* Mobile: vertical stack — steps with connectors, scroll-driven activeStep */}
        <div className="md:hidden space-y-0">
          <div className="flex flex-col gap-0" role="tablist" aria-label="Deal pipeline steps">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-stretch"
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => setHoveredStep(index)}
                onFocus={() => setHoveredStep(index)}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHoveredStep(null); }}
              >
                <PipelineStepCard
                  step={step}
                  index={index}
                  isActive={displayStep === index}
                  isHighlighted={displayStep >= index}
                  isInView={isInView}
                  reduceMotion={!!reduceMotion}
                  transition={transition}
                  showConnector={index < STEPS.length - 1}
                  connectorProgress={displayStep > index ? 1 : displayStep === index ? 0.5 : 0}
                  variant="mobile"
                />
                {index < STEPS.length - 1 && (
                  <div className="flex justify-center py-0">
                    <div
                      className="w-0.5 min-h-[20px] relative overflow-hidden rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        boxShadow: '0 0 12px rgba(99, 102, 241, 0.12)',
                      }}
                    >
                      <motion.div
                        className="absolute inset-x-0 bottom-0 top-0 rounded-full origin-top"
                        initial={false}
                        animate={{
                          scaleY: activeStep > index ? 1 : activeStep === index ? 0.5 : 0,
                        }}
                        transition={transition}
                        style={{
                          background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.9), rgba(129, 140, 248, 0.85))',
                          boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={displayStep}
              className="mt-8"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={transition}
            >
              <DealSummaryCard
                summary={summary}
                activeStep={displayStep}
                reduceMotion={!!reduceMotion}
              />
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
          <Button
            asChild
            size="lg"
            className="landing-cta min-w-[200px] rounded-xl font-semibold text-white"
          >
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

      {demoModalOpen && <DemoModal onClose={() => setDemoModalOpen(false)} />}
    </section>
  );
}

function PipelineStrip({
  activeStep,
  connectorStep,
  isInView,
  reduceMotion,
  transition,
  onStepHover,
  onStepLeave,
}: {
  activeStep: number;
  connectorStep: number;
  isInView: boolean;
  reduceMotion: boolean;
  transition: { duration: number; ease: readonly number[] };
  onStepHover: (index: number) => void;
  onStepLeave: () => void;
}) {
  return (
    <div
      className="flex items-center gap-0 w-full"
      onMouseLeave={onStepLeave}
    >
      {STEPS.flatMap((step, index) => [
        <div
          key={`card-${step.id}`}
          className="shrink-0 flex justify-center"
          style={{ width: CARD_WIDTH_DESKTOP }}
          onMouseEnter={() => onStepHover(index)}
        >
          <PipelineStepCard
            step={step}
            index={index}
            isActive={activeStep === index}
            isHighlighted={activeStep >= index}
            isInView={isInView}
            reduceMotion={reduceMotion}
            transition={transition}
            showConnector={index < STEPS.length - 1}
            connectorProgress={activeStep > index ? 1 : activeStep === index ? 0.5 : 0}
            variant="desktop"
            onSelect={() => onStepHover(index)}
            onDeselect={onStepLeave}
          />
        </div>,
        ...(index < STEPS.length - 1
          ? [
              <div
                key={`conn-${step.id}`}
                className="flex-1 min-w-[20px] max-w-[36px] lg:min-w-[28px] flex items-center justify-center shrink-0 px-0.5"
              >
                <div
                  className="w-full h-1 rounded-full relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    boxShadow: '0 0 16px rgba(99, 102, 241, 0.12), inset 0 0 8px rgba(99, 102, 241, 0.05)',
                  }}
                  aria-hidden
                >
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full origin-left"
                    initial={false}
                    animate={{
                      scaleX: connectorStep > index ? 1 : connectorStep === index ? 0.5 : 0,
                    }}
                    transition={transition}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.95), rgba(129, 140, 248, 0.9))',
                      boxShadow: '0 0 14px rgba(99, 102, 241, 0.5), 0 0 28px rgba(99, 102, 241, 0.2)',
                    }}
                  />
                  {!reduceMotion && (
                    <div
                      className="absolute inset-0 rounded-full opacity-50 pipeline-connector-shimmer pointer-events-none"
                      aria-hidden
                    />
                  )}
                </div>
              </div>,
            ]
          : []),
      ])}
    </div>
  );
}

function PipelineStepCard({
  step,
  index,
  isActive,
  isHighlighted,
  isInView,
  reduceMotion,
  transition,
  showConnector,
  connectorProgress,
  variant,
  onSelect,
  onDeselect,
}: {
  step: (typeof STEPS)[number];
  index: number;
  isActive: boolean;
  isHighlighted: boolean;
  isInView: boolean;
  reduceMotion: boolean;
  transition: { duration: number; ease: readonly number[] };
  showConnector: boolean;
  connectorProgress: number;
  variant: 'desktop' | 'mobile';
  onSelect?: () => void;
  onDeselect?: () => void;
}) {
  const Icon = step.icon;
  const isDim = !isHighlighted;

  return (
    <motion.div
      role="tab"
      aria-selected={isActive}
      aria-label={`${step.label}: ${step.metric}, ${step.time}`}
      tabIndex={0}
      onClick={onSelect}
      onFocus={onSelect}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onDeselect?.();
      }}
      className={`
        cursor-pointer
        snap-center shrink-0 flex flex-col items-center text-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-5 min-h-[152px] md:min-h-[160px]
        shadow-[0_20px_60px_rgba(0,0,0,0.2)]
        focus-within:ring-2 focus-within:ring-indigo-400 focus-within:ring-offset-2 focus-within:ring-offset-[#0B0B0F]
        transition-all duration-200
        ${variant === 'desktop' ? 'w-[152px] min-w-[152px]' : 'w-full min-w-0'}
        ${isDim ? 'opacity-60' : ''}
        ${isActive
          ? 'border-indigo-400/60 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_0_32px_rgba(99,102,241,0.35),0_0_48px_rgba(99,102,241,0.15),0_20px_60px_rgba(0,0,0,0.25)]'
          : isHighlighted
            ? 'border-white/15 hover:border-indigo-400/25 hover:-translate-y-1'
            : 'border-white/10'}
      `}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={
        isInView
          ? {
              opacity: 1,
              y: 0,
              scale: isActive ? 1.02 : 1,
            }
          : {}
      }
      transition={{ ...transition, delay: index * 0.04 }}
    >
      <div
        className={`flex items-center justify-center w-11 h-11 rounded-xl mb-2.5 transition-colors ${
          isActive
            ? 'bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
            : 'bg-white/5 border border-white/5 text-zinc-400'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <span
        className={`text-xs font-semibold uppercase tracking-wider ${
          isActive ? 'text-indigo-300' : 'text-zinc-500'
        }`}
      >
        {step.label}
      </span>
      {step.id === 'labor' && isHighlighted ? (
        <CountUpMetric
          value={6200}
          prefix="$"
          suffix=""
          active={isHighlighted}
          reduceMotion={reduceMotion}
          className="mt-1 font-heading text-lg font-bold text-white tabular-nums"
        />
      ) : (
        <motion.span
          className="mt-1 font-heading text-lg font-bold text-white tabular-nums"
          key={`${step.id}-metric`}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: transition.duration, ease: transition.ease }}
        >
          {step.metric}
        </motion.span>
      )}
      <span className="text-xs text-zinc-500 mt-0.5">{step.time}</span>
    </motion.div>
  );
}

function CountUpMetric({
  value,
  prefix = '',
  suffix = '',
  active,
  reduceMotion,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
  reduceMotion: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!active || reduceMotion) {
      setDisplay(value);
      return;
    }
    let start = 0;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value, active, reduceMotion]);

  return (
    <span className={className}>
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function DealSummaryCard({
  summary,
  activeStep,
  reduceMotion,
}: {
  summary: DealSummary;
  activeStep: number;
  reduceMotion: boolean;
}) {
  const transition = { duration: reduceMotion ? 0 : 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const };
  const showContractValueCountUp =
    summary.contractValueMonthly === '$8,000' && (activeStep === 2 || activeStep >= 3);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-indigo-400/90 mb-4">
        Deal Summary
      </h3>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Contract value (mo)</dt>
          <dd className="font-medium text-white tabular-nums">
            {showContractValueCountUp ? (
              <CountUpMetric
                value={8000}
                prefix="$"
                suffix=" / month"
                active={true}
                reduceMotion={reduceMotion}
                className="tabular-nums"
              />
            ) : (
              summary.contractValueMonthly
            )}
          </dd>
        </div>
        <SummaryRow label="Frequency" value={summary.frequency} transition={transition} />
        <SummaryRow label="Labor hours / visit" value={summary.laborHoursPerVisit} transition={transition} />
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">Margin</dt>
          <dd className="font-medium text-white tabular-nums">
            {summary.marginPercent === '32%' && activeStep >= 2 ? (
              <CountUpMetric
                value={32}
                prefix=""
                suffix="%"
                active={true}
                reduceMotion={reduceMotion}
                className="tabular-nums"
              />
            ) : (
              summary.marginPercent
            )}
          </dd>
        </div>
        <SummaryRow label="Proposal created" value={summary.proposalCreatedAt} transition={transition} />
        <SummaryRow label="Signed (est.)" value={summary.signedAtEstimated} transition={transition} />
      </dl>
      {summary.outputArtifacts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Output artifacts
          </p>
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
  transition: { duration: number; ease: readonly number[] };
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500 text-sm">{label}</dt>
      <motion.dd
        className="font-medium text-white tabular-nums text-sm"
        key={value}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: transition.duration * 1.2, ease: transition.ease }}
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
            <p className="text-sm text-zinc-500 mt-2">
              Video placeholder — link to your demo video or embed below.
            </p>
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
