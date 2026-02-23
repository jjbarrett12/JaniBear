'use client';

import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { upsertAiOrgConfig, testAiConnection } from '@/app/app/settings/ai/actions';
import type { AiOrgConfigRow } from '@/app/app/settings/ai/types';

export interface ProviderKeysPanelProps {
  orgId: string;
  config: AiOrgConfigRow | null;
  onConfigChange: (patch: Partial<AiOrgConfigRow>) => void;
}

export function ProviderKeysPanel({ orgId, config, onConfigChange }: ProviderKeysPanelProps) {
  const { toast } = useToast();
  const provider = config?.provider ?? 'openai';
  const byokValidatedAt = config?.byok_validated_at;

  const handleProviderChange = async (v: string) => {
    const { error } = await upsertAiOrgConfig(orgId, { provider: v as 'openai' | 'byok' });
    if (error) toast({ title: 'Failed to save', description: error, variant: 'destructive' });
    else onConfigChange({ provider: v as 'openai' | 'byok' });
  };

  const handleTest = async () => {
    const { ok, error } = await testAiConnection(orgId);
    if (ok) toast({ title: 'Connection OK' });
    else toast({ title: 'Connection failed', description: error, variant: 'destructive' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">API Keys & Provider</CardTitle>
        <p className="text-sm text-muted-foreground">OpenAI (managed) or bring your own key.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select value={provider} onValueChange={handleProviderChange}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI (managed by JANIBEAR)</SelectItem>
              <SelectItem value="byok">Bring your own key</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {provider === 'openai' && (
          <p className="text-sm text-muted-foreground">Keys are managed by JANIBEAR. Configure usage limits above.</p>
        )}
        {provider === 'byok' && (
          <>
            <div className="space-y-2">
              <Label>API key (masked)</Label>
              <Input type="password" placeholder="sk-..." disabled className="max-w-md" />
              <p className="text-xs text-muted-foreground">Key is stored securely. Enter in a secure flow (stub).</p>
            </div>
            <Button size="sm" variant="outline" onClick={handleTest}>Test connection</Button>
            {byokValidatedAt && <p className="text-xs text-muted-foreground">Last validated: {new Date(byokValidatedAt).toLocaleString()}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
