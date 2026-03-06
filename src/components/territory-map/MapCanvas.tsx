'use client';

import { useEffect, useMemo, useRef, useState, useCallback, memo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QuadrantDrawControls } from './QuadrantDrawControls';
import { setSavedMapView } from '@/lib/territory-map-view-storage';
import type {
  MapMode,
  FacilityWithHealth,
  Prospect,
  Quadrant,
  HealthStatus,
  ProspectStatus,
  MapEntity,
  MapEntityType,
  TerritoryPolygon,
} from '@/types/territory-map';
import type { UnifiedLayerId } from './UnifiedLayerToggles';
import { HeatmapLayerLeaflet } from './layers/HeatmapLayer.leaflet';
import type { LeadPoint, AccountPoint, CoverageArea } from '@/types/territory-map';
import type { HeatmapSettings } from './HeatmapToggles';

// ---------------------------------------------------------------------------
// Marker icons: premium dot with ring, optional pulse for high priority
// ---------------------------------------------------------------------------
const ICON_CACHE = new Map<string, L.DivIcon>();

function coloredIcon(color: string): L.DivIcon {
  if (ICON_CACHE.has(color)) return ICON_CACHE.get(color)!;
  const icon = L.divIcon({
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>`,
  });
  ICON_CACHE.set(color, icon);
  return icon;
}

/** Premium war-map style: rounded badge with ring, optional pulse */
function premiumMarkerIcon(color: string, pulse = false): L.DivIcon {
  const key = `pm-${color}-${pulse}`;
  if (ICON_CACHE.has(key)) return ICON_CACHE.get(key)!;
  const pulseSpan = pulse
    ? `<span class="premium-marker-pulse" style="position:absolute;width:18px;height:18px;border-radius:50%;background:${color};opacity:0.4;"></span>`
    : '';
  const icon = L.divIcon({
    className: 'premium-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="position:relative;width:20px;height:20px;display:flex;align-items:center;justify-content:center">${pulseSpan}<span style="position:relative;width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span></div>`,
  });
  ICON_CACHE.set(key, icon);
  return icon;
}

const healthIconColors: Record<HealthStatus, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const riskLevelColors: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f59e0b',
  critical: '#ef4444',
};

const prospectIconColors: Record<ProspectStatus, string> = {
  uncontacted: '#9ca3af',
  contacted: '#3b82f6',
  proposal_sent: '#f59e0b',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

/** Unified map entity marker colors: Leads=yellow, Accounts=blue, Crews=green, Franchisees=purple */
const entityTypeColors: Record<MapEntityType, string> = {
  lead: '#eab308',
  account: '#3b82f6',
  crew: '#22c55e',
  franchisee: '#a855f7',
  territory: '#6b7280',
  service_area: '#6b7280',
};

/** Operator (crew/franchisee) color by performance: green >= 70, yellow 50-69, red < 50 */
function operatorColorByScore(score: number | undefined | null): string {
  if (score == null) return entityTypeColors.crew;
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#ef4444';
}

// ---------------------------------------------------------------------------
// FitBounds helper (only when no saved view is being restored)
// ---------------------------------------------------------------------------
function FitBounds({ points, skip }: { points: [number, number][]; skip: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (skip || points.length < 1) return;
    try {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
    } catch {
      /* ignore */
    }
  }, [map, points, skip]);
  return null;
}

// ---------------------------------------------------------------------------
// Fit map to given points when trigger value changes (e.g. "Zoom to results")
// ---------------------------------------------------------------------------
function FitToPinsOnTrigger({ points, trigger }: { points: [number, number][]; trigger: number }) {
  const map = useMap();
  const prevTrigger = useRef(trigger);
  useEffect(() => {
    if (trigger !== prevTrigger.current && trigger > 0 && points.length > 0) {
      prevTrigger.current = trigger;
      try {
        map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
      } catch {
        /* ignore */
      }
    }
  }, [map, points, trigger]);
  return null;
}

// ---------------------------------------------------------------------------
// Fly to target when selection changes (e.g. queue row click)
// ---------------------------------------------------------------------------
function FlyToTarget({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lng], 14, { duration: 0.5 });
  }, [map, target?.lat, target?.lng]);
  return null;
}

