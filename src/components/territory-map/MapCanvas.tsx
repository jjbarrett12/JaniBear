'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
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
} from '@/types/territory-map';

// ---------------------------------------------------------------------------
// Marker icons by color
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

const healthIconColors: Record<HealthStatus, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const prospectIconColors: Record<ProspectStatus, string> = {
  uncontacted: '#9ca3af',
  contacted: '#3b82f6',
  proposal_sent: '#f59e0b',
  closed_won: '#22c55e',
  closed_lost: '#ef4444',
};

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
// MapCanvas
// ---------------------------------------------------------------------------
const DEFAULT_CENTER: [number, number] = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

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
}

export function MapCanvas({
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
}: Props) {
  const allPoints = useMemo<[number, number][]>(() => {
    if (mode === 'ops') return facilities.map((f) => [f.latitude, f.longitude]);
    return prospects.map((p) => [p.lat, p.lng]);
  }, [mode, facilities, prospects]);

  const allPointsForZoom = useMemo<[number, number][]>(() => {
    const fromFacilities = facilities.map((f) => [f.latitude, f.longitude] as [number, number]);
    const fromProspects = prospects.map((p) => [p.lat, p.lng] as [number, number]);
    return [...fromFacilities, ...fromProspects];
  }, [facilities, prospects]);

  const center = initialCenter ?? DEFAULT_CENTER;
  const zoom = initialZoom ?? DEFAULT_ZOOM;
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
      <MapViewPersist orgId={orgId} />

      {/* Quadrant overlays */}
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

      {/* Ops mode: facility pins */}
      {mode === 'ops' &&
        facilities.map((f) => (
          <Marker
            key={f.id}
            position={[f.latitude, f.longitude]}
            icon={coloredIcon(healthIconColors[f.health_status])}
            eventHandlers={{ click: () => onSelectSite(f) }}
          >
            <Popup>
              <strong>{f.name}</strong>
              <div className="text-xs text-gray-500">{f.account_name}</div>
            </Popup>
          </Marker>
        ))}

      {/* Sales mode: prospect pins */}
      {mode === 'sales' &&
        prospects.map((p) => (
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
    </MapContainer>
  );
}
