'use client';

import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { MissedTasksAttentionCard } from './MissedTasksAttentionCard';
import type { AttentionItem, AttentionSeverity, MissedTasksKpi } from '../types';

const SEVERITY_STYLES: Record<
  AttentionSeverity,
  { badge: string; border: string; icon: string }
> = {
  critical: {
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    border: 'border-rose-500/30',
    icon: 'text-rose-400',
  },
  high: {
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    border: 'border-orange-500/30',
    icon: 'text-orange-400',
  },
  medium: {
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    border: 'border-amber-500/30',
    icon: 'text-amber-400',
  },
  low: {
    badge: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40',
    border: 'border-zinc-500/30',
    icon: 'text-zinc-400',
  },
};

function AttentionCard({ item }: { item: AttentionItem }) {
  const style = SEVERITY_STYLES[item.severity];
  const ctaText = item.ctaLabel ?? 'View';
  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between gap-4 p-4 rounded-xl bg-[#0F172A]/60 border ${style.border} hover:bg-[#0F172A]/80 hover:border-white/20 transition-colors`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <AlertTriangle className={`h-5 w-5 shrink-0 ${style.icon}`} aria-hidden />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-white">{item.label}</span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${style.badge}`}
            >
              {item.count}
            </span>
          </div>
          {item.description ? (
            <p className="text-sm text-white/60 mt-0.5 truncate">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>
      <span className="text-xs font-medium text-white/70 shrink-0">{ctaText}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
    </Link>
  );
}

interface AttentionPanelProps {
  items: AttentionItem[];
  /** When provided, renders a dedicated Missed Tasks card with unreviewed/disputed context and two CTAs. */
  missedTasksKpi?: MissedTasksKpi | null;
  rightAction?: React.ReactNode;
}

export function AttentionPanel({ items, missedTasksKpi, rightAction }: AttentionPanelProps) {
  return (
    <div className="rounded-2xl bg-[#0B1220]/70 backdrop-blur border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] p-6">
      <SectionHeader title="Attention Required" rightAction={rightAction} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {missedTasksKpi ? (
          <MissedTasksAttentionCard kpi={missedTasksKpi} />
        ) : null}
        {items.map((item) => (
          <AttentionCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
