'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { MapData } from './map-view';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon in Next/React (leaflet uses window)
const defaultIcon = typeof window !== 'undefined'
  ? L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    })
  : null;

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 1) {
      try {
        map.fitBounds(points, { padding: [24, 24], maxZoom: 14 });
      } catch {
        // ignore
      }
    }
  }, [map, points]);
  return null;
}

export default function MapContent({ data }: { data: MapData }) {
  const isFranchisor = data.orgType === 'franchisor';

  const franchiseePins =
    data.orgType === 'franchisor'
      ? data.franchisees.filter((f) => f.latitude != null && f.longitude != null)
      : [];

  const locationPins =
    data.orgType !== 'franchisor'
      ? (data.locations.filter((l) => l.latitude != null && l.longitude != null) as {
          id: string;
          name: string;
          address: string | null;
          latitude: number;
          longitude: number;
        }[])
      : [];

  const crewByLocation =
    data.orgType !== 'franchisor'
      ? (data.crewAssignments as { locationId: string; crewName: string }[]).reduce(
          (acc, a) => {
            if (!acc[a.locationId]) acc[a.locationId] = [];
            acc[a.locationId].push(a.crewName);
            return acc;
          },
          {} as Record<string, string[]>
        )
      : {};

  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    franchiseePins.forEach((f) => pts.push([f.latitude!, f.longitude!]));
    locationPins.forEach((l) => pts.push([l.latitude, l.longitude]));
    return pts;
  }, [franchiseePins, locationPins]);

  const noCoordsCount = isFranchisor
    ? (data.franchisees.length - franchiseePins.length)
    : (data.locations.length - locationPins.length);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border overflow-hidden bg-card" style={{ height: 480 }}>
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
          {isFranchisor &&
            franchiseePins.map((f) => (
              <Marker
                key={f.id}
                position={[f.latitude!, f.longitude!]}
                icon={defaultIcon ?? undefined}
              >
                <Popup>
                  <strong>{f.name}</strong>
                  {f.address && <div className="text-sm text-muted-foreground">{f.address}</div>}
                </Popup>
              </Marker>
            ))}
          {!isFranchisor &&
            locationPins.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={defaultIcon ?? undefined}
              >
                <Popup>
                  <strong>{loc.name}</strong>
                  {loc.address && <div className="text-sm text-muted-foreground">{loc.address}</div>}
                  {(crewByLocation[loc.id]?.length ?? 0) > 0 && (
                    <div className="mt-1 text-sm">
                      Crews: {crewByLocation[loc.id].join(', ')}
                    </div>
                  )}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
      {noCoordsCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {noCoordsCount} {isFranchisor ? 'franchisee' : 'location'}
          {noCoordsCount === 1 ? '' : 's'} without coordinates — add address or lat/lng to show on map.
        </p>
      )}
    </div>
  );
}
