'use client';

import { Search } from 'lucide-react';
import type { MapMode, AccountOption } from '@/types/territory-map';

interface Props {
  mode: MapMode;
  accounts: AccountOption[];
  accountFilter: string;
  onAccountFilter: (v: string) => void;
  healthFilter: string;
  onHealthFilter: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  searchText: string;
  onSearchText: (v: string) => void;
  sitesCount: number;
  prospectsCount: number;
}

export function MapFilters({
  mode,
  accounts,
  accountFilter,
  onAccountFilter,
  healthFilter,
  onHealthFilter,
  statusFilter,
  onStatusFilter,
  searchText,
  onSearchText,
  sitesCount,
  prospectsCount,
}: Props) {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search…"
          value={searchText}
          onChange={(e) => onSearchText(e.target.value)}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {mode === 'ops' && (
        <>
          {/* Account filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Account
            </label>
            <select
              value={accountFilter}
              onChange={(e) => onAccountFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {/* Health filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Health
            </label>
            <select
              value={healthFilter}
              onChange={(e) => onHealthFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="red">Red</option>
            </select>
          </div>

          <div className="mt-auto text-xs text-muted-foreground">
            {sitesCount} site{sitesCount !== 1 ? 's' : ''} with coordinates
          </div>
        </>
      )}

      {mode === 'sales' && (
        <>
          {/* Prospect status filter */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="uncontacted">Uncontacted</option>
              <option value="contacted">Contacted</option>
              <option value="proposal_sent">Proposal sent</option>
              <option value="closed_won">Closed won</option>
              <option value="closed_lost">Closed lost</option>
            </select>
          </div>

          <div className="mt-auto text-xs text-muted-foreground">
            {prospectsCount} prospect{prospectsCount !== 1 ? 's' : ''} with coordinates
          </div>
        </>
      )}
    </aside>
  );
}
