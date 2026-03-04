'use client';

import type { MapPin } from '@/lib/sales/territory/types';
import { cn } from '@/lib/utils';

interface Props {
  pins: MapPin[];
  selectedPinId: string | null;
  onSelectPin: (pin: MapPin) => void;
  className?: string;
}

export function PinsListPanel({ pins, selectedPinId, onSelectPin, className }: Props) {
  return (
    <aside
      className={cn(
        'flex w-60 shrink-0 flex-col overflow-y-auto border-l border-border bg-card',
        className
      )}
    >
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Buildings</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pins.length} in view
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1">
        {pins.length === 0 ? (
          <li className="text-sm text-muted-foreground py-4 text-center">No buildings in current bounds</li>
        ) : (
          pins.map((pin) => (
            <li key={pin.id}>
              <button
                type="button"
                onClick={() => onSelectPin(pin)}
                className={cn(
                  'w-full text-left rounded-lg px-3 py-2 text-sm transition-colors',
                  selectedPinId === pin.id
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'text-foreground hover:bg-muted/50 border border-transparent'
                )}
              >
                <span className="font-medium block truncate">{pin.name || 'Unknown'}</span>
                <span className="text-xs text-muted-foreground capitalize">{pin.type}</span>
                {pin.zip && <span className="text-xs text-muted-foreground ml-1"> · {pin.zip}</span>}
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
