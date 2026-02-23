'use client';

import type { DailyCommandPayload } from '@/lib/daily-command-data';
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  urgency,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  urgency?: 'normal' | 'warn' | 'critical';
}) {
  const borderClass = urgency === 'critical' ? 'border-red-500/50' : urgency === 'warn' ? 'border-amber-500/50' : 'border-zinc-700';
  const textClass = urgency === 'critical' ? 'text-red-400' : urgency === 'warn' ? 'text-amber-400' : 'text-zinc-100';
  return (
    <div className={`rounded-lg border ${borderClass} bg-zinc-900/80 px-4 py-3`}>
      <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${textClass}`}>{value}</p>
      {sub != null && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </div>
  );
}

type DailyCommandOverviewProps = {
  data: DailyCommandPayload;
  /** When true, show compact section header only (for embedding on Overview). */
  embedded?: boolean;
};

export function DailyCommandOverview({ data, embedded = false }: DailyCommandOverviewProps) {
  const buildingsScheduled = data.revenueToday?.buildings_scheduled_today ?? data.buildingsToday.length;
  const projectedRecurring = data.revenueToday?.projected_recurring_revenue_today ?? 0;
  const activeCrews = data.capacityToday?.active_crews ?? 0;
  const buildingCapacity = data.capacityToday?.building_capacity_today ?? 0;
  const crewsNeeded14d = data.hiring14d?.crews_needed_14d ?? 0;
  const hiringTrigger = data.hiring14d?.hiring_trigger ?? false;

  return (
    <div className={embedded ? '' : 'min-h-full bg-zinc-950 text-zinc-100'}>
      <div className={`mx-auto max-w-[1600px] ${embedded ? 'px-0' : 'px-4 sm:px-6 py-6'} space-y-6`}>
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
              {embedded ? 'Today' : 'Daily Command Overview'}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {embedded ? 'Buildings, crews, revenue' : 'What is happening today'}
            </p>
          </div>
          {!embedded && (
            <p className="text-xs text-zinc-500 tabular-nums">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Cards: Buildings Scheduled, Projected Recurring Revenue, Active Crews + Capacity, Utilization %, Hiring Pressure 14d, Unassigned Today */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <SummaryCard
            label="Buildings Scheduled Today"
            value={buildingsScheduled}
            icon={Building2}
            urgency={buildingsScheduled === 0 ? 'warn' : 'normal'}
          />
          <SummaryCard
            label="Projected Recurring Revenue Today"
            value={formatCurrency(projectedRecurring)}
            icon={DollarSign}
          />
          <SummaryCard
            label="Active Crews + Capacity Today"
            value={`${activeCrews} / ${buildingCapacity}`}
            sub={buildingCapacity > 0 ? `${buildingCapacity} capacity` : undefined}
            icon={Users}
          />
          <SummaryCard
            label="Utilization %"
            value={data.utilizationPct != null ? `${data.utilizationPct}%` : '—'}
            icon={Activity}
            urgency={data.utilizationPct != null && data.utilizationPct > 90 ? 'warn' : 'normal'}
          />
          <SummaryCard
            label="Hiring Pressure 14d"
            value={crewsNeeded14d}
            sub={hiringTrigger ? 'Trigger active' : undefined}
            icon={UserPlus}
            urgency={hiringTrigger ? 'critical' : crewsNeeded14d > 0 ? 'warn' : 'normal'}
          />
          <SummaryCard
            label="Unassigned Today"
            value={data.unassignedCount}
            icon={AlertTriangle}
            urgency={data.unassignedCount > 0 ? 'critical' : 'normal'}
          />
        </div>

        {/* Buildings table */}
        <div>
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Buildings Being Cleaned Today</h3>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                    <th className="px-4 py-3 font-medium">Account (Location)</th>
                    <th className="px-4 py-3 font-medium">Service Type</th>
                    <th className="px-4 py-3 font-medium">Crew Assigned</th>
                    <th className="px-4 py-3 font-medium">Start Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.buildingsToday.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                        No buildings scheduled for today
                      </td>
                    </tr>
                  ) : (
                    data.buildingsToday.map((row) => (
                      <tr key={row.id} className="border-b border-zinc-800/80 hover:bg-zinc-800/30">
                        <td className="px-4 py-2.5">
                          <span className="font-medium text-zinc-200">{row.clientName}</span>
                          <span className="text-zinc-500 block text-xs">{row.locationName}</span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-400">{row.templateName ?? '—'}</td>
                        <td className="px-4 py-2.5 text-zinc-400">{row.crewName ?? '—'}</td>
                        <td className="px-4 py-2.5 text-zinc-400 tabular-nums">{row.startTime ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
