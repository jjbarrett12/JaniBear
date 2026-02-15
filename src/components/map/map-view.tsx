'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapContent = dynamic(() => import('./map-content'), { ssr: false });

export type MapData =
  | { orgType: 'franchisor'; franchisees: { id: string; name: string; address: string | null; latitude: number | null; longitude: number | null }[] }
  | {
      orgType: 'franchisee' | 'independent';
      locations: { id: string; name: string; address: string | null; latitude: number | null; longitude: number | null }[];
      crewAssignments: { locationId: string; crewName: string }[];
    };

export function MapView() {
  const [data, setData] = useState<MapData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/map/data')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.statusText))))
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-muted-foreground">
        Failed to load map data: {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        Loading map…
      </div>
    );
  }

  return <MapContent data={data} />;
}