// ---------------------------------------------------------------------------
// Persist map view on move/zoom so it restores when user returns
// ---------------------------------------------------------------------------
function MapViewPersist({ orgId }: { orgId: string }) {
  const map = useMap();
  const savingRef = useRef(false);
  useEffect(() => {
    const save = () => {
      if (savingRef.current) return;
      savingRef.current = true;
      try {
        const center = map.getCenter();
        const zoom = map.getZoom();
        setSavedMapView(orgId, { center: [center.lat, center.lng], zoom });
      } finally {
        savingRef.current = false;
      }
    };
    map.on('moveend', save);
    map.on('zoomend', save);
    return () => {
      map.off('moveend', save);
      map.off('zoomend', save);
    };
  }, [map, orgId]);
  return null;
}

// ---------------------------------------------------------------------------
// Report map bounds (debounced) for queue filtering and viewport culling
// ---------------------------------------------------------------------------
const BOUNDS_DEBOUNCE_MS = 200;

function BoundsReporter({ onBoundsChange }: { onBoundsChange: (bounds: L.LatLngBounds) => void }) {
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const report = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      try {
        onBoundsChange(map.getBounds());
      } catch {
        /* ignore */
      }
    }, BOUNDS_DEBOUNCE_MS);
  }, [map, onBoundsChange]);

  useMapEvents({
    moveend: report,
    zoomend: report,
  });

  useEffect(() => {
    report();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [report]);
  return null;
}

/** True if layer is allowed in the given mode (no cross-role leak). */
function layerAllowedForMode(layerId: UnifiedLayerId, mode: MapMode): boolean {
  if (layerId === 'territories' || layerId === 'service_areas' || layerId === 'coverage') return true;
  if (mode === 'sales') return layerId === 'leads';
  return layerId === 'accounts' || layerId === 'crews' || layerId === 'franchisees';
}

/** Filter entities to those inside bounds when bounds exist; avoids thrashing by using stable identity. */
function filterByBounds<T extends { lat: number; lng: number }>(items: T[], bounds: L.LatLngBounds | null): T[] {
  if (!bounds || items.length <= 200) return items;
  return items.filter((item) => bounds.contains([item.lat, item.lng]));
}

// ---------------------------------------------------------------------------
// MapCanvas
// ---------------------------------------------------------------------------
const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

export interface UnifiedLayersData {
  leads?: MapEntity[];
  accounts?: MapEntity[];
  crews?: MapEntity[];
  franchisees?: MapEntity[];
  territories?: TerritoryPolygon[];
  serviceAreas?: TerritoryPolygon[];
}

interface Props {
  mode: MapMode;
  facilities: FacilityWithHealth[];
  prospects: Prospect[];
  quadrants: Quadrant[];
  orgId: string;
  onSelectSite: (s: FacilityWithHealth) => void;
  onSelectProspect: (p: Prospect) => void;
  onQuadrantCreated: (q: Quadrant) => void;
  /** When set, map uses this view instead of fitting to pins (restore from localStorage). */
  initialCenter?: [number, number];
  initialZoom?: number;
  /** Increment to trigger fitBounds to current facilities+prospects (e.g. "Zoom to results"). */
  fitToPinsTrigger?: number;
  /** Unified map layers: visibility and data. When set, draws leads/accounts/crews/franchisees/territories/serviceAreas. */
  unifiedLayersVisible?: Set<UnifiedLayerId>;
  unifiedLayersData?: UnifiedLayersData;
  onSelectEntity?: (e: MapEntity) => void;
  /** Heatmap: Sales (lead density) and Ops (account risk). */
  heatmapSalesOn?: boolean;
  heatmapOpsOn?: boolean;
  heatmapSettings?: HeatmapSettings;
  heatmapLeads?: LeadPoint[];
  heatmapAccounts?: AccountPoint[];
  /** When set, map flies to this position (e.g. when selecting from queue). */
  flyToTarget?: { lat: number; lng: number } | null;
  /** Coverage areas (rep/ops splits); filter by coverageFilter. */
  coverageAreas?: CoverageArea[];
  coverageFilter?: 'my' | 'all' | 'by_rep';
  myCoverageAreaIds?: string[];
  /** Called when map bounds change (debounced). Use for bounds-based queue filtering. */
  onBoundsChange?: (bounds: L.LatLngBounds) => void;
  /** When true, color lead markers by vertical (Sales). */
  showVerticalOwnership?: boolean;
  /** Map vertical_id -> hex color for lead markers when showVerticalOwnership. */
  verticalColorById?: Record<string, string>;
  /** When true (Ops), color facility pins by account risk level instead of health. */
  showRiskLayer?: boolean;
  /** Ops: coverage gap markers (shift coverage needed). */
  coverageGaps?: { id: string; lat: number; lng: number; account_name: string; start_time: string; end_time: string }[];
}

