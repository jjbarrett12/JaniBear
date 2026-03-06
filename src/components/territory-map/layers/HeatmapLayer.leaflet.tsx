'use client';

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import type L from 'leaflet';
import { filterPointsByBounds } from '@/lib/maps/filterPointsByBounds';
import type { LeadPoint } from '@/types/territory-map';
import type { AccountPoint } from '@/types/territory-map';

const GRID_COLS = 48;
const GRID_ROWS = 36;
const BOUNDS_THROTTLE_MS = 200;
const INTENSITY_OPACITY = { low: 0.45, med: 0.65, high: 0.85 } as const;
const INTENSITY_RADIUS = { low: 0.8, med: 1, high: 1.2 } as const; // cell radius multiplier

export type HeatmapVariant = 'sales' | 'ops';

export interface HeatmapLayerLeafletProps {
  /** Sales: lead points with weight. Ops: account points with weight. */
  points: LeadPoint[] | AccountPoint[];
  variant: HeatmapVariant;
  /** Only include points with weight >= threshold (0–100). */
  threshold: number;
  /** low / med / high -> opacity and cell radius. */
  intensity: 'low' | 'med' | 'high';
}

function getGridWeights(
  points: { lat: number; lng: number; weight: number }[],
  bounds: L.LatLngBounds,
  cols: number,
  rows: number
): { i: number; j: number; weight: number }[] {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const minLat = sw.lat;
  const maxLat = ne.lat;
  const minLng = sw.lng;
  const maxLng = ne.lng;
  const latSpan = maxLat - minLat || 0.001;
  const lngSpan = maxLng - minLng || 0.001;

  const grid = new Map<string, number>();
  for (const p of points) {
    const j = Math.min(cols - 1, Math.max(0, Math.floor(((p.lat - minLat) / latSpan) * rows)));
    const i = Math.min(rows - 1, Math.max(0, Math.floor(((p.lng - minLng) / lngSpan) * cols)));
    const key = `${i},${j}`;
    grid.set(key, (grid.get(key) ?? 0) + p.weight);
  }

  const maxW = Math.max(1, ...grid.values());
  return Array.from(grid.entries()).map(([key, w]) => {
    const [i, j] = key.split(',').map(Number);
    return { i, j, weight: w / maxW };
  });
}

/** Heat color: gradient from transparent blue to red (ops) or yellow-orange (sales). */
function heatColor(normalized: number, variant: HeatmapVariant): string {
  const t = Math.max(0, Math.min(1, normalized));
  if (variant === 'sales') {
    const r = Math.round(255);
    const g = Math.round(255 - t * 180);
    const b = Math.round(100 - t * 100);
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(80 + t * 175);
  const g = Math.round(80 + t * 50);
  const b = Math.round(200 - t * 200);
  return `rgb(${r},${g},${b})`;
}

export function HeatmapLayerLeaflet({
  points,
  variant,
  threshold,
  intensity,
}: HeatmapLayerLeafletProps) {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const throttleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(() => map.getBounds());

  const updateBounds = useCallback(() => {
    setBounds(map.getBounds());
  }, [map]);

  useEffect(() => {
    const onMove = () => {
      if (throttleRef.current) return;
      throttleRef.current = setTimeout(() => {
        throttleRef.current = null;
        updateBounds();
      }, BOUNDS_THROTTLE_MS);
    };
    map.on('moveend', updateBounds);
    map.on('move', onMove);
    setBounds(map.getBounds());
    return () => {
      map.off('moveend', updateBounds);
      map.off('move', onMove);
      if (throttleRef.current) clearTimeout(throttleRef.current);
    };
  }, [map, updateBounds]);

  const filtered = useMemo(
    () => filterPointsByBounds(points, bounds, threshold),
    [points, bounds, threshold]
  );

  const gridCells = useMemo(() => {
    if (!bounds || filtered.length === 0) return [];
    return getGridWeights(filtered, bounds, GRID_COLS, GRID_ROWS);
  }, [bounds, filtered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !map || gridCells.length === 0) return;

    const mapContainer = map.getContainer();
    const size = mapContainer.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio ?? 1 : 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    const b = map.getBounds();
    const sw = map.latLngToContainerPoint(b.getSouthWest());
    const ne = map.latLngToContainerPoint(b.getNorthEast());
    const left = sw.x;
    const top = ne.y;
    const width = ne.x - sw.x;
    const height = sw.y - ne.y;
    const cellW = width / GRID_COLS;
    const cellH = height / GRID_ROWS;
    const radiusMult = INTENSITY_RADIUS[intensity];
    const radW = (cellW * radiusMult) / 2;
    const radH = (cellH * radiusMult) / 2;
    const opacity = INTENSITY_OPACITY[intensity];

    ctx.clearRect(0, 0, size.width, size.height);
    for (const { i, j, weight } of gridCells) {
      const x = left + (i + 0.5) * cellW;
      const y = top + (j + 0.5) * cellH;
      ctx.fillStyle = heatColor(weight, variant);
      ctx.globalAlpha = weight * opacity;
      ctx.beginPath();
      ctx.ellipse(x, y, radW, radH, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [map, gridCells, intensity, variant]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[400]"
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        className="absolute left-0 top-0 h-full w-full"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}
