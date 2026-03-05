'use client';

import Link from 'next/link';
import { FileSearch, FileText, TrendingUp, FileSignature } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import type { SalesCommandMetrics } from '../types';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const METRICS: Array<{
  key: keyof SalesCommandMetrics;
  label: string;
  icon: typeof FileSearch;
  format: (v: number) => string;
  href: string;
}> = [
  {
    key: 'walkthroughsScheduled',
    label: 'Walkthroughs scheduled',
    icon: FileSearch,
    format: (v) => `${v}`,
    href: '/app/sales/walkthroughs',
  },
  {
    key: 'proposalsSent',
    label: 'Proposals sent',
    icon: FileText,
    format: (v) => `${v}`,
    href: '/app/sales/proposals',
  },
  {
    key: 'pipelineValue',
    label: 'Pipeline value',
    icon: TrendingUp,
    format: formatCurrency,
    href: '/app/sales/pipeline',
  },
  {
    key: 'contractsWonThisMonth',
    label: 'Contracts won this month',
    icon: FileSignature,
    format: (v) => `${v}`,
    href: '/app/sales/pipeline',
  },
];

interface SalesCommandCardProps {
  metrics: SalesCommandMetrics;
  rightAction?: React.ReactNode;
}

export function SalesCommandCard({ metrics, rightAction }: SalesCommandCardProps) {
  return (
    <div className="rounded-2xl bg-[#0B1220]/70 backdrop-blur border border-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] p-6">
      <SectionHeader title="Sales Command" rightAction={rightAction} />
      <div className="grid grid-cols-2 gap-4">
        {METRICS.map(({ key, label, icon: Icon, format, href }) => (
          <Link
            key={key}
            href={href}
            className="flex items-center gap-3 p-3 rounded-xl bg-[#0F172A]/60 border border-white/10 hover:border-white/20 hover:bg-[#0F172A]/80 transition-colors"
          >
            <Icon className="h-5 w-5 shrink-0 text-amber-400/90" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs text-white/60">{label}</p>
              <p className="text-lg font-bold tabular-nums text-white">
                {format(metrics[key] as number)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
