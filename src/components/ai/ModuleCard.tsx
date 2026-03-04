'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings2 } from 'lucide-react';
import type { AiModuleStateRow } from '@/app/app/settings/ai/types';
import { MODULE_LABELS, MODULE_DESCRIPTIONS } from '@/app/app/settings/ai/types';

export interface ModuleCardProps {
  module: AiModuleStateRow;
  planLocked?: boolean;
  onToggle: (enabled: boolean) => void;
  onConfigure: () => void;
  saving?: boolean;
}

export function ModuleCard({ module, planLocked = false, onToggle, onConfigure, saving }: ModuleCardProps) {
  const desc = MODULE_DESCRIPTIONS[module.module_key] ?? module.module_key;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={module.enabled}
              onCheckedChange={(v) => onToggle(v === true)}
              disabled={planLocked || saving}
            />
            <span className="font-medium text-foreground">{MODULE_LABELS[module.module_key] ?? module.module_key}</span>
          </div>
          {planLocked && (
            <Badge variant="secondary" className="text-xs">Plan locked</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{desc}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Usage this month: {module.calls_this_month}</span>
          <span>·</span>
          <span>Last run: {module.last_run_at ? new Date(module.last_run_at).toLocaleString() : 'Never'}</span>
        </div>
        <Button size="sm" variant="outline" className="w-full gap-2" onClick={onConfigure} disabled={planLocked}>
          <Settings2 className="h-3.5 w-3.5" />
          Configure
        </Button>
      </CardContent>
    </Card>
  );
}
