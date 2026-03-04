'use client';

import Link from 'next/link';
import { Search, Plus, Building2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onZoomToResults?: () => void;
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
  onZoomToResults,
}: Props) {
  const hasSearch = searchText.trim().length > 0;
  const count = mode === 'ops' ? sitesCount : prospectsCount;
  const showZoomToResults = hasSearch && count > 0 && onZoomToResults != null;

  return (
    <aside className="flex w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-card p-4">
      {/* Search: companies or addresses */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies or addresses…"
            value={searchText}
            onChange={(e) => onSearchText(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {showZoomToResults && (
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={onZoomToResults}>
            <Search className="h-3.5 w-3.5" />
            Zoom to {count} result{count !== 1 ? 's' : ''}
          </Button>
        )}
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

          <div className="space-y-2 border-t border-border pt-4 mt-auto">
            <Link href="/app/accounts/new" className="block">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                New account
              </Button>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground">
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

          {/* Add new lead / account from map */}
          <div className="space-y-2 border-t border-border pt-4 mt-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add from map</p>
            <Link href="/app/sales/leads/new" className="block">
              <Button variant="default" size="sm" className="w-full gap-2">
                <UserPlus className="h-4 w-4" />
                New lead
              </Button>
            </Link>
            <Link href="/app/accounts/new" className="block">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Building2 className="h-4 w-4" />
                New account
              </Button>
            </Link>
          </div>

          <div className="text-xs text-muted-foreground">
            {prospectsCount} prospect{prospectsCount !== 1 ? 's' : ''} with coordinates
          </div>
        </>
      )}
    </aside>
  );
}
