'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { LatLngBounds } from 'leaflet';
import { MapCommandBar } from './MapCommandBar';
import { MapQueuePanel } from './MapQueuePanel';
import { MapIntelDrawer } from './MapIntelDrawer';
import { MapShell } from './MapShell';
import type {
  TerritoryMapPayload,
  MapMode,
  FacilityWithHealth,
  Prospect,
  Quadrant,
  MapEntity,
} from '@/types/territory-map';
import { getDefaultLayersForMode, type UnifiedLayerId } from './UnifiedLayerToggles';
import type { WarMapLayerId } from './MapLayerChips';
import { getSavedMapView } from '@/lib/territory-map-view-storage';

const MapCanvas = dynamic(() => import('./MapCanvas').then((m) => m.MapCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-lg border border-white/10 bg-black/20 text-zinc-400">
      Loading map…
    </div>
  ),
});

interface Props {
  data: TerritoryMapPayload;
  orgId: string;
  initialMode?: MapMode;
}

export function TerritoryMapPage({ data, orgId, initialMode = 'ops' }: Props) {
  const [mode, setMode] = useState<MapMode>(initialMode);
  const [searchText, setSearchText] = useState('');
  const [unifiedLayers, setUnifiedLayers] = useState<Set<UnifiedLayerId>>(() =>
    getDefaultLayersForMode(initialMode)
  );
  const [selectedEntity, setSelectedEntity] = useState<MapEntity | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<FacilityWithHealth | null>(null);
  const [fitToPinsTrigger, setFitToPinsTrigger] = useState(0);
  const [quadrants, setQuadrants] = useState<Quadrant[]>(data.quadrants);
  const [coverageFilter, setCoverageFilter] = useState<'my' | 'all' | 'by_rep'>('my');
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null);
  const [selectedVerticalIds, setSelectedVerticalIds] = useState<Set<string>>(new Set());
  const [showVerticalOwnership, setShowVerticalOwnership] = useState(false);
  const [showRiskLayer, setShowRiskLayer] = useState(false);

  const savedMapView = typeof window !== 'undefined' ? getSavedMapView(orgId) : null;

  const handleBoundsChange = useCallback((bounds: LatLngBounds) => {
    setMapBounds(bounds);
  }, []);

  const modeQuadrants = useMemo(
    () => quadrants.filter((q) => q.mode === mode),
    [quadrants, mode]
  );

  const filteredFacilities = useMemo(() => {
    if (!searchText.trim()) return data.facilities;
    const q = searchText.toLowerCase().trim();
    return data.facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.account_name.toLowerCase().includes(q) ||
        (f.address_line1?.toLowerCase().includes(q)) ||
        (f.city?.toLowerCase().includes(q)) ||
        (f.state?.toLowerCase().includes(q)) ||
        (f.zip?.toLowerCase().includes(q))
    );
  }, [data.facilities, searchText]);

  const filteredProspects = useMemo(() => {
    if (!searchText.trim()) return data.prospects;
    const q = searchText.toLowerCase().trim();
    return data.prospects.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        (p.address1?.toLowerCase().includes(q)) ||
        (p.city?.toLowerCase().includes(q)) ||
        (p.state?.toLowerCase().includes(q)) ||
        (p.postal?.toLowerCase().includes(q)) ||
        (p.industry?.toLowerCase().includes(q))
    );
  }, [data.prospects, searchText]);

  const handleModeChange = useCallback((next: MapMode) => {
    setMode(next);
    setUnifiedLayers(getDefaultLayersForMode(next));
    setSelectedEntity(null);
    setSelectedFacility(null);
  }, []);

  const handleLayerToggle = useCallback((id: WarMapLayerId, enabled: boolean) => {
    setUnifiedLayers((prev) => {
      const next = new Set(prev);
      if (enabled) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleSelectFromQueue = useCallback((entity: MapEntity, facility?: FacilityWithHealth) => {
    setSelectedEntity(entity);
    setSelectedFacility(facility ?? null);
  }, []);

  const handleSelectEntityFromMap = useCallback((entity: MapEntity) => {
    setSelectedEntity(entity);
    if (entity.type === 'account') {
      const fac = data.facilities.find((f) => f.id === entity.id) ?? null;
      setSelectedFacility(fac);
    } else {
      setSelectedFacility(null);
    }
  }, [data.facilities]);

  const handleCloseIntel = useCallback(() => {
    setSelectedEntity(null);
    setSelectedFacility(null);
  }, []);

  const handleQuadrantCreated = useCallback((q: Quadrant) => {
    setQuadrants((prev) => [...prev, q]);
  }, []);

  const flyToTarget = useMemo(
    () => (selectedEntity ? { lat: selectedEntity.lat, lng: selectedEntity.lng } : null),
    [selectedEntity?.id, selectedEntity?.lat, selectedEntity?.lng]
  );

  const handleSelectSite = useCallback((s: FacilityWithHealth) => {
    setSelectedEntity({
      id: s.id,
      name: s.name,
      lat: s.latitude,
      lng: s.longitude,
      type: 'account',
      meta: { account_name: s.account_name },
    });
    setSelectedFacility(s);
  }, []);

  const handleSelectProspect = useCallback((p: Prospect) => {
    setSelectedEntity({
      id: p.id,
      name: p.name ?? 'Prospect',
      lat: p.lat,
      lng: p.lng,
      type: 'lead',
      meta: { status: p.status },
    });
    setSelectedFacility(null);
  }, []);

  const handleZoomToResults = useCallback(() => {
    setFitToPinsTrigger((t) => t + 1);
  }, []);

  const filteredLeads = useMemo(() => {
    const verts = data.verticals ?? [];
    if (selectedVerticalIds.size === 0) return data.leads;
    return data.leads.filter((l) => {
      const vid = l.meta?.vertical_id as string | undefined;
      return vid && selectedVerticalIds.has(vid);
    });
  }, [data.leads, data.verticals, selectedVerticalIds]);

  const verticalColorById = useMemo(() => {
    const verts = data.verticals ?? [];
    const palette = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];
    const out: Record<string, string> = {};
    verts.forEach((v, i) => { out[v.id] = palette[i % palette.length]; });
    return out;
  }, [data.verticals]);

  const unifiedLayersData = useMemo(
    () => ({
      leads: filteredLeads,
      accounts: data.accounts,
      crews: data.crews,
      franchisees: data.franchisees,
      territories: data.territories,
      serviceAreas: data.serviceAreas,
    }),
    [filteredLeads, data.accounts, data.crews, data.franchisees, data.territories, data.serviceAreas]
  );

  const handleVerticalFilterToggle = useCallback((verticalId: string, selected: boolean) => {
    setSelectedVerticalIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(verticalId);
      else next.delete(verticalId);
      return next;
    });
  }, []);

  const hasSearchResults = (filteredFacilities.length + filteredProspects.length) > 0;
  const showZoomToResults = searchText.trim().length > 0 && hasSearchResults;

  return (
    <div className="-m-4 md:-m-6 lg:-m-8 flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-[#0a0a0f] min-h-[calc(100vh-4rem)] w-[calc(100%+2rem)] md:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] max-w-none">
      <MapCommandBar
        mode={mode}
        onModeChange={handleModeChange}
        searchValue={searchText}
        onSearchChange={setSearchText}
        layerIds={unifiedLayers}
        onLayerToggle={handleLayerToggle}
        coverageFilter={coverageFilter}
        onCoverageFilterChange={setCoverageFilter}
        showCoverageFilter={data.coverageAreas.length > 0 && unifiedLayers.has('coverage')}
        coverageAdmin={data.coverageAdmin ?? false}
        onZoomToResults={showZoomToResults ? handleZoomToResults : undefined}
        verticals={data.verticals ?? []}
        selectedVerticalIds={selectedVerticalIds}
        onVerticalFilterToggle={handleVerticalFilterToggle}
        showVerticalOwnership={showVerticalOwnership}
        onShowVerticalOwnershipChange={setShowVerticalOwnership}
        showRiskLayer={showRiskLayer}
        onShowRiskLayerChange={setShowRiskLayer}
      />

      <div className="flex flex-1 min-h-0">
        <MapQueuePanel
          mode={mode}
          data={data}
          selectedId={selectedEntity?.id ?? null}
          onSelect={handleSelectFromQueue}
          searchText={searchText}
          mapBounds={mapBounds}
        />

        <div className="relative flex-1 min-w-0">
          <MapShell status="ready" emptyMessage="No pins in view">
            <MapCanvas
              mode={mode}
              facilities={filteredFacilities}
              prospects={filteredProspects}
              quadrants={modeQuadrants}
              orgId={orgId}
              onSelectSite={handleSelectSite}
              onSelectProspect={handleSelectProspect}
              onQuadrantCreated={handleQuadrantCreated}
              initialCenter={savedMapView?.center}
              initialZoom={savedMapView?.zoom}
              fitToPinsTrigger={fitToPinsTrigger}
              unifiedLayersVisible={unifiedLayers}
              unifiedLayersData={unifiedLayersData}
              onSelectEntity={handleSelectEntityFromMap}
              heatmapLeads={data.heatmapLeads}
              heatmapAccounts={data.heatmapAccounts}
              flyToTarget={flyToTarget}
              coverageAreas={data.coverageAreas}
              coverageFilter={coverageFilter}
              myCoverageAreaIds={data.myCoverageAreaIds ?? []}
              onBoundsChange={handleBoundsChange}
              showVerticalOwnership={showVerticalOwnership}
              verticalColorById={verticalColorById}
              showRiskLayer={showRiskLayer}
              coverageGaps={data.coverageGaps ?? []}
            />
          </MapShell>
        </div>

        <MapIntelDrawer
          entity={selectedEntity}
          facility={selectedFacility}
          orgId={orgId}
          onClose={handleCloseIntel}
        />
      </div>
    </div>
  );
}
