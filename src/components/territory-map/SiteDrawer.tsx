'use client';

import { X, ClipboardCheck, Ticket } from 'lucide-react';
import type { FacilityWithHealth } from '@/types/territory-map';

const healthColors: Record<string, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
};

const healthLabels: Record<string, string> = {
  green: 'Healthy',
  yellow: 'At Risk',
  red: 'Critical',
};

interface Props {
  site: FacilityWithHealth;
  onClose: () => void;
}

export function SiteDrawer({ site, onClose }: Props) {
  const addr = [site.address_line1, site.city, site.state, site.zip].filter(Boolean).join(', ');

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{site.account_name}</p>
          <h2 className="truncate text-base font-semibold text-foreground">{site.name}</h2>
          {addr && <p className="mt-0.5 text-xs text-muted-foreground">{addr}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Health badge */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${healthColors[site.health_status]}`} />
          <span className="text-sm font-medium">{healthLabels[site.health_status]}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 border-b border-border p-4">
        <StatCard label="Last Inspection" value={site.last_inspection_at ? new Date(site.last_inspection_at).toLocaleDateString() : '—'} />
        <StatCard label="Score" value={site.last_inspection_score != null ? `${site.last_inspection_score}%` : '—'} />
        <StatCard label="Open Tickets" value={String(site.open_ticket_count)} highlight={site.open_ticket_count > 0} />
        <StatCard label="Overdue" value={String(site.overdue_ticket_count)} highlight={site.overdue_ticket_count > 0} />
        <StatCard label="Checklist 7d" value={site.checklist_completion_7d != null ? `${site.checklist_completion_7d}%` : '—'} />
        <StatCard label="Missed Shifts 7d" value={String(site.missed_shifts_7d)} highlight={site.missed_shifts_7d > 0} />
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 p-4">
        <a
          href="/app/inspections/start"
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <ClipboardCheck className="h-4 w-4" />
          Create Inspection
        </a>
        <a
          href="/app/tickets"
          className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <Ticket className="h-4 w-4" />
          View Tickets
        </a>
      </div>
    </aside>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? 'text-red-500' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
