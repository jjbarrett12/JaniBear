'use client';

import Link from 'next/link';
import {
  Building2,
  Users,
  AlertTriangle,
  ClipboardCheck,
  Heart,
  AlertCircle,
  DollarSign,
  Activity,
} from 'lucide-react';
import type { DailyCommandPayload, NeedsAttentionItem } from '@/lib/daily-command-data';
import { MetricTile } from '@/components/ui/metric-tile';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

const SEVERITY_BADGE: Record<string, string> = {
  high: 'bg-destructive/20 text-destructive border border-destructive/40',
  medium: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40',
  low: 'bg-muted text-muted-foreground border border-border',
};

export function DailyCommandContent({ data }: { data: DailyCommandPayload }) {
  const buildingsScheduled = data.revenueToday?.buildings_scheduled_today ?? data.buildingsToday.length;
  const projectedRevenue = data.revenueToday?.projected_recurring_revenue_today ?? 0;
  const activeCrews = data.capacityToday?.active_crews ?? 0;
  const capacityToday = data.capacityToday?.building_capacity_today ?? 0;
  const crewsRequired = capacityToday || buildingsScheduled;

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 lg:py-8 space-y-6 lg:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Daily Command</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tactical execution for today — action and urgency
          </p>
          <p className="text-xs text-muted-foreground mt-1 tabular-nums">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Today command bar — 6–8 tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricTile
            title="Buildings scheduled today"
            value={buildingsScheduled}
            status={buildingsScheduled === 0 ? 'warn' : 'neutral'}
            icon={Building2}
          />
          <MetricTile
            title="Crews active / required today"
            value={capacityToday > 0 ? `${activeCrews} / ${crewsRequired}` : (activeCrews || '—')}
            subvalue={capacityToday > 0 ? undefined : 'No capacity data'}
            icon={Users}
          />
          <MetricTile
            title="Unassigned today"
            value={data.unassignedCount}
            href={data.unassignedCount > 0 ? '/app/ops/launch-intake' : undefined}
            status={data.unassignedCount > 0 ? 'bad' : 'neutral'}
            icon={AlertTriangle}
          />
          <MetricTile
            title="Inspections due today"
            value={0}
            href="/app/inspections"
            icon={ClipboardCheck}
            emptyTooltip="Data not available yet"
          />
          <MetricTile
            title="Accounts below health threshold"
            value={0}
            href="/app/accounts"
            icon={Heart}
            emptyTooltip="Data not available yet"
          />
          <MetricTile
            title="SLA breaches / overdue tasks"
            value={0}
            href="/app/ops/issues-sla"
            icon={AlertCircle}
            emptyTooltip="Data not available yet"
          />
          <MetricTile
            title="Revenue scheduled today"
            value={projectedRevenue > 0 ? formatCurrency(projectedRevenue) : null}
            icon={DollarSign}
            emptyTooltip="Data not available yet"
          />
          {data.utilizationPct != null && (
            <MetricTile
              title="Utilization today"
              value={`${data.utilizationPct}%`}
              status={data.utilizationPct > 90 ? 'warn' : data.utilizationPct >= 70 ? 'good' : 'neutral'}
              icon={Activity}
            />
          )}
        </div>

        {/* Needs Attention */}
        <section aria-labelledby="needs-attention-heading">
          <h2 id="needs-attention-heading" className="text-lg font-semibold text-foreground mb-3">
            Needs Attention
          </h2>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {data.needsAttention.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                No items requiring immediate attention
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {data.needsAttention.map((item) => (
                  <NeedsAttentionRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Today's Schedule */}
        <section aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="text-lg font-semibold text-foreground mb-3">
            Today&apos;s Schedule
          </h2>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Account</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Site / Location</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Crew Assigned</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Start Time</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Inspection Required</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Health Score</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Revenue Today</th>
                  </tr>
                </thead>
                <tbody>
                  {data.scheduleRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <p className="text-muted-foreground mb-2">No buildings scheduled for today</p>
                        <Link
                          href="/app/schedules"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Create schedule
                        </Link>
                        <span className="text-muted-foreground"> or </span>
                        <Link
                          href="/app/ops/launch-intake"
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Import schedule
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    data.scheduleRows.map((row) => (
                      <tr key={row.id} className="border-b border-border/80 hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-medium text-foreground">{row.clientName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.locationName}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.templateName ?? '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.crewName ?? '—'}</td>
                        <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{row.startTime ?? '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.inspectionRequired ? 'Yes' : '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.healthScore != null ? row.healthScore : '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{row.revenueToday != null ? formatCurrency(row.revenueToday) : '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function NeedsAttentionRow({ item }: { item: NeedsAttentionItem }) {
  const badgeClass = SEVERITY_BADGE[item.severity] ?? SEVERITY_BADGE.low;
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{item.account}</p>
        <p className="text-xs text-muted-foreground">{item.site}</p>
      </div>
      {item.dueTime && (
        <span className="text-xs tabular-nums text-muted-foreground">{item.dueTime}</span>
      )}
      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
        {item.severity}
      </span>
      <Link
        href={item.href}
        className="text-sm font-medium text-primary hover:underline shrink-0"
      >
        {item.ctaLabel}
      </Link>
    </li>
  );
}
