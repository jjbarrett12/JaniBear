'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { DashboardPanelId } from '../mockDashboardData';
import type { DashboardMockData } from '../mockDashboardData';
import { HealthPanel } from './panels/HealthPanel';
import { SLAPanel } from './panels/SLAPanel';
import { InspectionsPanel } from './panels/InspectionsPanel';
import { CrewPanel } from './panels/CrewPanel';
import { BuildingsPanel } from './panels/BuildingsPanel';
import { RevenuePanel } from './panels/RevenuePanel';
import {
  Building2,
  Users,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

const PANEL_META: Record<
  DashboardPanelId,
  { title: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  buildings_today: {
    title: 'Buildings scheduled today',
    description: 'Sites and crews for today',
    icon: Building2,
  },
  crew_today: {
    title: 'Crew status',
    description: 'Active crews and gaps',
    icon: Users,
  },
  inspections_today: {
    title: 'Inspections due today',
    description: 'Due and overdue inspections',
    icon: ClipboardCheck,
  },
  health_below_threshold: {
    title: 'Accounts below health',
    description: 'At-risk accounts and revenue',
    icon: Activity,
  },
  sla_breaches: {
    title: 'SLA breaches & overdue',
    description: 'Tasks needing attention',
    icon: AlertTriangle,
  },
  revenue_today: {
    title: 'Revenue scheduled today',
    description: 'Projected recurring revenue',
    icon: DollarSign,
  },
};

export function DashboardDrawer({
  activePanel,
  onClose,
  data,
}: {
  activePanel: DashboardPanelId | null;
  onClose: () => void;
  data: DashboardMockData | null;
}) {
  const open = activePanel != null;
  const meta = activePanel ? PANEL_META[activePanel] : null;
  const Icon = meta?.icon;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full max-w-lg flex-col p-0"
        onPointerDownOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        {meta && (
          <>
            <SheetHeader className="sr-only">
              <SheetTitle>{meta.title}</SheetTitle>
              <SheetDescription>{meta.description}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col h-full overflow-hidden">
              <div className="shrink-0 flex items-center gap-3 px-4 pt-5 pb-2 sm:px-6 sm:pt-6">
                {Icon && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">{meta.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{meta.description}</p>
                </div>
              </div>
              {data && activePanel && (
                <div className="flex flex-1 flex-col min-h-0">
                  {activePanel === 'health_below_threshold' && (
                    <HealthPanel
                      rows={data.healthAccounts}
                      summaryValue={data.summaryMetric.health_below_threshold.value}
                      delta={data.summaryMetric.health_below_threshold.delta}
                      onClose={onClose}
                    />
                  )}
                  {activePanel === 'sla_breaches' && (
                    <SLAPanel
                      rows={data.slaBreaches}
                      summaryValue={data.summaryMetric.sla_breaches.value}
                      delta={data.summaryMetric.sla_breaches.delta}
                      onClose={onClose}
                    />
                  )}
                  {activePanel === 'inspections_today' && (
                    <InspectionsPanel
                      rows={data.inspections}
                      summaryValue={data.summaryMetric.inspections_today.value}
                      delta={data.summaryMetric.inspections_today.delta}
                      onClose={onClose}
                    />
                  )}
                  {activePanel === 'crew_today' && (
                    <CrewPanel
                      rows={data.crewGaps}
                      summaryValue={data.summaryMetric.crew_today.value}
                      delta={data.summaryMetric.crew_today.delta}
                      onClose={onClose}
                    />
                  )}
                  {activePanel === 'buildings_today' && (
                    <BuildingsPanel
                      rows={data.buildingsToday}
                      summaryValue={data.summaryMetric.buildings_today.value}
                      delta={data.summaryMetric.buildings_today.delta}
                      onClose={onClose}
                    />
                  )}
                  {activePanel === 'revenue_today' && (
                    <RevenuePanel
                      rows={data.revenueToday}
                      summaryValue={data.summaryMetric.revenue_today.value}
                      delta={data.summaryMetric.revenue_today.delta}
                      onClose={onClose}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
