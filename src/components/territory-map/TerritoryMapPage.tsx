'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { MapFilters } from './MapFilters';
import { SiteDrawer } from './SiteDrawer';
import { ProspectDrawer } from './ProspectDrawer';
import { MapShell } from './MapShell';
import { LayerToggleCluster, readLayersFromStorage, parseLayersFromSearchParams, layersToSearchParams } from './LayerToggleCluster';
import { HeatLayerLegend } from './HeatLayerLegend';
import { BuildingIntelCard } from './BuildingIntelCard';
import { PinsListPanel } from './PinsListPanel';
import type {
  TerritoryMapPayload,
  MapMode,
  FacilityWithHealth,
  Prospect,
  Quadrant,
} from '@/types/territory-map';
import type { MapPin } from '@/lib/sales/territory/types';
import type { LayerId } from '@/lib/sales/territory/salesTerritoryConfig';
import { TERRITORY_WAR_LAYERS_ENABLED, BUILDING_INTEL_CARD_ENABLED } from '@/lib/sales/territory/feature-flags';
import { getBuildingIntel } from '@/lib/sales/territory/fetchers';
import type { BuildingIntel } from '@/lib/sales/territory/types';
import { getSavedMapView } from '@/lib/territory-map-view-storage';

const MapCanvas = dynamic(() => import('./MapCanvas').then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
      Loading map…
    </div>
  ),
});

function prospectsToMapPins(prospects: Prospect[]): MapPin[] {
  return prospects.map((p) => ({
    id: p.id,
    name: p.name ?? 'Unknown',
    lat: p.lat,
    lng: p.lng,
    type: 'prospect',
    stage: p.status,
    zip: p.postal ?? null,
    sqft: null,
    estValueMonthly: null,
  }));
}

function facilitiesToMapPins(facilities: FacilityWithHealth[]): MapPin[] {
  return facilities.map((f) => ({
    id: f.id,
    name: f.name,
    lat: f.latitude,
    lng: f.longitude,
    type: 'client',
    zip: f.zip ?? null,
    sqft: null,
    estValueMonthly: null,
  }));
}

interface Props {
  data: TerritoryMapPayload;
  orgId: string;
  initialMode?: MapMode;
}

