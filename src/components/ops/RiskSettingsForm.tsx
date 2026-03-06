'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Initial {
  enabled?: boolean;
  alert_threshold?: string;
  min_backup_score?: number;
  require_same_territory?: boolean;
  risk_jump_alert?: number;
}

interface Props {
  orgId: string;
  initial: Initial;
}

export function RiskSettingsForm({ orgId, initial }: Props) {
  const [enabled, setEnabled] = useState(initial.enabled ?? true);
  const [alertThreshold, setAlertThreshold] = useState(initial.alert_threshold ?? 'high');
  const [minBackupScore, setMinBackupScore] = useState(String(initial.min_backup_score ?? 70));
  const [requireSameTerritory, setRequireSameTerritory] = useState(initial.require_same_territory ?? true);
  const [riskJumpAlert, setRiskJumpAlert] = useState(String(initial.risk_jump_alert ?? 15));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/app/risk/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          alert_threshold: alertThreshold,
          min_backup_score: parseInt(minBackupScore, 10) || 70,
          require_same_territory: requireSameTerritory,
          risk_jump_alert: parseInt(riskJumpAlert, 10) || 15,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMessage('Saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Detection</CardTitle>
          <CardDescription>When to create risk events and alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Risk detection enabled</Label>
            <Switch id="enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-2">
            <Label>Alert threshold</Label>
            <Select value={alertThreshold} onValueChange={setAlertThreshold}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medium">Medium and above</SelectItem>
                <SelectItem value="high">High and critical</SelectItem>
                <SelectItem value="critical">Critical only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk_jump">Risk score jump to trigger event</Label>
            <Input
              id="risk_jump"
              type="number"
              min={0}
              max={100}
              value={riskJumpAlert}
              onChange={(e) => setRiskJumpAlert(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Backup recommendations</CardTitle>
          <CardDescription>Minimum performance and territory rules for suggested backups.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="min_backup">Min backup operator score</Label>
            <Input
              id="min_backup"
              type="number"
              min={0}
              max={100}
              value={minBackupScore}
              onChange={(e) => setMinBackupScore(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="same_territory" checked={requireSameTerritory} onCheckedChange={(v) => setRequireSameTerritory(v === true)} />
            <Label htmlFor="same_territory">Require same territory</Label>
          </div>
        </CardContent>
      </Card>

      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
      <Button type="submit" className="mt-4" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
