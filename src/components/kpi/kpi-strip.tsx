'use client';

import type { KpiTileData } from '@/lib/kpi-metrics';
import { KpiMetricTile } from './kpi-metric-tile';

interface KpiStripProps {
  tiles: KpiTileData[];
  title?: string;
  /** Grid cols: default responsive 2/4/6 */
  className?: string;
}

export function KpiStrip({ tiles, title, className = '' }: KpiStripProps) {
  return (
    <div className={className || 'space-y-3'}>
      {title && (
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {tiles.map((tile) => (
          <KpiMetricTile key={tile.label} tile={tile} />
        ))}
      </div>
    </div>
  );
}
