'use client';

import { SlideOverDrawer } from '@/components/enterprise';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { WidgetDefinition } from '@/lib/widgets/types';

export interface AddWidgetDrawerProps {
  open: boolean;
  onClose: () => void;
  widgets: WidgetDefinition[];
  /** Widget ids already visible in the grid */
  visibleIds: string[];
  /** Widget ids user has hidden (can re-add) */
  hiddenIds: string[];
  onAdd: (widgetId: string) => void;
}

export function AddWidgetDrawer({
  open,
  onClose,
  widgets,
  visibleIds,
  hiddenIds,
  onAdd,
}: AddWidgetDrawerProps) {
  const visibleSet = new Set(visibleIds);
  const canAdd = widgets.filter((w) => !visibleSet.has(w.id));

  return (
    <SlideOverDrawer open={open} onClose={onClose} title="Add widget" width="max-w-sm">
      <div className="flex flex-col gap-2 p-4">
        {canAdd.length === 0 ? (
          <p className="text-sm text-muted-foreground">All widgets are already on the grid.</p>
        ) : (
          <ul className="space-y-1">
            {canAdd.map((w) => (
              <li key={w.id}>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => {
                    onAdd(w.id);
                    onClose();
                  }}
                >
                  {w.icon && <span className="shrink-0 text-muted-foreground">{w.icon}</span>}
                  <span className="text-left">
                    <span className="font-medium block">{w.title}</span>
                    {w.description && (
                      <span className="text-xs text-muted-foreground font-normal">{w.description}</span>
                    )}
                  </span>
                  <Plus className="h-4 w-4 ml-auto shrink-0" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SlideOverDrawer>
  );
}
