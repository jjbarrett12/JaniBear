'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KpiTile } from './widgets/KpiTile';
import { AttentionPanel } from './widgets/AttentionPanel';
import { MissedTasksPanel } from './widgets/MissedTasksPanel';
import { AIInsightsPanel } from './widgets/AIInsightsPanel';
import { ActivityFeed } from './widgets/ActivityFeed';
import { OperationsPerformanceCard } from './widgets/OperationsPerformanceCard';
import { SalesCommandCard } from './widgets/SalesCommandCard';
import type { ExecutiveDemoData } from './types';

interface ExecutiveDashboardProps {
  data: ExecutiveDemoData;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function ExecutiveDashboard({ data }: ExecutiveDashboardProps) {
  const {
    userName,
    orgName,
    kpiTiles,
    attentionItems,
    missedTasksKpi,
    aiInsights,
    activityFeed,
    salesCommand,
    operationsPerformance,
    missedTasks,
  } = data;

  const greeting = getGreeting();

  return (
    <div className="min-h-screen bg-[#070B12] text-white">
      {/* Subtle animated gradient background */}
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden"
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-transparent to-violet-950/10 animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Top header row */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white">
              {greeting}, {userName}
            </h1>
            <p className="text-sm text-white/60 mt-0.5">{orgName}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <time
              dateTime={new Date().toISOString()}
              className="text-sm text-white/60 tabular-nums"
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            <Button asChild variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/app/reports/accounts">View reports</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
              <Link href="/app/dashboard">Customize layout</Link>
            </Button>
          </div>
        </header>

        {/* Row A — Executive KPI Tiles */}
        <section className="mb-8" aria-labelledby="exec-kpi-heading">
          <h2 id="exec-kpi-heading" className="sr-only">
            Key metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {kpiTiles.map((tile, i) => (
              <KpiTile key={i} {...tile} />
            ))}
          </div>
        </section>

        {/* Row B — Attention Required */}
        <section className="mb-8" aria-labelledby="attention-heading">
          <AttentionPanel
            items={attentionItems}
            missedTasksKpi={missedTasksKpi}
            rightAction={
              <Link
                href="/app/ops/issues-sla"
                className="text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                View all
              </Link>
            }
          />
        </section>

        {/* Row B2 — Missed Tasks / Coverage Gaps */}
        <section className="mb-8" aria-labelledby="missed-tasks-heading">
          <h2 id="missed-tasks-heading" className="sr-only">
            Missed tasks
          </h2>
          <MissedTasksPanel
            records={missedTasks}
            rightAction={
              <Button asChild size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Link href="/app/ops/missed-tasks">View all</Link>
              </Button>
            }
          />
        </section>

        {/* Row C — Operations Performance (left) + AI Insights (right) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <OperationsPerformanceCard data={operationsPerformance} />
          <AIInsightsPanel insights={aiInsights} />
        </section>

        {/* Row D — Sales Command (left) + Activity Feed (right) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <SalesCommandCard metrics={salesCommand} />
          <ActivityFeed items={activityFeed} />
        </section>

        {/* Bottom — Customize dashboard callout */}
        <footer className="rounded-2xl bg-[#0B1220]/50 border border-white/10 p-6">
          <p className="text-sm text-white/70">
            <span className="font-medium text-white/90">Customize dashboard</span>
            — Create saved views by role: Owner / Ops / Sales / Finance
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3 border-white/20 text-white hover:bg-white/10">
            <Link href="/app/dashboard">Back to Command Center</Link>
          </Button>
        </footer>
      </div>
    </div>
  );
}
