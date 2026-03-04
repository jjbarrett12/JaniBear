'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { createClient } from '@/lib/supabase/client';
import type { MapMode, Quadrant } from '@/types/territory-map';

interface Props {
  mode: MapMode;
  orgId: string;
  onQuadrantCreated: (q: Quadrant) => void;
}

export function QuadrantDrawControls({ mode, orgId, onQuadrantCreated }: Props) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnItemsRef = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polygon: { allowIntersection: false, showArea: true },
        rectangle: {},
      },
      edit: { featureGroup: drawnItems, remove: false, edit: false },
    });

    map.addControl(drawControl);
    drawControlRef.current = drawControl;

    const handleCreated = async (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer;
      const geojson = (layer as L.Polygon).toGeoJSON().geometry;

      const name = window.prompt('Quadrant name:');
      if (!name?.trim()) return;

      setSaving(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('quadrants')
          .insert({
            org_id: orgId,
            mode,
            name: name.trim(),
            geojson,
            color: randomColor(),
          })
          .select()
          .single();

        if (error) {
          console.error('Failed to save quadrant:', error);
          alert('Failed to save quadrant');
          return;
        }

        onQuadrantCreated(data as Quadrant);
      } finally {
        setSaving(false);
      }
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, mode, orgId, onQuadrantCreated]);

  if (saving) {
    return (
      <div className="absolute right-2 top-2 z-[1000] rounded-md bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-md border border-border">
        Saving…
      </div>
    );
  }

  return null;
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
let colorIdx = 0;
function randomColor() {
  return COLORS[colorIdx++ % COLORS.length];
}
