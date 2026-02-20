'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QuadrantDrawControls } from './QuadrantDrawControls';
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
// FitBounds helper
// ---------------------------------------------------------------------------
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 1) {
      try {
        map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
      } catch {
        /* ignore */
      }
    }
  }, [map, points]);
  return null;
}

// ---------------------------------------------------------------------------
// MapCanvas
// ---------------------------------------------------------------------------
interface Props {
  mode: MapMode;
  facilities: FacilityWithHealth[];
  prospects: Prospect[];
  quadrants: Quadrant[];
  orgId: string;
  onSelectSite: (s: FacilityWithHealth) => void;
  onSelectProspect: (p: Prospect) => void;
  onQuadrantCreated: (q: Quadrant) => void;
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
}: Props) {
  const allPoints = useMemo<[number, number][]>(() => {
    if (mode === 'ops') return facilities.map((f) => [f.latitude, f.longitude]);
    return prospects.map((p) => [p.lat, p.lng]);
  }, [mode, facilities, prospects]);

  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {allPoints.length > 0 && <FitBounds points={allPoints} />}

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
