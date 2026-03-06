'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Flame, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { MapMode } from '@/types/territory-map';

export type HeatmapIntensity = 'low' | 'med' | 'high';

export interface HeatmapSettings {
  intensity: HeatmapIntensity;
  threshold: number;
  showPinsOnTop: boolean;
}

const DEFAULT_HEATMAP_SETTINGS: HeatmapSettings = {
  intensity: 'med',
  threshold: 25,
  showPinsOnTop: true,
};

interface Props {
  mode: MapMode;
  salesHeatmapOn: boolean;
  opsHeatmapOn: boolean;
  onSalesHeatmapChange: (on: boolean) => void;
  onOpsHeatmapChange: (on: boolean) => void;
  settings: HeatmapSettings;
  onSettingsChange: (s: HeatmapSettings) => void;
}

export function HeatmapToggles({
  mode,
  salesHeatmapOn,
  opsHeatmapOn,
  onSalesHeatmapChange,
  onOpsHeatmapChange,
  settings,
  onSettingsChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  const handleIntensity = useCallback(
    (value: HeatmapIntensity) => {
      onSettingsChange({ ...settings, intensity: value });
    },
    [onSettingsChange, settings]
  );

  const handleThreshold = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseInt(e.target.value, 10);
      if (!Number.isNaN(v)) onSettingsChange({ ...settings, threshold: Math.max(0, Math.min(100, v)) });
    },
    [onSettingsChange, settings]
  );

  const handleShowPinsOnTop = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSettingsChange({ ...settings, showPinsOnTop: e.target.checked });
    },
    [onSettingsChange, settings]
  );

  const salesDisabled = mode !== 'sales';
  const opsDisabled = mode !== 'ops';

  return (
    <div ref={popoverRef} className="relative flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Heatmap</span>
      <button
        type="button"
        onClick={() => !salesDisabled && onSalesHeatmapChange(!salesHeatmapOn)}
        disabled={salesDisabled}
        title={salesDisabled ? 'Switch to Sales mode to enable' : salesHeatmapOn ? 'Turn off Sales heatmap' : 'Turn on Sales heatmap'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
          salesDisabled && 'cursor-not-allowed opacity-50',
          salesHeatmapOn
            ? 'border-amber-500/60 bg-amber-500/20 text-amber-700 dark:text-amber-300'
            : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
        )}
      >
        <Flame className="h-3.5 w-3.5" />
        Sales Heatmap
      </button>
      <button
        type="button"
        onClick={() => !opsDisabled && onOpsHeatmapChange(!opsHeatmapOn)}
        disabled={opsDisabled}
        title={opsDisabled ? 'Switch to Ops mode to enable' : opsHeatmapOn ? 'Turn off Ops heatmap' : 'Turn on Ops heatmap'}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
          opsDisabled && 'cursor-not-allowed opacity-50',
          opsHeatmapOn
            ? 'border-rose-500/60 bg-rose-500/20 text-rose-700 dark:text-rose-300'
            : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'
        )}
      >
        <Flame className="h-3.5 w-3.5" />
        Ops Heatmap
      </button>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Heatmap settings"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        >
          <Settings2 className="h-4 w-4" />
        </Button>
        {open && (
          <div
            className="absolute right-0 top-full z-[600] mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Intensity</Label>
                <div className="mt-1.5 flex gap-1">
                  {(['low', 'med', 'high'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleIntensity(v)}
                      className={cn(
                        'flex-1 rounded border px-2 py-1.5 text-xs capitalize',
                        settings.intensity === v
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs">Threshold (min weight {settings.threshold})</Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={settings.threshold}
                  onChange={handleThreshold}
                  className="mt-1.5 h-2 w-full accent-primary"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Show pins on top</Label>
                <input
                  type="checkbox"
                  checked={settings.showPinsOnTop}
                  onChange={handleShowPinsOnTop}
                  className="h-4 w-4 rounded border-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_HEATMAP_SETTINGS };
