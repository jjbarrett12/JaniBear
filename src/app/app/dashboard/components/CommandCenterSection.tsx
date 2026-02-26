'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  DollarSign,
  FileBarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMockDashboardData, type DashboardPanelId } from '../mockDashboardData';
import { KpiCard } from './KpiCard';
import { DashboardDrawer } from './DashboardDrawer';

export function CommandCenterSection({ orgId }: { orgId: string }) {
  const [activePanel, setActivePanel] = useState<DashboardPanelId | null>(null);
  const data = useMemo(() => getMockDashboardData(orgId), [orgId]);

  const kpis = data.kpis;
  const iconMap = {
    buildings_today: Building2,
    crew_today: Users,
    inspections_today: ClipboardCheck,
    health_below_threshold: Activity,
    sla_breaches: AlertTriangle,
    revenue_today: DollarSign,
  } as const;

  return (
    <section className="mb-6 rounded-xl border border-border bg-zinc-950 text-zinc-100 overflow-hidden">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Daily command</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              Click a card for details and actions
            </p>
          </div>
          <Link href="/app/reports">
            <Button variant="outline" size="sm" className="gap-2">
              <FileBarChart className="h-4 w-4" />
              View reports
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className={kpi.id === 'revenue_today' || kpi.id === 'health_below_threshold' ? 'lg:col-span-2' : 'lg:col-span-1'}
            >
              <KpiCard
                kpi={kpi}
                icon={iconMap[kpi.id]}
                onClick={setActivePanel}
                hero={kpi.id === 'revenue_today' || kpi.id === 'health_below_threshold'}
              />
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-amber-200">
            Requires attention: {data.healthAccounts.length + data.slaBreaches.length} items
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-200 hover:text-amber-100"
            onClick={() => setActivePanel('health_below_threshold')}
          >
            View
          </Button>
        </div>
      </div>

      <DashboardDrawer
        activePanel={activePanel}
        onClose={() => setActivePanel(null)}
        data={data}
      />
    </section>
  );
}
