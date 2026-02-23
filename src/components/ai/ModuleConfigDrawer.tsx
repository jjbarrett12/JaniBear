'use client';

import { SlideOverDrawer } from '@/components/enterprise/slide-over-drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { AiModuleStateRow } from '@/app/app/settings/ai/types';

export interface ModuleConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  module: AiModuleStateRow | null;
  onSave: (moduleKey: string, settings: Record<string, unknown>) => void;
  saving?: boolean;
}

export function ModuleConfigDrawer({ open, onClose, module, onSave, saving }: ModuleConfigDrawerProps) {
  if (!module) return null;
  const settingsJson = JSON.stringify(module.settings || {}, null, 2);
  return (
    <SlideOverDrawer open={open} onClose={onClose} title={`Configure ${module.module_key}`} width="max-w-md">
      <div className="px-6 pb-6 space-y-4">
        <p className="text-sm text-muted-foreground">Module-specific options. Saved per org.</p>
        <div className="space-y-2">
          <Label htmlFor="mod-settings">Custom settings (JSON)</Label>
          <Input id="mod-settings" placeholder="{}" defaultValue={settingsJson} className="font-mono text-xs" />
        </div>
        <Button
          onClick={() => {
            const el = document.getElementById('mod-settings') as HTMLInputElement | null;
            try {
              const settings = el ? JSON.parse(el?.value || '{}') : {};
              onSave(module.module_key, settings);
              onClose();
            } catch (_) {}
          }}
          disabled={saving}
        >
          Save
        </Button>
      </div>
    </SlideOverDrawer>
  );
}