function MapCanvasInner({
  mode,
  facilities,
  prospects,
  quadrants,
  orgId,
  onSelectSite,
  onSelectProspect,
  onQuadrantCreated,
  initialCenter,
  initialZoom,
  fitToPinsTrigger = 0,
  unifiedLayersVisible,
  unifiedLayersData,
  onSelectEntity,
  heatmapSalesOn = false,
  heatmapOpsOn = false,
  heatmapSettings,
  heatmapLeads = [],
  heatmapAccounts = [],
  flyToTarget = null,
  coverageAreas = [],
  coverageFilter = 'my',
  myCoverageAreaIds = [],
  onBoundsChange,
  showVerticalOwnership,
  verticalColorById,
  showRiskLayer = false,
  coverageGaps = [],
}: Props) {
  const unified = unifiedLayersData ?? {};
  const visible = unifiedLayersVisible ?? new Set<UnifiedLayerId>();
  const heatSettings = heatmapSettings ?? { intensity: 'med', threshold: 25, showPinsOnTop: true };
  const showSalesHeat = heatmapSalesOn && mode === 'sales' && heatmapLeads.length > 0;
  const showOpsHeat = heatmapOpsOn && mode === 'ops' && heatmapAccounts.length > 0;

  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const handleBoundsChange = useCallback(
    (b: L.LatLngBounds) => {
      setBounds(b);
      onBoundsChange?.(b);
    },
    [onBoundsChange]
  );
  const reportBounds = useViewportCulling || !!onBoundsChange;

  const allPoints = useMemo<[number, number][]>(() => {
    const fromFacilities = facilities.map((f) => [f.latitude, f.longitude] as [number, number]);
    const fromProspects = prospects.map((p) => [p.lat, p.lng] as [number, number]);
    const fromLeads = visible.has('leads') ? (unified.leads ?? []).map((e) => [e.lat, e.lng] as [number, number]) : [];
    const fromAccounts = visible.has('accounts') ? (unified.accounts ?? []).map((e) => [e.lat, e.lng] as [number, number]) : [];
    const fromCrews = visible.has('crews') ? (unified.crews ?? []).map((e) => [e.lat, e.lng] as [number, number]) : [];
    const fromFranchisees = visible.has('franchisees') ? (unified.franchisees ?? []).map((e) => [e.lat, e.lng] as [number, number]) : [];
    return [...fromFacilities, ...fromProspects, ...fromLeads, ...fromAccounts, ...fromCrews, ...fromFranchisees];
  }, [mode, facilities, prospects, visible, unified]);

  const allPointsForZoom = useMemo<[number, number][]>(() => {
    const fromFacilities = facilities.map((f) => [f.latitude, f.longitude] as [number, number]);
    const fromProspects = prospects.map((p) => [p.lat, p.lng] as [number, number]);
    const fromUnified = [...(unified.leads ?? []), ...(unified.accounts ?? []), ...(unified.crews ?? []), ...(unified.franchisees ?? [])].map((e) => [e.lat, e.lng] as [number, number]);
    return [...fromFacilities, ...fromProspects, ...fromUnified];
  }, [facilities, prospects, unified]);

  const totalMarkerCount = useMemo(() => {
    let n = facilities.length + prospects.length;
    if (visible.has('leads') && layerAllowedForMode('leads', mode)) n += (unified.leads ?? []).length;
    if (visible.has('accounts') && layerAllowedForMode('accounts', mode)) n += (unified.accounts ?? []).length;
    if (visible.has('crews') && layerAllowedForMode('crews', mode)) n += (unified.crews ?? []).length;
    if (visible.has('franchisees') && layerAllowedForMode('franchisees', mode)) n += (unified.franchisees ?? []).length;
    return n;
  }, [facilities.length, prospects.length, visible, unified, mode]);

  const useViewportCulling = totalMarkerCount > 200;
  const leadsInView = useMemo(
    () => (visible.has('leads') && layerAllowedForMode('leads', mode) ? filterByBounds(unified.leads ?? [], useViewportCulling ? bounds : null) : []),
    [visible, mode, unified.leads, useViewportCulling, bounds]
  );
  const accountsInView = useMemo(
    () => (visible.has('accounts') && layerAllowedForMode('accounts', mode) ? filterByBounds(unified.accounts ?? [], useViewportCulling ? bounds : null) : []),
    [visible, mode, unified.accounts, useViewportCulling, bounds]
  );
  const crewsInView = useMemo(
    () => (visible.has('crews') && layerAllowedForMode('crews', mode) ? filterByBounds(unified.crews ?? [], useViewportCulling ? bounds : null) : []),
    [visible, mode, unified.crews, useViewportCulling, bounds]
  );
  const franchiseesInView = useMemo(
    () => (visible.has('franchisees') && layerAllowedForMode('franchisees', mode) ? filterByBounds(unified.franchisees ?? [], useViewportCulling ? bounds : null) : []),
    [visible, mode, unified.franchisees, useViewportCulling, bounds]
  );
  const facilitiesInView = useMemo(() => {
    if (mode !== 'ops') return [];
    if (!useViewportCulling || !bounds) return facilities;
    return facilities.filter((f) => bounds.contains([f.latitude, f.longitude]));
  }, [mode, facilities, useViewportCulling, bounds]);
  const prospectsInView = useMemo(
    () => (mode === 'sales' ? filterByBounds(prospects, useViewportCulling ? bounds : null) : []),
    [mode, prospects, useViewportCulling, bounds]
  );

  const center = useMemo(() => initialCenter ?? DEFAULT_CENTER, [initialCenter]);
  const zoom = useMemo(() => initialZoom ?? DEFAULT_ZOOM, [initialZoom]);
  const hasSavedView = initialCenter != null && initialZoom != null;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {allPoints.length > 0 && <FitBounds points={allPoints} skip={hasSavedView} />}
      <FitToPinsOnTrigger points={allPointsForZoom} trigger={fitToPinsTrigger} />
      <FlyToTarget target={flyToTarget} />
      <MapViewPersist orgId={orgId} />
      {reportBounds && <BoundsReporter onBoundsChange={handleBoundsChange} />}

      {/* Heatmap (below pins when showPinsOnTop) */}
      {heatSettings.showPinsOnTop && showSalesHeat && (
        <HeatmapLayerLeaflet
          points={heatmapLeads}
          variant="sales"
          threshold={heatSettings.threshold}
          intensity={heatSettings.intensity}
        />
      )}
      {heatSettings.showPinsOnTop && showOpsHeat && (
        <HeatmapLayerLeaflet
          points={heatmapAccounts}
          variant="ops"
          threshold={heatSettings.threshold}
          intensity={heatSettings.intensity}
        />
      )}

      {/* Quadrant overlays (legacy) */}
      {quadrants.map((q) => (
        <GeoJSON
          key={q.id}
          data={q.geojson as GeoJSON.GeoJsonObject}
          style={{
            color: q.color ?? '#3b82f6',
            weight: 2,
            fillOpacity: 0.12,
          }}
          onEachFeature={(_feature, layer) => {
            layer.bindTooltip(q.name, { sticky: true });
          }}
        />
      ))}

      {/* Unified: Territory polygons (transparent + border) */}
      {visible.has('territories') && (unified.territories ?? []).map((t) => (
        <GeoJSON
          key={`territory-${t.id}`}
          data={t.geojson as GeoJSON.GeoJsonObject}
          style={{
            color: t.color ?? '#6b7280',
            weight: 2,
            fillOpacity: t.fillOpacity ?? 0.12,
          }}
          onEachFeature={(_feature, layer) => {
            layer.bindTooltip(t.name, { sticky: true });
          }}
        />
      ))}

      {/* Unified: Service area polygons (light shaded) */}
      {visible.has('service_areas') && (unified.serviceAreas ?? []).map((s) => (
        <GeoJSON
          key={`service-${s.id}`}
          data={s.geojson as GeoJSON.GeoJsonObject}
          style={{
            color: s.color ?? '#3b82f6',
            weight: 1.5,
            fillOpacity: s.fillOpacity ?? 0.2,
          }}
          onEachFeature={(_feature, layer) => {
            layer.bindTooltip(s.name, { sticky: true });
          }}
        />
      ))}

      {/* Coverage areas (rep/ops splits); filter: my = only my areas, all/by_rep = all */}
      {visible.has('coverage') && coverageAreas.length > 0 &&
        coverageAreas
          .filter((a) => coverageFilter === 'my' ? myCoverageAreaIds.includes(a.id) : true)
          .map((a) => {
            const isMine = myCoverageAreaIds.includes(a.id);
            const label = a.assignments?.length ? `${a.name} (${a.assignments.length})` : a.name;
            return (
              <GeoJSON
                key={`coverage-${a.id}`}
                data={a.geojson as GeoJSON.GeoJsonObject}
                style={{
                  color: isMine ? '#22c55e' : '#6b7280',
                  weight: isMine ? 2.5 : 1.5,
                  fillOpacity: isMine ? 0.25 : 0.1,
                }}
                onEachFeature={(_feature, layer) => {
                  layer.bindTooltip(label, { sticky: true });
                }}
              />
            );
          })}

      {/* Unified: Lead markers (sales only; viewport culled when >200) */}
      {visible.has('leads') && layerAllowedForMode('leads', mode) && leadsInView.map((e) => {
        const leadPoint = heatmapLeads.find((p) => p.id === e.id);
        const pulse = leadPoint?.priority === 'high';
        const verticalId = e.meta?.vertical_id as string | undefined;
        const leadColor = showVerticalOwnership && verticalId && verticalColorById[verticalId]
          ? verticalColorById[verticalId]
          : entityTypeColors.lead;
        return (
          <Marker
            key={`lead-${e.id}`}
            position={[e.lat, e.lng]}
            icon={premiumMarkerIcon(leadColor, pulse)}
            eventHandlers={{ click: () => onSelectEntity?.(e) }}
          >
            <Popup>
              <strong>{e.name}</strong>
              {e.meta?.contact && <div className="text-xs text-gray-500">{String(e.meta.contact)}</div>}
              {e.meta?.status && <div className="text-xs text-gray-500">Status: {String(e.meta.status)}</div>}
            </Popup>
          </Marker>
        );
      })}

      {/* Unified: Account markers (ops only; viewport culled when >200) */}
      {visible.has('accounts') && layerAllowedForMode('accounts', mode) && accountsInView.map((e) => (
        <Marker
          key={`account-${e.id}`}
          position={[e.lat, e.lng]}
          icon={premiumMarkerIcon(entityTypeColors.account)}
          eventHandlers={{ click: () => onSelectEntity?.(e) }}
        >
          <Popup>
            <strong>{e.name}</strong>
            {e.meta?.account_name && <div className="text-xs text-gray-500">{String(e.meta.account_name)}</div>}
          </Popup>
        </Marker>
      ))}

      {/* Unified: Crew markers (ops only; colored by performance when available) */}
      {visible.has('crews') && layerAllowedForMode('crews', mode) && crewsInView.map((e) => {
        const score = e.meta?.total_score as number | undefined;
        const color = operatorColorByScore(score);
        return (
          <Marker
            key={`crew-${e.id}`}
            position={[e.lat, e.lng]}
            icon={premiumMarkerIcon(color)}
            eventHandlers={{ click: () => onSelectEntity?.(e) }}
          >
            <Popup>
              <strong>{e.name}</strong>
              {score != null && <div className="text-xs text-gray-500">Score: {Number(score).toFixed(0)}</div>}
            </Popup>
          </Marker>
        );
      })}

      {/* Unified: Franchisee markers (ops only; colored by performance when available) */}
      {visible.has('franchisees') && layerAllowedForMode('franchisees', mode) && franchiseesInView.map((e) => {
        const score = e.meta?.total_score as number | undefined;
        const color = operatorColorByScore(score);
        return (
          <Marker
            key={`franchisee-${e.id}`}
            position={[e.lat, e.lng]}
            icon={premiumMarkerIcon(color)}
            eventHandlers={{ click: () => onSelectEntity?.(e) }}
          >
            <Popup>
              <strong>{e.name}</strong>
              {score != null && <div className="text-xs text-gray-500">Score: {Number(score).toFixed(0)}</div>}
            </Popup>
          </Marker>
        );
      })}

      {/* Ops mode: facility pins (viewport culled when >200) */}
      {mode === 'ops' &&
        facilitiesInView.map((f) => {
          const facilityColor = showRiskLayer && f.account_risk_level
            ? (riskLevelColors[f.account_risk_level] ?? healthIconColors[f.health_status])
            : healthIconColors[f.health_status];
          return (
            <Marker
              key={f.id}
              position={[f.latitude, f.longitude]}
              icon={coloredIcon(facilityColor)}
              eventHandlers={{ click: () => onSelectSite(f) }}
            >
              <Popup>
                <strong>{f.name}</strong>
                <div className="text-xs text-gray-500">{f.account_name}</div>
                {showRiskLayer && f.account_risk_level && (
                  <div className="text-xs text-gray-500 capitalize mt-0.5">Risk: {f.account_risk_level}</div>
                )}
              </Popup>
            </Marker>
          );
        })}

      {/* Ops mode: coverage gap markers */}
      {mode === 'ops' && coverageGaps.length > 0 && coverageGaps.map((gap) => (
        <Marker
          key={`gap-${gap.id}`}
          position={[gap.lat, gap.lng]}
          icon={coloredIcon('#f59e0b')}
          eventHandlers={{ click: () => {} }}
        >
          <Popup>
            <strong>⚠ Coverage gap</strong>
            <div className="text-xs text-gray-500 mt-0.5">{gap.account_name}</div>
            <div className="text-xs text-gray-500">{gap.start_time} – {gap.end_time}</div>
            <a href="/app/ops" className="text-xs text-primary underline mt-1 inline-block">Assign backup →</a>
          </Popup>
        </Marker>
      ))}

      {/* Sales mode: prospect pins (viewport culled when >200) */}
      {mode === 'sales' &&
        prospectsInView.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={coloredIcon(prospectIconColors[p.status])}
            eventHandlers={{ click: () => onSelectProspect(p) }}
          >
            <Popup>
              <strong>{p.name || 'Unnamed'}</strong>
              {p.address1 && <div className="text-xs text-gray-500">{p.address1}</div>}
            </Popup>
          </Marker>
        ))}

      {/* Draw controls */}
      <QuadrantDrawControls mode={mode} orgId={orgId} onQuadrantCreated={onQuadrantCreated} />

      {/* Heatmap on top of pins when !showPinsOnTop */}
      {!heatSettings.showPinsOnTop && showSalesHeat && (
        <HeatmapLayerLeaflet
          points={heatmapLeads}
          variant="sales"
          threshold={heatSettings.threshold}
          intensity={heatSettings.intensity}
        />
      )}
      {!heatSettings.showPinsOnTop && showOpsHeat && (
        <HeatmapLayerLeaflet
          points={heatmapAccounts}
          variant="ops"
          threshold={heatSettings.threshold}
          intensity={heatSettings.intensity}
        />
      )}
    </MapContainer>
  );
}

export const MapCanvas = memo(MapCanvasInner);
