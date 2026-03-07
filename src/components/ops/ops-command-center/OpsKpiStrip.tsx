'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { OpsCommandCenterKPIs } from '@/lib/ops/ops-command-center-types';
import {
  Building2,
  Users,
  AlertTriangle,
  Rocket,
  AlertCircle,
  DollarSign,
} from 'lucide-react';

const KPI_CONFIG: Array<{
  key: keyof OpsCommandCenterKPIs;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: number) => string;
  accent?: string;
}> = [
  { key: 'activeAccounts', label: 'Active Accounts', icon: Building2, format: (v) => String(v) },
  { key: 'crewsScheduledToday', label: 'Crews Scheduled Today', icon: Users, format: (v) => String(v) },
  { key: 'accountsAtRisk', label: 'Accounts At Risk', icon: AlertTriangle, format: (v) => String(v), accent: v => v > 0 ? 'border-amber-500/30' : '' },
  { key: 'openDeployments', label: 'Open Deployments', icon: Rocket, format: (v) => String(v) },
  { key: 'slaBreaches', label: 'SLA Breaches', icon: AlertCircle, format: (v) => String(v), accent: v => v > 0 ? 'border-rose-500/30' : '' },
  { key: 'revenueScheduledToday', label: 'Revenue Scheduled Today', icon: DollarSign, format: (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}` },
];

export interface OpsKpiStripProps {
  kpis: OpsCommandCenterKPIs;
  className?: string;
}

export function OpsKpiStrip({ kpis, className }: OpsKpiStripProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6',
        className
      )}
      role="region"
      aria-label="Key performance indicators"
    >
      {KPI_CONFIG.map(({ key, label, icon: Icon, format, accent }) => {
        const value = kpis[key];
        const accentClass = typeof accent === 'function' ? accent(value) : accent;
        return (
          <div
            key={key}
            className={cn(
              'rounded-xl border border-border bg-card p-4 flex flex-col min-h-[100px]',
              accentClass
            )}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium uppercase tracking-wider truncate">{label}</span>
            </div>
            <p className="mt-2 font-semibold text-xl tabular-nums tracking-tight text-foreground">
              {format(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
