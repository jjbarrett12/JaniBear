'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ModuleCard } from '@/components/ai/ModuleCard';
import { ModuleConfigDrawer } from '@/components/ai/ModuleConfigDrawer';
import { updateAiModule } from '@/app/app/settings/ai/actions';
import type { AiModuleStateRow, AiOrgConfigRow } from '@/app/app/settings/ai/types';
import { AI_MODULE_KEYS } from '@/app/app/settings/ai/types';

export interface ModuleGridProps {
  orgId: string;
  modules: AiModuleStateRow[];
  config: AiOrgConfigRow | null;
  onModulesChange: (modules: AiModuleStateRow[]) => void;
}

function ensureModule(orgId: string, moduleKey: string): AiModuleStateRow {
  return {
    id: '',
    org_id: orgId,
    module_key: moduleKey,
    enabled: false,
    settings: {},
    calls_this_month: 0,
    last_run_at: null,
    created_at: '',
    updated_at: '',
  };
}

export function ModuleGrid({ orgId, modules, onModulesChange }: ModuleGridProps) {
  const { toast } = useToast();
  const [configuring, setConfiguring] = useState<AiModuleStateRow | null>(null);
  const [saving, setSaving] = useState(false);

  const byKey = new Map(modules.map((m) => [m.module_key, m]));
  const rows = AI_MODULE_KEYS.map((key) => byKey.get(key) ?? ensureModule(orgId, key));

  const handleToggle = async (moduleKey: string, enabled: boolean) => {
    setSaving(true);
    const { error } = await updateAiModule(orgId, moduleKey, { enabled });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to update module', description: error, variant: 'destructive' });
      return;
    }
    const next = rows.map((m) => (m.module_key === moduleKey ? { ...m, enabled } : m));
    onModulesChange(next);
    toast({ title: enabled ? 'Module enabled' : 'Module disabled' });
  };

  const handleSaveConfig = async (moduleKey: string, settings: Record<string, unknown>) => {
    setSaving(true);
    const { error } = await updateAiModule(orgId, moduleKey, { settings });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error, variant: 'destructive' });
      return;
    }
    const next = rows.map((m) => (m.module_key === moduleKey ? { ...m, settings } : m));
    onModulesChange(next);
    setConfiguring(null);
    toast({ title: 'Settings saved' });
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((module) => (
          <ModuleCard
            key={module.module_key}
            module={module}
            onToggle={(enabled) => handleToggle(module.module_key, enabled)}
            onConfigure={() => setConfiguring(module)}
            saving={saving}
          />
        ))}
      </div>
      <ModuleConfigDrawer
        open={!!configuring}
        onClose={() => setConfiguring(null)}
        module={configuring}
        onSave={handleSaveConfig}
        saving={saving}
      />
    </>
  );
}
