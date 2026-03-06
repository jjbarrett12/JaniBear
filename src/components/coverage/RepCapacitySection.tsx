'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { upsertSalesCapacitySettings, upsertRepCapacityOverride } from '@/actions/coverage-capacity';
import type {
  SalesCapacitySettingsForAdmin,
  RepCounterForAdmin,
  RepOverrideForAdmin,
  MemberForAdmin,
} from '@/lib/coverage/admin-data';

interface Props {
  orgId: string;
  capacitySettings: SalesCapacitySettingsForAdmin | null;
  repCounters: RepCounterForAdmin[];
  repOverrides: RepOverrideForAdmin[];
  members: MemberForAdmin[];
}

const DEFAULT_MAX_NEW = 80;
const DEFAULT_MAX_WORKING = 200;

export function RepCapacitySection({
  orgId,
  capacitySettings,
  repCounters,
  repOverrides,
  members,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(capacitySettings?.enabled ?? true);
  const [maxNew, setMaxNew] = useState(capacitySettings?.max_new_leads_per_rep ?? DEFAULT_MAX_NEW);
  const [maxWorking, setMaxWorking] = useState(capacitySettings?.max_working_leads_per_rep ?? DEFAULT_MAX_WORKING);
  const [overflowStrategy, setOverflowStrategy] = useState(capacitySettings?.overflow_strategy ?? 'next_rep');
  const [overflowRepId, setOverflowRepId] = useState(capacitySettings?.overflow_rep_user_id ?? '');

  const counterByUser = new Map(repCounters.map((c) => [c.user_id, c]));
  const overrideByUser = new Map(repOverrides.map((o) => [o.user_id, o]));

  async function handleSaveSettings() {
    setLoading(true);
    setError(null);
    const res = await upsertSalesCapacitySettings(orgId, {
      enabled: enabled,
      max_new_leads_per_rep: maxNew,
      max_working_leads_per_rep: maxWorking,
      overflow_strategy: overflowStrategy as 'next_rep' | 'overflow_rep' | 'unassigned_queue',
      overflow_rep_user_id: overflowRepId || null,
    });
    setLoading(false);
    if (res.error) setError(res.error);
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Rep capacity</h3>
      <p className="text-xs text-muted-foreground">
        Limit new/working leads per rep to avoid over-assignment. When all eligible reps are at capacity, overflow strategy applies.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm">Capacity limits enabled</span>
        </label>
        <div>
          <Label className="text-xs">Max new leads per rep</Label>
          <Input
            type="number"
            min={1}
            value={maxNew}
            onChange={(e) => setMaxNew(parseInt(e.target.value, 10) || DEFAULT_MAX_NEW)}
            className="mt-1 h-8 w-24"
          />
        </div>
        <div>
          <Label className="text-xs">Max working leads per rep</Label>
          <Input
            type="number"
            min={1}
            value={maxWorking}
            onChange={(e) => setMaxWorking(parseInt(e.target.value, 10) || DEFAULT_MAX_WORKING)}
            className="mt-1 h-8 w-24"
          />
        </div>
        <div>
          <Label className="text-xs">Overflow strategy</Label>
          <select
            value={overflowStrategy}
            onChange={(e) => setOverflowStrategy(e.target.value)}
            className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="next_rep">Next rep (broaden)</option>
            <option value="overflow_rep">Assign to overflow rep</option>
            <option value="unassigned_queue">Unassigned queue</option>
          </select>
        </div>
        {overflowStrategy === 'overflow_rep' && (
          <div>
            <Label className="text-xs">Overflow rep</Label>
            <select
              value={overflowRepId}
              onChange={(e) => setOverflowRepId(e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="sm:col-span-2">
          <Button size="sm" onClick={handleSaveSettings} disabled={loading}>
            Save capacity settings
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 font-medium">Rep</th>
              <th className="text-right py-2 font-medium">New</th>
              <th className="text-right py-2 font-medium">Working</th>
              <th className="text-right py-2 font-medium">Qualified</th>
              <th className="text-right py-2 font-medium">Max new</th>
              <th className="text-right py-2 font-medium">Max working</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const c = counterByUser.get(m.user_id) ?? { new_count: 0, working_count: 0, qualified_count: 0 };
              const o = overrideByUser.get(m.user_id);
              const limitNew = o?.max_new_leads ?? capacitySettings?.max_new_leads_per_rep ?? DEFAULT_MAX_NEW;
              const limitWorking = o?.max_working_leads ?? capacitySettings?.max_working_leads_per_rep ?? DEFAULT_MAX_WORKING;
              const atCap = enabled && (c.new_count >= limitNew || c.working_count >= limitWorking);
              return (
                <tr key={m.user_id} className={`border-b border-border/60 ${atCap ? 'bg-amber-500/5' : ''}`}>
                  <td className="py-1.5">{m.display_name}</td>
                  <td className="text-right py-1.5">{c.new_count}</td>
                  <td className="text-right py-1.5">{c.working_count}</td>
                  <td className="text-right py-1.5">{c.qualified_count}</td>
                  <td className="text-right py-1.5 text-muted-foreground">{limitNew}</td>
                  <td className="text-right py-1.5 text-muted-foreground">{limitWorking}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground">No org members to show. Counters update when leads are assigned.</p>
      )}
    </div>
  );
}
