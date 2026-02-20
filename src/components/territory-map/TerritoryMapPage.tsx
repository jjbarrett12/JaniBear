'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { MapFilters } from './MapFilters';
import { SiteDrawer } from './SiteDrawer';
import { ProspectDrawer } from './ProspectDrawer';
import type {
  TerritoryMapPayload,
  MapMode,
  FacilityWithHealth,
  Prospect,
  Quadrant,
} from '@/types/territory-map';

const MapCanvas = dynamic(() => import('./MapCanvas').then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
      Loading map…
    </div>
  ),
});

interface Props {
  data: TerritoryMapPayload;
  orgId: string;
}

export function TerritoryMapPage({ data, orgId }: Props) {
  const [mode, setMode] = useState<MapMode>('ops');
  const [selectedSite, setSelectedSite] = useState<FacilityWithHealth | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Filters
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Quadrants managed locally after initial load (add newly drawn ones)
  const [quadrants, setQuadrants] = useState<Quadrant[]>(data.quadrants);

  const modeQuadrants = useMemo(
    () => quadrants.filter((q) => q.mode === mode),
    [quadrants, mode]
  );

  const filteredFacilities = useMemo(() => {
    let list = data.facilities;
    if (accountFilter !== 'all') {
      list = list.filter((f) => f.account_id === accountFilter);
    }
    if (healthFilter !== 'all') {
      list = list.filter((f) => f.health_status === healthFilter);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.account_name.toLowerCase().includes(q) ||
          f.address_line1?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.facilities, accountFilter, healthFilter, searchText]);

  const filteredProspects = useMemo(() => {
    let list = data.prospects;
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.address1?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [data.prospects, statusFilter, searchText]);

  const handleQuadrantCreated = useCallback((q: Quadrant) => {
    setQuadrants((prev) => [...prev, q]);
  }, []);

  const handleCloseDrawers = useCallback(() => {
    setSelectedSite(null);
    setSelectedProspect(null);
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Territory Map</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'ops'
              ? 'Site locations and health overview'
              : 'Sales prospects and cold-calling quadrants'}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => { setMode('ops'); handleCloseDrawers(); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === 'ops'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ops
          </button>
          <button
            onClick={() => { setMode('sales'); handleCloseDrawers(); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === 'sales'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sales
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <MapFilters
          mode={mode}
          accounts={data.accounts}
          accountFilter={accountFilter}
          onAccountFilter={setAccountFilter}
          healthFilter={healthFilter}
          onHealthFilter={setHealthFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          searchText={searchText}
          onSearchText={setSearchText}
          sitesCount={filteredFacilities.length}
          prospectsCount={filteredProspects.length}
        />

        {/* Map */}
        <div className="relative flex-1">
          <MapCanvas
            mode={mode}
            facilities={filteredFacilities}
            prospects={filteredProspects}
            quadrants={modeQuadrants}
            orgId={orgId}
            onSelectSite={setSelectedSite}
            onSelectProspect={setSelectedProspect}
            onQuadrantCreated={handleQuadrantCreated}
          />
        </div>

        {/* Right drawer */}
        {selectedSite && (
          <SiteDrawer site={selectedSite} onClose={() => setSelectedSite(null)} />
        )}
        {selectedProspect && (
          <ProspectDrawer prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />
        )}
      </div>
    </div>
  );
}