export function TerritoryMapPage({ data, orgId, initialMode = 'ops' }: Props) {
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [selectedSite, setSelectedSite] = useState<FacilityWithHealth | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [enabledLayerIds, setEnabledLayerIds] = useState<LayerId[]>([]);
  const [buildingIntel, setBuildingIntel] = useState<BuildingIntel | null>(null);
  const [intelLoading, setIntelLoading] = useState(false);

  // Restore map view from localStorage so zoom/position persist when returning to the page
  const [savedMapView] = useState(() => (typeof window !== 'undefined' ? getSavedMapView(orgId) : null));

  // Filters
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [fitToPinsTrigger, setFitToPinsTrigger] = useState(0);

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
          f.address_line1?.toLowerCase().includes(q) ||
          f.city?.toLowerCase().includes(q) ||
          f.state?.toLowerCase().includes(q) ||
          f.zip?.toLowerCase().includes(q)
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
          p.city?.toLowerCase().includes(q) ||
          p.state?.toLowerCase().includes(q) ||
          p.postal?.toLowerCase().includes(q) ||
          p.industry?.toLowerCase().includes(q)
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
    setBuildingIntel(null);
  }, []);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = parseLayersFromSearchParams(params);
    if (fromUrl.length > 0) {
      setEnabledLayerIds(fromUrl);
      return;
    }
    setEnabledLayerIds(readLayersFromStorage(userId));
  }, [userId]);

  useEffect(() => {
    if (!BUILDING_INTEL_CARD_ENABLED || !selectedProspect) {
      setBuildingIntel(null);
      return;
    }
    setIntelLoading(true);
    getBuildingIntel(orgId, selectedProspect.id)
      .then(setBuildingIntel)
      .catch(() => setBuildingIntel(null))
      .finally(() => setIntelLoading(false));
  }, [BUILDING_INTEL_CARD_ENABLED, selectedProspect, orgId]);

  const handleLayerToggle = useCallback((layerId: LayerId, enabled: boolean) => {
    setEnabledLayerIds((prev) => {
      const next = enabled ? [...prev, layerId] : prev.filter((id) => id !== layerId);
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const url = new URL(window.location.href);
        if (next.length) url.searchParams.set('layers', next.join(','));
        else url.searchParams.delete('layers');
        window.history.replaceState({}, '', url.toString());
      }
      return next;
    });
  }, []);

  const warBoardPins = useMemo(() => {
    if (mode === 'sales') return prospectsToMapPins(filteredProspects);
    return facilitiesToMapPins(filteredFacilities);
  }, [mode, filteredProspects, filteredFacilities]);

  const showWarBoard = mode === 'sales' && (TERRITORY_WAR_LAYERS_ENABLED || BUILDING_INTEL_CARD_ENABLED);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-0 overflow-hidden">
      {/* Header with Sales / Operations color toggle */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Map</h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'ops'
              ? 'Map crews, customers, sites, and franchisees'
              : 'Graph areas, territories, and prospects'}
          </p>
        </div>
        <div className="flex items-center gap-0 rounded-lg border border-border bg-muted/50 p-0.5">
          <button
            onClick={() => { setMode('ops'); handleCloseDrawers(); }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'ops'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => { setMode('sales'); handleCloseDrawers(); }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'sales'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
          onZoomToResults={() => setFitToPinsTrigger((t) => t + 1)}
        />

        {/* Map */}
        <div className="relative flex-1 min-w-0">
          <MapShell status="ready" emptyMessage="No pins in view">
<MapCanvas
            mode={mode}
            facilities={filteredFacilities}
            prospects={filteredProspects}
            quadrants={modeQuadrants}
            orgId={orgId}
            onSelectSite={setSelectedSite}
            onSelectProspect={setSelectedProspect}
            onQuadrantCreated={handleQuadrantCreated}
            initialCenter={savedMapView?.center}
            initialZoom={savedMapView?.zoom}
            fitToPinsTrigger={fitToPinsTrigger}
          />
          </MapShell>

          {/* War board: top-right layer toggles */}
          {showWarBoard && TERRITORY_WAR_LAYERS_ENABLED && (
            <div className="absolute top-3 right-3 z-[500]">
              <LayerToggleCluster
                enabledLayerIds={enabledLayerIds}
                onToggle={handleLayerToggle}
                userId={userId}
              />
            </div>
          )}

          {/* War board: heat layer legend when any layer on */}
          {showWarBoard && enabledLayerIds.length > 0 && (
            <div className="absolute bottom-3 left-3 z-[500]">
              <HeatLayerLegend enabledLayerIds={enabledLayerIds} />
            </div>
          )}

          {/* Building Intel Card (floating, when sales + prospect selected) */}
          {showWarBoard && BUILDING_INTEL_CARD_ENABLED && (buildingIntel || intelLoading) && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000] pointer-events-auto">
              {intelLoading ? (
                <div className="rounded-xl border border-white/20 bg-zinc-900/95 px-6 py-4 text-sm text-zinc-400">
                  Loading…
                </div>
              ) : buildingIntel ? (
                <BuildingIntelCard intel={buildingIntel} onClose={handleCloseDrawers} />
              ) : null}
            </div>
          )}
        </div>

        {/* Right: Pins list (war board) or drawers */}
        {showWarBoard ? (
          <PinsListPanel
            pins={warBoardPins}
            selectedPinId={selectedProspect?.id ?? selectedSite?.id ?? null}
            onSelectPin={(pin) => {
              if (pin.type === 'prospect') {
                const p = filteredProspects.find((x) => x.id === pin.id);
                if (p) setSelectedProspect(p);
              } else {
                const f = filteredFacilities.find((x) => x.id === pin.id);
                if (f) setSelectedSite(f);
              }
            }}
          />
        ) : null}

        {/* Right drawer (ops or sales when intel card disabled) */}
        {!showWarBoard && selectedSite && (
          <SiteDrawer site={selectedSite} onClose={() => setSelectedSite(null)} />
        )}
        {!showWarBoard && selectedProspect && (
          <ProspectDrawer prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />
        )}
        {showWarBoard && !BUILDING_INTEL_CARD_ENABLED && selectedProspect && (
          <ProspectDrawer prospect={selectedProspect} onClose={() => setSelectedProspect(null)} />
        )}
      </div>
    </div>
  );
}
