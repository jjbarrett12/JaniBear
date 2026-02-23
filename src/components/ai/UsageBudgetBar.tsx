'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { getAiUsageMonth, listAiUsageDaily } from '@/app/app/settings/ai/usage/actions';
import { upsertAiOrgConfig } from '@/app/app/settings/ai/actions';
import { BarChart3 } from 'lucide-react';

export interface UsageBudgetBarProps {
  orgId: string;
  period: string;
  tokensUsed: number;
  costCents: number;
  budgetCents: number | null;
  hardCap: boolean;
  onUpdate: (u: { tokensUsed: number; costCents: number; budgetCents: number | null }) => void;
  onConfigChange: (patch: { budget_limit_cents?: number | null; budget_hard_cap?: boolean }) => void;
}

function formatCost(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(cents / 100);
}

export function UsageBudgetBar({
  orgId,
  period,
  tokensUsed,
  costCents,
  budgetCents,
  hardCap,
  onUpdate,
  onConfigChange,
}: UsageBudgetBarProps) {
  const { toast } = useToast();
  const [showLog, setShowLog] = useState(false);
  const [dailyRows, setDailyRows] = useState<{ usage_date: string | null; tokens_input: number; tokens_output: number; estimated_cost_cents: number }[]>([]);
  const [budgetInput, setBudgetInput] = useState(budgetCents != null ? String(budgetCents) : '');
  const [hardCapChecked, setHardCapChecked] = useState(hardCap);
  const [saving, setSaving] = useState(false);

  const budget = budgetCents ?? 0;
  const pct = budget > 0 ? Math.min(100, (costCents / budget) * 100) : 0;
  const warn80 = budget > 0 && pct >= 80;

  const handleViewLog = async () => {
    setShowLog(true);
    const list = await listAiUsageDaily(orgId, period);
    setDailyRows(list.map((r) => ({ usage_date: r.usage_date, tokens_input: r.tokens_input, tokens_output: r.tokens_output, estimated_cost_cents: r.estimated_cost_cents })));
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    const cents = budgetInput.trim() ? Math.round(parseFloat(budgetInput) * 100) : null;
    const { error } = await upsertAiOrgConfig(orgId, {
      budget_limit_cents: cents,
      budget_hard_cap: hardCapChecked,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Failed to save', description: error, variant: 'destructive' });
      return;
    }
    onConfigChange({ budget_limit_cents: cents, budget_hard_cap: hardCapChecked });
    toast({ title: 'Budget updated' });
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
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tokens this month</p>
            <p className="text-xl font-semibold tabular-nums">{(tokensUsed / 1000).toFixed(1)}k</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Estimated cost</p>
            <p className="text-xl font-semibold tabular-nums">{formatCost(costCents)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Budget limit</p>
            <p className="text-xl font-semibold tabular-nums">{budgetCents != null ? formatCost(budgetCents) : '—'}</p>
          </div>
        </div>
        {budget > 0 && (
          <div className="space-y-2">
            <Progress value={pct} className={warn80 ? 'bg-amber-500/20' : ''} />
            {warn80 && <p className="text-xs text-amber-600 dark:text-amber-400">Approaching 80% of budget</p>}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="budget-limit" className="text-sm">Monthly budget ($)</Label>
            <Input
              id="budget-limit"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 50"
              className="w-24"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="hard-cap"
              checked={hardCapChecked}
              onCheckedChange={(v) => setHardCapChecked(v === true)}
            />
            <Label htmlFor="hard-cap" className="text-sm">Hard cap (auto-disable AI when limit exceeded)</Label>
          </div>
          <Button size="sm" variant="secondary" onClick={handleSaveBudget} disabled={saving}>
            Save
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={handleViewLog} className="gap-2">
          View usage log
        </Button>
        {showLog && (
          <div className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium mb-2">Daily breakdown ({period})</p>
            {dailyRows.length === 0 ? (
              <p className="text-muted-foreground">No daily records yet.</p>
            ) : (
              <ul className="space-y-1">
                {dailyRows.slice(0, 14).map((r) => (
                  <li key={r.usage_date ?? 'month'} className="flex justify-between">
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
