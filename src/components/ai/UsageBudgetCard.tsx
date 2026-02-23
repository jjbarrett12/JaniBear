'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateAiOrgConfig } from '@/app/app/settings/ai/actions';
import { listAiUsageDaily } from '@/app/app/settings/ai/usage/actions';
import { BarChart3 } from 'lucide-react';

export interface UsageBudgetCardProps {
  orgId: string;
  period: string;
  tokensUsed: number;
  costCents: number;
  budgetCents: number | null;
  hardCapEnabled: boolean;
  notifyAtPercent: number;
  notifyChannel: 'in_app' | 'email' | 'slack';
  onConfigChange: (patch: Record<string, unknown>) => void;
}

function formatCost(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100);
}

export function UsageBudgetCard({
  orgId,
  period,
  tokensUsed,
  costCents,
  budgetCents,
  hardCapEnabled,
  notifyAtPercent,
  notifyChannel,
  onConfigChange,
}: UsageBudgetCardProps) {
  const { toast } = useToast();
  const [showLog, setShowLog] = useState(false);
  const [dailyRows, setDailyRows] = useState<{ usage_date: string | null; estimated_cost_cents: number }[]>([]);
  const [budgetMonthly, setBudgetMonthly] = useState(budgetCents != null ? String(Math.round(budgetCents / 100)) : '');
  const [hardCap, setHardCap] = useState(hardCapEnabled);
  const [notifyPct, setNotifyPct] = useState(String(notifyAtPercent));
  const [channel, setChannel] = useState(notifyChannel);
  const [saving, setSaving] = useState(false);

  const budgetCentsNum = budgetCents ?? 0;
  const pct = budgetCentsNum > 0 ? Math.min(100, (costCents / budgetCentsNum) * 100) : 0;
  const warnThreshold = notifyAtPercent;

  const handleSave = async () => {
    setSaving(true);
    const budget_monthly_cents = budgetMonthly.trim() ? Math.round(parseFloat(budgetMonthly) * 100) : null;
    const { error } = await updateAiOrgConfig(orgId, {
      budget_monthly_cents,
      hard_cap_enabled: hardCap,
      notify_at_percent: notifyPct.trim() ? parseInt(notifyPct, 10) : 80,
      notify_channel: channel,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error, variant: 'destructive' });
      return;
    }
    onConfigChange({
      budget_limit_cents: budget_monthly_cents,
      budget_hard_cap: hardCap,
      notify_at_percent: notifyPct.trim() ? parseInt(notifyPct, 10) : 80,
      notify_channel: channel,
    });
    toast({ title: 'Saved' });
  };

  const handleUsageLog = async () => {
    setShowLog(true);
    const list = await listAiUsageDaily(orgId, period);
    setDailyRows(list.map((r) => ({ usage_date: r.usage_date, estimated_cost_cents: r.estimated_cost_cents })));
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Usage & Budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-muted-foreground">Tokens this month</p>
            <p className="font-semibold tabular-nums">{(tokensUsed / 1000).toFixed(1)}k</p>
          </div>
          <div>
            <p className="text-muted-foreground">Cost</p>
            <p className="font-semibold tabular-nums">{formatCost(costCents)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Budget</p>
            <p className="font-semibold tabular-nums">{budgetCents != null ? formatCost(budgetCents) : '—'}</p>
          </div>
        </div>
        {budgetCentsNum > 0 && (
          <div className="space-y-1">
            <Progress value={pct} className={pct >= warnThreshold ? 'bg-amber-500/20' : ''} />
            {pct >= warnThreshold && <p className="text-xs text-amber-600 dark:text-amber-400">At or above notify threshold ({warnThreshold}%)</p>}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs">Budget monthly ($)</Label>
            <Input type="number" min={0} step={1} placeholder="e.g. 50" className="w-28 mt-1" value={budgetMonthly} onChange={(e) => setBudgetMonthly(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="hard-cap" checked={hardCap} onCheckedChange={(v) => setHardCap(v === true)} />
            <Label htmlFor="hard-cap" className="text-xs">Hard cap (auto-disable when exceeded)</Label>
          </div>
          <div>
            <Label className="text-xs">Notify at %</Label>
            <Input type="number" min={0} max={100} className="w-20 mt-1" value={notifyPct} onChange={(e) => setNotifyPct(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Notify channel</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as 'in_app' | 'email' | 'slack')}>
              <SelectTrigger className="w-28 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_app">In-app</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="slack">Slack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleSave} disabled={saving}>Save</Button>
        </div>
        <Button size="sm" variant="outline" onClick={handleUsageLog}>Usage Log</Button>
        {showLog && (
          <div className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium mb-2">Daily breakdown ({period})</p>
            {dailyRows.length === 0 ? <p className="text-muted-foreground">No daily records.</p> : (
              <ul className="space-y-1">
                {dailyRows.slice(0, 14).map((r) => (
                  <li key={r.usage_date ?? 'm'} className="flex justify-between">
                    <span>{r.usage_date ?? 'Month'}</span>
                    <span className="tabular-nums">{formatCost(r.estimated_cost_cents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
