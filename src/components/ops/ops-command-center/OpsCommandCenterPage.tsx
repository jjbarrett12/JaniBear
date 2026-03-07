'use client';

import React from 'react';
import Link from 'next/link';
import { OpsHeader } from './OpsHeader';
import { OpsKpiStrip } from './OpsKpiStrip';
import { ActionRail } from './ActionRail';
import { TerritoryCoveragePanel } from './TerritoryCoveragePanel';
import { LiveDeploymentsPanel } from './LiveDeploymentsPanel';
import { AccountHealthWatchlistPanel } from './AccountHealthWatchlistPanel';
import { CrewCapacityPanel } from './CrewCapacityPanel';
import { UpcomingGoLivesPanel } from './UpcomingGoLivesPanel';
import type { OpsCommandCenterData } from '@/lib/ops/ops-command-center-types';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin } from 'lucide-react';

const SHELL_CLASS = 'mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6';

export interface OpsCommandCenterPageProps {
  data: OpsCommandCenterData;
}

/**
 * Ops Command Center: primary operations cockpit.
 * Layout: Header → KPI Strip → Action Rail → Main grid (left: territory; center: live deployments + health; right: crew + go-lives).
 */
export function OpsCommandCenterPage({ data }: OpsCommandCenterPageProps) {
  const {
    kpis,
    urgentActions,
    territoryCoverage,
    liveDeployments,
    accountHealthWatchlist,
    crewCapacity,
    upcomingGoLives,
    userName,
    orgName,
  } = data;

  return (
    <div className={SHELL_CLASS}>
      <OpsHeader
        title="Ops Command Center"
        subtitle="Live deployment activity, account health, labor coverage, and urgent action items."
        orgName={orgName}
        quickActions={
          <>
            <Button variant="outline" size="sm" asChild className="rounded-lg">
              <Link href="/app/map">
                <MapPin className="h-4 w-4 mr-1.5" />
                Map
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-lg">
              <Link href="/app/ops/service-deployments">
                <Calendar className="h-4 w-4 mr-1.5" />
                Deployments
              </Link>
            </Button>
          </>
        }
      />

      <OpsKpiStrip kpis={kpis} />

      <ActionRail items={urgentActions} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Territory coverage — 4 cols on lg */}
        <div className="lg:col-span-4">
          <TerritoryCoveragePanel items={territoryCoverage} />
        </div>

        {/* Center: Live Deployments (top) + Account Health (bottom) — 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <LiveDeploymentsPanel items={liveDeployments} />
          <AccountHealthWatchlistPanel items={accountHealthWatchlist} />
        </div>

        {/* Right: Crew Capacity (top) + Upcoming Go-Lives (bottom) — 3 cols */}
        <div className="lg:col-span-3 space-y-6">
          <CrewCapacityPanel items={crewCapacity} />
          <UpcomingGoLivesPanel items={upcomingGoLives} />
        </div>
      </div>
    </div>
  );
}
