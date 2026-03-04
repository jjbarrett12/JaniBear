'use client';

import { X, Phone, FileText, ArrowRightLeft } from 'lucide-react';
import type { Prospect } from '@/types/territory-map';

const statusColors: Record<string, string> = {
  uncontacted: 'bg-gray-400',
  contacted: 'bg-blue-500',
  proposal_sent: 'bg-amber-500',
  closed_won: 'bg-emerald-500',
  closed_lost: 'bg-red-400',
};

const statusLabels: Record<string, string> = {
  uncontacted: 'Uncontacted',
  contacted: 'Contacted',
  proposal_sent: 'Proposal Sent',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

interface Props {
  prospect: Prospect;
  onClose: () => void;
}

export function ProspectDrawer({ prospect, onClose }: Props) {
  const addr = [prospect.address1, prospect.city, prospect.state, prospect.postal]
    .filter(Boolean)
    .join(', ');

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-foreground">
            {prospect.name || 'Unnamed Prospect'}
          </h2>
          {prospect.industry && (
            <p className="text-xs text-muted-foreground">{prospect.industry}</p>
          )}
          {addr && <p className="mt-0.5 text-xs text-muted-foreground">{addr}</p>}
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Status */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-full ${statusColors[prospect.status]}`} />
          <span className="text-sm font-medium">{statusLabels[prospect.status]}</span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 border-b border-border p-4">
        {prospect.assigned_user_id && (
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Assigned Rep
            </p>
            <p className="text-sm text-foreground">{prospect.assigned_user_id}</p>
          </div>
        )}
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Created
          </p>
          <p className="text-sm text-foreground">
            {new Date(prospect.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 p-4">
        <button className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Phone className="h-4 w-4" />
          Log Call
        </button>
        <button className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <ArrowRightLeft className="h-4 w-4" />
          Set Status
        </button>
        <a
          href="/app/bids/new"
          className="flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <FileText className="h-4 w-4" />
          Create Proposal
        </a>
      </div>
    </aside>
  );
}
