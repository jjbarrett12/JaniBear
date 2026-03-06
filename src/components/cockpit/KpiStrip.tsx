'use client';

import React from 'react';
import { KpiTile } from './KpiTile';
import type { CockpitKpis, CockpitKpiItem } from '@/lib/cockpit-data';
import {
  Building2,
  Users,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  DollarSign,
} from 'lucide-react';

const ORDER: (keyof Omit<CockpitKpis, 'attentionCount'>)[] = [
  'buildingsScheduledToday',
  'crewActiveRequired',
  'inspectionsDueToday',
  'accountsBelowHealth',
  'slaBreaches',
  'revenueScheduledToday',
];

const ICON_BY_ID: Record<string, React.ComponentType<{ className?: string }>> = {
  buildings_today: Building2,
  crew_today: Users,
  inspections_today: ClipboardCheck,
  health_below: Activity,
  sla_breaches: AlertTriangle,
  revenue_today: DollarSign,
};

export interface KpiStripProps {
  kpis: CockpitKpis;
  onKpiClick?: (id: string) => void;
}

export function KpiStrip({ kpis, onKpiClick }: KpiStripProps) {
  const items = ORDER.map((key) => kpis[key]).filter(Boolean) as CockpitKpiItem[];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6"
      role="region"
      aria-label="Primary KPIs"
    >
      {items.map((item) => (
        <KpiTile
          key={item.id}
          item={item}
          icon={ICON_BY_ID[item.id]}
          onClick={onKpiClick ? () => onKpiClick(item.id) : undefined}
        />
      ))}
    </div>
  );
}
