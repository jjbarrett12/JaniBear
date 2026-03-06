'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Building2, Users, Store, List } from 'lucide-react';
import type { LatLngBounds } from 'leaflet';
import type { MapMode } from '@/types/territory-map';
import type { MapEntity } from '@/types/territory-map';
import type { TerritoryMapPayload } from '@/types/territory-map';
import type { FacilityWithHealth } from '@/types/territory-map';

export type QueueTab = 'queue' | 'all' | 'runs';

type QueueRow =
  | { kind: 'lead'; id: string; name: string; city: string; state: string; score: number; status: string; reason: string; entity: MapEntity }
  | { kind: 'account'; id: string; name: string; city: string; state: string; riskScore: number; reason: string; entity: MapEntity; facility?: FacilityWithHealth };

interface Props {
  mode: MapMode;
  data: TerritoryMapPayload;
  selectedId: string | null;
  onSelect: (entity: MapEntity, facility?: FacilityWithHealth) => void;
  searchText?: string;
  /** When set, only show rows whose entity is inside these bounds (avoids thrash, synced with map). */
  mapBounds?: LatLngBounds | null;
}

function buildQueueRows(mode: MapMode, data: TerritoryMapPayload): QueueRow[] {
  if (mode === 'sales') {
    const scoreByLeadId = new Map(data.heatmapLeads.map((p) => [p.id, p]));
    return data.leads.map((lead) => {
      const point = scoreByLeadId.get(lead.id);
      const score = point?.score ?? (lead.meta?.score as number) ?? 50;
      const status = (lead.meta?.status as string) ?? 'new';
      const reasons = (lead.meta?.score_reasons as string[]) ?? [];
      return {
        kind: 'lead' as const,
        id: lead.id,
        name: lead.name,
        city: (lead.meta?.city as string) ?? '',
        state: (lead.meta?.state as string) ?? '',
        score,
        status,
        reason: reasons[0] ?? 'Lead in pipeline',
        entity: lead,
      };
    })
      .sort((a, b) => {
        const statusOrder = (s: string) => (s === 'new' ? 0 : s === 'contacted' ? 1 : 2);
        if (statusOrder(a.status) !== statusOrder(b.status)) return statusOrder(a.status) - statusOrder(b.status);
        return b.score - a.score;
      });
  }

  const riskByAccountId = new Map(data.heatmapAccounts.map((p) => [p.id, p]));
  const facilityById = new Map(data.facilities.map((f) => [f.id, f]));
  const accountEntities = data.accounts;
  return accountEntities.map((acc) => {
    const point = riskByAccountId.get(acc.id);
    const facility = facilityById.get(acc.id);
    const riskScore = point?.riskScore ?? 0;
    const reason = facility
      ? facility.health_status === 'red'
        ? 'Health at risk'
        : facility.overdue_ticket_count
          ? `${facility.overdue_ticket_count} overdue`
          : 'Active'
      : 'Account';
    return {
      kind: 'account' as const,
      id: acc.id,
      name: acc.name,
      city: (acc.meta?.city as string) ?? (facility?.city ?? ''),
      state: (acc.meta?.state as string) ?? (facility?.state ?? ''),
      riskScore,
      reason,
      entity: acc,
      facility,
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

function filterRowsBySearch(rows: QueueRow[], q: string): QueueRow[] {
  if (!q.trim()) return rows;
  const lower = q.toLowerCase().trim();
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(lower) ||
      r.city.toLowerCase().includes(lower) ||
      r.state.toLowerCase().includes(lower)
  );
}

function filterRowsByBounds(rows: QueueRow[], bounds: LatLngBounds | null | undefined): QueueRow[] {
  if (!bounds) return rows;
  return rows.filter((r) => {
    try {
      return bounds.contains([r.entity.lat, r.entity.lng]);
    } catch {
      return true;
    }
  });
}

export function MapQueuePanel({ mode, data, selectedId, onSelect, searchText = '', mapBounds }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<QueueTab>('queue');

  const rows = useMemo(() => buildQueueRows(mode, data), [mode, data]);
  const bySearch = useMemo(() => filterRowsBySearch(rows, searchText), [rows, searchText]);
  const displayRows = useMemo(() => {
    const bounded = filterRowsByBounds(bySearch, mapBounds);
    return tab === 'runs' ? bounded.slice(0, 0) : bounded;
  }, [tab, bySearch, mapBounds]);

  if (collapsed) {
    return (
      <div className="flex flex-col border-r border-white/10 bg-black/30 backdrop-blur-md w-10 shrink-0">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center justify-center py-3 text-zinc-400 hover:text-white"
          aria-label="Expand queue"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  const iconByType = (type: string) => {
    switch (type) {
      case 'lead': return MapPin;
      case 'account': return Building2;
      case 'crew': return Users;
      case 'franchisee': return Store;
      default: return List;
    }
  };

  return (
    <aside className="flex w-56 sm:w-64 md:w-72 shrink-0 flex-col border-r border-white/10 bg-black/30 backdrop-blur-md overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Queue</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label="Collapse queue"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-0.5 border-b border-white/10 px-2 py-1.5">
        {(['queue', 'all', 'runs'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded px-2.5 py-1 text-xs font-medium capitalize ${
              tab === t ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {displayRows.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            {mode === 'sales' ? 'No leads in view' : 'No accounts in view'}
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {displayRows.map((row) => {
              const Icon = iconByType(row.entity.type);
              const isSelected = selectedId === row.entity.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(row.entity, row.kind === 'account' ? row.facility : undefined)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors ${isSelected ? 'bg-white/10' : ''}`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 rounded bg-white/10 p-1 text-zinc-400">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{row.name}</p>
                        <p className="truncate text-xs text-zinc-500">
                          {[row.city, row.state].filter(Boolean).join(', ') || '—'}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {row.kind === 'lead' ? (
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                              {row.score}
                            </span>
                          ) : (
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                              row.riskScore > 50 ? 'bg-red-500/20 text-red-300' : row.riskScore > 20 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-zinc-400'
                            }`}>
                              Risk {row.riskScore}
                            </span>
                          )}
                          <span className="truncate text-[10px] text-zinc-500">{row.reason}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
