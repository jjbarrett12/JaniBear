'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RuleBuilderDrawer } from '@/components/ai/RuleBuilderDrawer';
import { deleteAiRule, upsertAiRule } from '@/app/app/settings/ai/actions';
import type { AiAutomationRuleRow } from '@/app/app/settings/ai/types';
import { triggerSummary, actionSummary } from '@/app/app/settings/ai/types';
import { Pencil, Trash2 } from 'lucide-react';

export interface RulesTableProps {
  orgId: string;
  rules: AiAutomationRuleRow[];
  onRulesChange: (rules: AiAutomationRuleRow[]) => void;
}

export function RulesTable({ orgId, rules, onRulesChange }: RulesTableProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<AiAutomationRuleRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (rule: AiAutomationRuleRow) => {
    setSaving(true);
    const { error } = await upsertAiRule(orgId, { ...rule, enabled: !rule.enabled });
    setSaving(false);
    if (error) toast({ title: 'Failed to update', description: error, variant: 'destructive' });
    else onRulesChange(rules.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)));
  };

  const handleDelete = async (ruleId: string) => {
    const { error } = await deleteAiRule(orgId, ruleId);
    if (error) toast({ title: 'Delete failed', description: error, variant: 'destructive' });
    else onRulesChange(rules.filter((r) => r.id !== ruleId));
  };

  const handleSave = async (payload: Parameters<RulesTableProps['onRulesChange']>[0] extends AiAutomationRuleRow[] ? never : {
    id?: string; name: string; enabled: boolean; trigger_type: string;
    trigger_params?: Record<string, unknown>; conditions?: unknown[]; actions?: unknown[];
    notify_settings?: Record<string, unknown>; cooldown_minutes?: number;
  }) => {
    setSaving(true);
    const { error } = await upsertAiRule(orgId, payload as any);
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error, variant: 'destructive' });
    else { setEditing(null); setCreating(false); onRulesChange([...rules]); }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">On</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Actions</TableHead>
              <TableHead>Cooldown</TableHead>
              <TableHead>Last fired</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No rules yet.</TableCell>
              </TableRow>
            ) : (
              rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Checkbox checked={r.enabled} onCheckedChange={() => handleToggle(r)} disabled={saving} />
                  </TableCell>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{triggerSummary(r.trigger_type, r.trigger_params ?? {})}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{actionSummary(r.actions ?? [])}</TableCell>
                  <TableCell>{r.cooldown_minutes}m</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.last_fired_at ? new Date(r.last_fired_at).toLocaleString() : 'Never'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Button className="mt-3" onClick={() => setCreating(true)}>Create rule</Button>
      <RuleBuilderDrawer open={creating || !!editing} onClose={() => { setCreating(false); setEditing(null); }} rule={editing ?? undefined} onSave={handleSave} saving={saving} />
    </>
  );
}
