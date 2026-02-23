'use client';

import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { upsertAiOrgConfig } from '@/app/app/settings/ai/actions';
import type { AiOrgConfigRow } from '@/app/app/settings/ai/types';

const DATA_KEYS = ['proposals', 'walkthroughs', 'inspections', 'account_notes', 'contracts', 'invoices', 'tasks', 'crew_schedules'];

export function PrivacyPanel(props: { orgId: string; config: AiOrgConfigRow | null; onConfigChange: (p: Partial<AiOrgConfigRow>) => void }) {
  const { orgId, config, onConfigChange } = props;
  const { toast } = useToast();
  const dataAccess = (config?.data_access ?? {}) as Record<string, boolean>;
  const redaction = config?.redaction_level ?? 'basic';
  const retain = config?.retain_prompts ?? false;
  const retainDays = config?.retain_prompts_days ?? 0;

  const save = async (patch: Record<string, unknown>) => {
    const res = await updateAiOrgConfig(orgId, patch as any);
    if (res.error) toast({ title: 'Failed to save', description: res.error, variant: 'destructive' });
    else { toast({ title: 'Saved' }); onConfigChange(patch as Partial<AiOrgConfigRow>); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Data Access and Privacy</CardTitle>
        <p className="text-sm text-muted-foreground">What data AI can access.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm">AI can access</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {DATA_KEYS.map((k) => (
              <div key={k} className="flex items-center gap-2">
                <Checkbox checked={!!dataAccess[k]} onCheckedChange={(v) => save({ data_access: { ...dataAccess, [k]: v === true } })} />
                <span className="text-sm">{k}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Label>Redaction level</Label>
          <Select value={redaction} onValueChange={(v) => save({ redaction_level: v })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="aggressive">Aggressive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={retain} onCheckedChange={(v) => save({ retain_prompts: v === true })} />
          <Label>Retain prompts</Label>
        </div>
        {retain && (
          <div className="flex items-center gap-2">
            <Label>Days</Label>
            <Input type="number" min={0} max={365} value={retainDays} onChange={(e) => save({ retain_prompts_days: parseInt(e.target.value, 10) || 0 })} className="w-20" />
          </div>
        )}
        <p className="text-xs text-muted-foreground">Data sent to LLM is copy-only.</p>
      </CardContent>
    </Card>
  );
}
