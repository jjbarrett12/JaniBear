'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { DashboardKpi, DashboardPanelId } from '../mockDashboardData';

interface KpiCardProps {
  kpi: DashboardKpi;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (panelId: DashboardPanelId) => void;
  /** Slightly larger "hero" card (e.g. revenue, risk) */
  hero?: boolean;
  className?: string;
}

export function KpiCard({ kpi, icon: Icon, onClick, hero, className }: KpiCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(kpi.id);
    }
  };

  return (
    <button
      type="button"
      onClick={() => onClick(kpi.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        'group relative flex flex-col rounded-xl border border-border bg-card p-4 text-left transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'active:translate-y-0',
        hero && 'p-5',
        className
      )}
      aria-label={`${kpi.title}: ${kpi.value}. Click for details`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wider">{kpi.title}</span>
        </div>
        {kpi.delta != null && (
          <span
            className={cn(
              'shrink-0 rounded px-1.5 py-0.5 text-xs font-medium tabular-nums',
              kpi.delta.value > 0 && kpi.id === 'health_below_threshold' ? 'bg-destructive/15 text-destructive' : 'bg-muted text-muted-foreground'
            )}
          >
            {kpi.delta.value > 0 ? `+${kpi.delta.value}` : kpi.delta.value}
            {kpi.delta.label ? ` ${kpi.delta.label}` : ''}
          </span>
        )}
      </div>
      <p className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums md:text-3xl">
        {kpi.value}
      </p>
      {kpi.sparkline && kpi.sparkline.length > 0 && (
        <div className="mt-3 flex items-end gap-0.5 h-8" aria-hidden>
          {kpi.sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 min-w-[2px] rounded-sm bg-primary/40 group-hover:bg-primary/60 transition-colors"
              style={{ height: `${Math.max(4, v * 100)}%` }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
