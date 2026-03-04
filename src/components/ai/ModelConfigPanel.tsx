'use client';

import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { updateAiOrgConfig } from '@/app/app/settings/ai/actions';
import type { AiOrgConfigRow } from '@/app/app/settings/ai/types';

export function ModelConfigPanel({ orgId, config, onConfigChange }: { orgId: string; config: AiOrgConfigRow | null; onConfigChange: (p: Partial<AiOrgConfigRow>) => void }) {
  const { toast } = useToast();
  const modelKey = config?.model_key ?? 'balanced';
  const temperature = config?.temperature ?? 0.5;
  const responseLength = config?.response_length ?? 'standard';
  const confidence = config?.confidence_threshold ?? 'med';
  const cheaperDrafts = config?.use_cheaper_model_drafts ?? true;

  const save = async (patch: Record<string, unknown>) => {
    const { error } = await updateAiOrgConfig(orgId, patch as any);
    if (error) toast({ title: 'Failed to save', description: error, variant: 'destructive' });
    else { toast({ title: 'Saved' }); onConfigChange(patch as Partial<AiOrgConfigRow>); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Model Configuration</CardTitle>
        <p className="text-sm text-muted-foreground">Default model and behavior.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Model</Label>
          <Select value={modelKey} onValueChange={(v) => save({ model_key: v })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Temperature (0.2–0.9)</Label>
          <Input type="number" min={0.2} max={0.9} step={0.1} value={temperature} onChange={(e) => save({ temperature: parseFloat(e.target.value) || 0.5 })} className="w-24" />
        </div>
        <div>
          <Label>Response length</Label>
          <Select value={responseLength} onValueChange={(v) => save({ response_length: v as any })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Confidence threshold</Label>
          <Select value={confidence} onValueChange={(v) => save({ confidence_threshold: v as any })}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="med">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={cheaperDrafts} onCheckedChange={(v) => save({ use_cheaper_model_drafts: v === true })} />
          <Label>Use cheaper model for drafts</Label>
        </div>
      </CardContent>
    </Card>
  );
}
