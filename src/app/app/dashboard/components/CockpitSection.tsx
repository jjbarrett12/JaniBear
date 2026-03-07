'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  DashboardShell,
  DashboardHeader,
  KpiStrip,
  AlertRail,
  CommandPanel,
  SideRailPanel,
} from '@/components/cockpit';
import { commandCenterDataToCockpitKpis } from '@/lib/cockpit-data';
import { useDashboardData } from '@/contexts/dashboard-data-context';
import { getMockDashboardData, type DashboardPanelId } from '../mockDashboardData';
import { DashboardDrawer } from './DashboardDrawer';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { DASHBOARD_COPY } from '@/lib/dashboard-copy';

const KPI_ID_TO_PANEL_ID: Record<string, DashboardPanelId> = {
  buildings_today: 'buildings_today',
  crew_today: 'crew_today',
  inspections_today: 'inspections_today',
  health_below: 'health_below_threshold',
  sla_breaches: 'sla_breaches',
  revenue_today: 'revenue_today',
};

export function CockpitSection({ orgId }: { orgId: string }) {
  const data = useDashboardData();
  const [activePanel, setActivePanel] = useState<DashboardPanelId | null>(null);
  const mockData = useMemo(() => getMockDashboardData(orgId), [orgId]);

  const kpis = useMemo(() => commandCenterDataToCockpitKpis(data), [data]);

  const handleKpiClick = (id: string) => {
    const panelId = KPI_ID_TO_PANEL_ID[id];
    if (panelId) setActivePanel(panelId);
  };

  const handleAlertRailClick = () => {
    setActivePanel('health_below_threshold');
  };

  return (
    <>
      <DashboardShell>
        <DashboardHeader
          userName={data.userName}
          subtitle={DASHBOARD_COPY.headerSubtitle}
          dataFetchedAt={data.fetchedAt ?? null}
        />
        <KpiStrip kpis={kpis} onKpiClick={handleKpiClick} />
        <AlertRail
          count={kpis.attentionCount}
          onClick={handleAlertRailClick}
          emptyLabel={DASHBOARD_COPY.alertRail.empty}
          getCountLabel={DASHBOARD_COPY.alertRail.withCount}
          viewQueueLabel={DASHBOARD_COPY.alertRail.viewQueue}
        />
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            <CommandPanel
              title={DASHBOARD_COPY.panels.route.title}
              description={DASHBOARD_COPY.panels.route.description}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/schedule">{DASHBOARD_COPY.panels.route.action}</Link>
                </Button>
              }
            >
              <div className="flex flex-col items-center justify-center min-h-[180px] rounded-xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground">
                <MapPin className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">{DASHBOARD_COPY.panels.route.emptyMap}</p>
                <p className="text-xs mt-0.5">{DASHBOARD_COPY.panels.route.emptyMapHint}</p>
              </div>
            </CommandPanel>
            <CommandPanel
              title={DASHBOARD_COPY.panels.routeAndInspections.title}
              description={DASHBOARD_COPY.panels.routeAndInspections.description}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/inspections">{DASHBOARD_COPY.panels.routeAndInspections.action}</Link>
                </Button>
              }
            >
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {DASHBOARD_COPY.panels.routeAndInspections.summary(mockData.buildingsToday.length, mockData.inspections.length)}
                </p>
                <ul className="space-y-2">
                  {mockData.buildingsToday.slice(0, 4).map((row) => (
                    <li key={row.id}>
                      <Link
                        href={row.href}
                        className="flex items-center justify-between rounded-md border border-border bg-background/50 px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium truncate text-foreground">{row.locationName}</span>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">{row.crewName ?? 'Unassigned'}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </CommandPanel>
            <CommandPanel
              title={DASHBOARD_COPY.panels.revenue.title}
              description={DASHBOARD_COPY.panels.revenue.description}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/financial-health">{DASHBOARD_COPY.panels.revenue.action}</Link>
                </Button>
              }
            >
              <div className="flex flex-wrap items-baseline gap-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Today</p>
                  <p className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl mt-0.5">
                    ${(data.revenue.todayTotal ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">WTD</p>
                  <p className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl mt-0.5">
                    ${(data.revenue.wtdTotal ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
                {data.revenue.monthPacingPct != null && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Month pacing</p>
                    <p className="text-xl font-semibold tabular-nums text-indigo-600 dark:text-indigo-400 sm:text-2xl mt-0.5">
                      {data.revenue.monthPacingPct}%
                    </p>
                  </div>
                )}
              </div>
            </CommandPanel>
          </div>
          <div className="space-y-5 sm:space-y-6">
            <SideRailPanel
              title={DASHBOARD_COPY.rail.attention.title}
              description={DASHBOARD_COPY.rail.attention.description}
              action={
                kpis.attentionCount > 0 ? (
                  <Button variant="ghost" size="sm" onClick={handleAlertRailClick}>
                    {DASHBOARD_COPY.rail.attention.action}
                  </Button>
                ) : null
              }
            >
              {kpis.attentionCount === 0 ? (
                <p className="text-sm text-muted-foreground">No items requiring attention.</p>
              ) : (
                <ul className="space-y-2">
                  {mockData.healthAccounts.slice(0, 3).map((row) => (
                    <li key={row.id}>
                      <Link
                        href={row.href}
                        className="block rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm hover:bg-amber-500/10 transition-colors"
                      >
                        <span className="font-medium text-foreground">{row.accountName}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">{row.reason}</span>
                      </Link>
                    </li>
                  ))}
                  {mockData.slaBreaches.slice(0, 2).map((row) => (
                    <li key={row.id}>
                      <Link
                        href={row.href}
                        className="block rounded-md border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-sm hover:bg-rose-500/10 transition-colors"
                      >
                        <span className="font-medium text-foreground truncate block">{row.title}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">Due {row.dueDate}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SideRailPanel>
            <SideRailPanel
              title={DASHBOARD_COPY.rail.healthWatchlist.title}
              description={DASHBOARD_COPY.rail.healthWatchlist.description}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/accounts">{DASHBOARD_COPY.rail.healthWatchlist.action}</Link>
                </Button>
              }
            >
              {mockData.healthAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">All accounts healthy.</p>
              ) : (
                <ul className="space-y-2">
                  {mockData.healthAccounts.slice(0, 4).map((row) => (
                    <li key={row.id}>
                      <Link href={row.href} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                        <span className="truncate font-medium text-foreground">{row.accountName}</span>
                        <span className="shrink-0 ml-2 text-xs font-medium text-rose-600 dark:text-rose-400">{row.healthScore}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SideRailPanel>
            <SideRailPanel
              title={DASHBOARD_COPY.rail.crewStatus.title}
              description={DASHBOARD_COPY.rail.crewStatus.description}
              action={
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/app/crews">{DASHBOARD_COPY.rail.crewStatus.action}</Link>
                </Button>
              }
            >
              {mockData.crewGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No crew gaps.</p>
              ) : (
                <ul className="space-y-2">
                  {mockData.crewGaps.map((row) => (
                    <li key={row.id}>
                      <Link href={row.href} className="block rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm hover:bg-amber-500/10 transition-colors">
                        <span className="font-medium text-foreground">{row.locationName}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">Gap: {row.gap} crew</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SideRailPanel>
          </div>
        </div>
      </DashboardShell>
      <DashboardDrawer activePanel={activePanel} onClose={() => setActivePanel(null)} data={mockData} />
    </>
  );
}
