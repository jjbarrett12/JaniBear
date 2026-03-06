'use client';

import { MapPin, Building2, Users, Store, Layers, Map, MapPinned } from 'lucide-react';
import type { UnifiedLayerId } from './UnifiedLayerToggles';

export type WarMapLayerId = UnifiedLayerId;

const LAYERS: { id: WarMapLayerId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'leads', label: 'Leads', icon: MapPin },
  { id: 'accounts', label: 'Accounts', icon: Building2 },
  { id: 'crews', label: 'Crews', icon: Users },
  { id: 'franchisees', label: 'Franchisees', icon: Store },
  { id: 'territories', label: 'Territories', icon: Layers },
  { id: 'service_areas', label: 'Service Areas', icon: Map },
  { id: 'coverage', label: 'Coverage', icon: MapPinned },
];

interface Props {
  enabled: Set<WarMapLayerId>;
  onToggle: (id: WarMapLayerId, enabled: boolean) => void;
}

export function MapLayerChips({ enabled, onToggle }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {LAYERS.map(({ id, label, icon: Icon }) => {
        const isOn = enabled.has(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onToggle(id, !isOn)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isOn
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:border-white/15 hover:text-zinc-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
