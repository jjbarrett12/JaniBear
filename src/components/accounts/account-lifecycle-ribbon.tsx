'use client';

import { cn } from '@/lib/utils';

const STAGES = [
  { key: 'lead', label: 'Lead' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'walkthrough', label: 'Walkthrough' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'won', label: 'Won' },
  { key: 'launch_packet', label: 'Launch Packet' },
  { key: 'active', label: 'Active' },
] as const;

type StageKey = (typeof STAGES)[number]['key'];

export type AccountLifecycleRibbonProps = {
  accountStatus: 'active' | 'inactive';
  launchPacketStatus?: string | null;
  nextAction?: 'sales' | 'ops' | null;
  className?: string;
};

export function AccountLifecycleRibbon({
  accountStatus,
  launchPacketStatus,
  nextAction,
  className,
}: AccountLifecycleRibbonProps) {
  const currentStage: StageKey =
    accountStatus === 'active'
      ? 'active'
      : launchPacketStatus === 'accepted'
        ? 'active'
        : launchPacketStatus === 'ready' || launchPacketStatus === 'sent_to_ops'
          ? 'launch_packet'
          : launchPacketStatus === 'draft' || launchPacketStatus === 'review'
            ? 'launch_packet'
            : 'won';

  return (
    <div className={cn('rounded-lg border bg-muted/40 p-3', className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Account lifecycle
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {STAGES.map((stage, i) => {
          const isActive = stage.key === currentStage;
          const isPast = STAGES.findIndex((s) => s.key === currentStage) > i;
          return (
            <span key={stage.key} className="flex items-center gap-1">
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  isActive && 'bg-primary text-primary-foreground',
                  isPast && !isActive && 'bg-muted text-muted-foreground',
                  !isActive && !isPast && 'text-muted-foreground'
                )}
              >
                {stage.label}
              </span>
              {i < STAGES.length - 1 && (
                <span className="text-muted-foreground/50 text-xs">→</span>
              )}
            </span>
          );
        })}
      </div>
      {nextAction === 'sales' && (
        <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
          Next: Complete Scope / Send to Ops
        </p>
      )}
      {nextAction === 'ops' && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-2">
          Next: Review packet / Accept launch
        </p>
      )}
    </div>
  );
}
