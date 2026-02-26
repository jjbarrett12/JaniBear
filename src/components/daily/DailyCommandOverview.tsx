'use client';

import type { DailyCommandPayload } from '@/lib/daily-command-data';
import {
  Building2,
  Users,
  DollarSign,
  ClipboardCheck,
  AlertTriangle,
  Activity,
} from 'lucide-react';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const CARD_COLORS: { leftAccent: string; bg: string; icon: string; label: string }[] = [
  { leftAccent: 'border-l-blue-500/60', bg: 'bg-blue-500/10', icon: 'text-blue-400', label: 'text-blue-400/90' },
  { leftAccent: 'border-l-emerald-500/60', bg: 'bg-emerald-500/10', icon: 'text-emerald-400', label: 'text-emerald-400/90' },
  { leftAccent: 'border-l-violet-500/60', bg: 'bg-violet-500/10', icon: 'text-violet-400', label: 'text-violet-400/90' },
  { leftAccent: 'border-l-amber-500/60', bg: 'bg-amber-500/10', icon: 'text-amber-400', label: 'text-amber-400/90' },
  { leftAccent: 'border-l-red-500/60', bg: 'bg-red-500/10', icon: 'text-red-400', label: 'text-red-400/90' },
  { leftAccent: 'border-l-cyan-500/60', bg: 'bg-cyan-500/10', icon: 'text-cyan-400', label: 'text-cyan-400/90' },
];

function SummaryCard({
  label,
  value,
  icon: Icon,
  colorIndex,
  urgency,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorIndex: number;
  urgency?: 'normal' | 'warn' | 'critical';
}) {
  const colors = CARD_COLORS[colorIndex % CARD_COLORS.length];
  const accentClass = urgency === 'critical' ? 'border-l-red-500/70' : urgency === 'warn' ? 'border-l-amber-500/70' : colors.leftAccent;
  const valueClass = urgency === 'critical' ? 'text-red-400' : urgency === 'warn' ? 'text-amber-400' : 'text-zinc-100';
  return (
    <div className={`rounded-lg border-l-2 ${accentClass} ${colors.bg} bg-zinc-900/80 px-4 py-3`}>
      <div className={`flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${colors.label}`}>
        <Icon className={`h-3.5 w-3.5 ${colors.icon}`} />
        {label}
      </div>
      <p className={`mt-1 text-xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
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
  const inspectionsDue = data.needsAttention.filter((i) => i.type === 'inspection_due').length;
  const accountsBelowHealth = data.needsAttention.filter((i) => i.type === 'account_below_health').length;
  const slaBreaches = data.needsAttention.filter((i) => i.type === 'sla_breach').length;
  const overdueTasks = data.unassignedCount + slaBreaches;

  return (
    <div className={embedded ? '' : 'min-h-full bg-zinc-950 text-zinc-100'}>
      <div className={`mx-auto max-w-[1600px] ${embedded ? 'px-0' : 'px-4 sm:px-6 py-6'} space-y-8`}>
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
              {embedded ? 'Daily command' : 'Daily Command'}
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {embedded ? 'Buildings, crews, inspections, revenue' : "Here's what's happening today"}
            </p>
          </div>
          {!embedded && (
            <p className="text-xs text-zinc-500 tabular-nums">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Top bar: 6 Daily command items as colored cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard
            label="Buildings scheduled today"
            value={buildingsScheduled}
            icon={Building2}
            colorIndex={0}
            urgency={buildingsScheduled === 0 ? 'warn' : 'normal'}
          />
          <SummaryCard
            label="Crew active / required today"
            value={buildingCapacity > 0 ? `${activeCrews} / ${buildingCapacity}` : activeCrews}
            icon={Users}
            colorIndex={1}
          />
          <SummaryCard
            label="Inspections due today"
            value={inspectionsDue}
            icon={ClipboardCheck}
            colorIndex={2}
            urgency={inspectionsDue > 0 ? 'warn' : 'normal'}
          />
          <SummaryCard
            label="Accounts below health threshold"
            value={accountsBelowHealth}
            icon={Activity}
            colorIndex={3}
            urgency={accountsBelowHealth > 0 ? 'critical' : 'normal'}
          />
          <SummaryCard
            label="SLA breaches / overdue tasks"
            value={overdueTasks}
            icon={AlertTriangle}
            colorIndex={4}
            urgency={overdueTasks > 0 ? 'critical' : 'normal'}
          />
          <SummaryCard
            label="Revenue scheduled today"
            value={formatCurrency(projectedRecurring)}
            icon={DollarSign}
            colorIndex={5}
          />
        </div>

        {/* Buildings table — spacing only, no intersecting borders */}
        <div className="pt-2">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Buildings Being Cleaned Today</h3>
          <div className="rounded-lg bg-zinc-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 text-left">
                    <th className="px-4 pt-4 pb-2 font-medium">Account (Location)</th>
                    <th className="px-4 pt-4 pb-2 font-medium">Service Type</th>
                    <th className="px-4 pt-4 pb-2 font-medium">Crew Assigned</th>
                    <th className="px-4 pt-4 pb-2 font-medium">Start Time</th>
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
                      <tr key={row.id} className="hover:bg-zinc-800/30">
                        <td className="px-4 py-3">
                          <span className="font-medium text-zinc-200">{row.clientName}</span>
                          <span className="text-zinc-500 block text-xs">{row.locationName}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{row.templateName ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-400">{row.crewName ?? '—'}</td>
                        <td className="px-4 py-3 text-zinc-400 tabular-nums">{row.startTime ?? '—'}</td>
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
