'use client';

import { MapPin, Building2, Users, Store, Layers, MapPinned } from 'lucide-react';

export type UnifiedLayerId = 'leads' | 'accounts' | 'crews' | 'franchisees' | 'territories' | 'service_areas' | 'coverage';

const LAYERS: { id: UnifiedLayerId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'leads', label: 'Leads', icon: MapPin },
  { id: 'accounts', label: 'Accounts', icon: Building2 },
  { id: 'crews', label: 'Crews', icon: Users },
  { id: 'franchisees', label: 'Franchisees', icon: Store },
  { id: 'territories', label: 'Territories', icon: Layers },
  { id: 'service_areas', label: 'Service Areas', icon: Layers },
  { id: 'coverage', label: 'Coverage', icon: MapPinned },
];

interface Props {
  enabled: Set<UnifiedLayerId>;
  onToggle: (id: UnifiedLayerId, enabled: boolean) => void;
  mode: 'sales' | 'ops';
}

export function UnifiedLayerToggles({ enabled, onToggle, mode }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <span className="text-xs font-medium text-muted-foreground">Layers</span>
      {LAYERS.map(({ id, label, icon: Icon }) => {
        const isOn = enabled.has(id);
        return (
          <label key={id} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isOn}
              onChange={(e) => onToggle(id, e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}

export function getDefaultLayersForMode(mode: 'sales' | 'ops'): Set<UnifiedLayerId> {
  if (mode === 'sales') {
    return new Set<UnifiedLayerId>(['leads', 'territories']);
  }
  return new Set<UnifiedLayerId>(['accounts', 'crews', 'franchisees', 'territories']);
}
