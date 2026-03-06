'use client';

import { Search, Upload, MapPinned, Focus, AlertTriangle } from 'lucide-react';
import { MapLayerChips, type WarMapLayerId } from './MapLayerChips';
import { VerticalFilterChips } from './VerticalFilterChips';
import type { MapMode } from '@/types/territory-map';

export type CoverageFilterValue = 'my' | 'all' | 'by_rep';

interface Props {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  layerIds: Set<WarMapLayerId>;
  onLayerToggle: (id: WarMapLayerId, enabled: boolean) => void;
  coverageFilter?: CoverageFilterValue;
  onCoverageFilterChange?: (v: CoverageFilterValue) => void;
  showCoverageFilter?: boolean;
  coverageAdmin?: boolean;
  /** When set, shows "Zoom to results" button (search fly-to). */
  onZoomToResults?: () => void;
  /** Sales: vertical filter + show vertical ownership toggle */
  verticals?: { id: string; key: string; label: string }[];
  selectedVerticalIds?: Set<string>;
  onVerticalFilterToggle?: (verticalId: string, selected: boolean) => void;
  showVerticalOwnership?: boolean;
  onShowVerticalOwnershipChange?: (value: boolean) => void;
  /** Ops: show facility pins by account risk level */
  showRiskLayer?: boolean;
  onShowRiskLayerChange?: (value: boolean) => void;
}

export function MapCommandBar({
  mode,
  onModeChange,
  searchValue,
  onSearchChange,
  layerIds,
  onLayerToggle,
  coverageFilter = 'my',
  onCoverageFilterChange,
  showCoverageFilter = false,
  coverageAdmin = false,
  onZoomToResults,
  verticals = [],
  selectedVerticalIds = new Set(),
  onVerticalFilterToggle,
  showVerticalOwnership = false,
  onShowVerticalOwnershipChange,
  showRiskLayer = false,
  onShowRiskLayerChange,
}: Props) {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/40 backdrop-blur-md px-4 py-2.5">
      <div className="flex items-center gap-0 rounded-lg border border-white/10 bg-white/5 p-0.5">
        <button
          type="button"
          onClick={() => onModeChange('sales')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'sales' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Sales
        </button>
        <button
          type="button"
          onClick={() => onModeChange('ops')}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            mode === 'ops' ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Ops
        </button>
      </div>

      <div className="relative flex-1 min-w-[200px] max-w-md flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search leads, accounts, addresses…"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </div>
        {onZoomToResults && (
          <button
            type="button"
            onClick={onZoomToResults}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/15"
            title="Zoom map to search results"
          >
            <Focus className="h-3.5 w-3.5" />
            Zoom to results
          </button>
        )}
      </div>

      <MapLayerChips enabled={layerIds} onToggle={onLayerToggle} />

      {mode === 'ops' && onShowRiskLayerChange && (
        <button
          type="button"
          onClick={() => onShowRiskLayerChange(!showRiskLayer)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
            showRiskLayer
              ? 'border-amber-400/30 bg-amber-500/20 text-amber-200'
              : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-300'
          }`}
          title="Color facilities by account risk level"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Risk
        </button>
      )}

      {mode === 'sales' && verticals.length > 0 && onVerticalFilterToggle && onShowVerticalOwnershipChange && (
        <VerticalFilterChips
          verticals={verticals}
          selectedIds={selectedVerticalIds}
          onToggle={onVerticalFilterToggle}
          showVerticalOwnership={showVerticalOwnership}
          onShowVerticalOwnershipChange={onShowVerticalOwnershipChange}
        />
      )}

      {showCoverageFilter && onCoverageFilterChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Coverage:</span>
          <select
            value={coverageFilter}
            onChange={(e) => onCoverageFilterChange(e.target.value as CoverageFilterValue)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white focus:border-white/20 focus:outline-none"
          >
            <option value="my">My Coverage</option>
            {coverageAdmin && <option value="all">All (admin)</option>}
            {coverageAdmin && <option value="by_rep">By Rep (admin)</option>}
          </select>
        </div>
      )}

      <div className="shrink-0">
        {mode === 'sales' ? (
          <a
            href="/app/sales/leads"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-500/15 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-500/25"
          >
            <Upload className="h-4 w-4" />
            Import Leads
          </a>
        ) : (
          <a
            href="/app/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-500/15 px-3 py-1.5 text-sm font-medium text-blue-200 hover:bg-blue-500/25"
          >
            <MapPinned className="h-4 w-4" />
            Manage Service Areas
          </a>
        )}
      </div>
    </header>
  );
}
