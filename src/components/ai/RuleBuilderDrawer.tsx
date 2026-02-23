'use client';

import { useState, useEffect } from 'react';
import { SlideOverDrawer } from '@/components/enterprise/slide-over-drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AI_TRIGGER_TYPES, AI_ACTION_TYPES } from '@/app/app/settings/ai/types';
import type { AiAutomationRuleRow } from '@/app/app/settings/ai/types';

export interface RuleBuilderDrawerProps {
  open: boolean;
  onClose: () => void;
  rule?: AiAutomationRuleRow;
  onSave: (payload: {
    id?: string;
    name: string;
    enabled: boolean;
    trigger_type: string;
    trigger_params?: Record<string, unknown>;
    conditions?: unknown[];
    actions?: unknown[];
    notify_settings?: Record<string, unknown>;
    cooldown_minutes?: number;
  }) => void;
  saving?: boolean;
}

export function RuleBuilderDrawer({ open, onClose, rule, onSave, saving }: RuleBuilderDrawerProps) {
  const [name, setName] = useState(rule?.name ?? '');
  const [enabled, setEnabled] = useState(rule?.enabled ?? true);
  const [triggerType, setTriggerType] = useState(rule?.trigger_type ?? 'inspection_score_below');
  const [cooldown, setCooldown] = useState(rule?.cooldown_minutes ?? 60);
  useEffect(() => {
    if (open) {
      setName(rule?.name ?? '');
      setEnabled(rule?.enabled ?? true);
      setTriggerType(rule?.trigger_type ?? 'inspection_score_below');
      setCooldown(rule?.cooldown_minutes ?? 60);
    }
  }, [open, rule]);

  const handleSave = () => {
    onSave({
      id: rule?.id,
      name: name || 'Unnamed rule',
      enabled,
      trigger_type: triggerType,
      trigger_params: rule?.trigger_params ?? {},
      conditions: rule?.conditions ?? [],
      actions: rule?.actions ?? [{ type: 'generate_action_plan' }],
      notify_settings: rule?.notify_settings ?? {},
      cooldown_minutes: cooldown,
    });
  };

  return (
    <SlideOverDrawer open={open} onClose={onClose} title={rule ? 'Edit rule' : 'Create rule'} width="max-w-lg">
      <div className="px-6 pb-6 space-y-6">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Rule name" />
        </div>
        <div className="space-y-2">
          <Label>Trigger</Label>
          <Select value={triggerType} onValueChange={setTriggerType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_TRIGGER_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cooldown (minutes)</Label>
          <Input type="number" min={0} value={cooldown} onChange={(e) => setCooldown(parseInt(e.target.value, 10) || 0)} />
        </div>
        <p className="text-xs text-muted-foreground">Step 2–5: conditions, actions, notify — use Edit for full builder.</p>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>Save</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </SlideOverDrawer>
  );
}
