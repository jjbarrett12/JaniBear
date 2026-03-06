'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  createSalesRoutingRule,
  updateSalesRoutingRule,
  deleteSalesRoutingRule,
  type SalesRoutingRuleForm,
} from '@/actions/coverage-routing-rules';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { VerticalRow } from './VerticalsManager';

export interface RoutingRuleRow {
  id: string;
  name: string;
  priority: number;
  active: boolean;
  territory_id: string | null;
  coverage_area_id: string | null;
  vertical_id: string | null;
  assignee_user_id: string | null;
  assignment_method: string;
  reason: string | null;
}

interface TerritoryOption {
  id: string;
  name: string;
}

interface CoverageAreaOption {
  id: string;
  name: string;
}

interface MemberOption {
  user_id: string;
  display_name: string;
}

interface Props {
  orgId: string;
  rules: RoutingRuleRow[];
  verticals: VerticalRow[];
  territories: TerritoryOption[];
  coverageAreas: CoverageAreaOption[];
  members: MemberOption[];
}

const ASSIGNMENT_METHODS = ['primary', 'round_robin', 'weighted', 'manual'] as const;

export function RoutingRulesBuilder({
  orgId,
  rules: initialRules,
  verticals,
  territories,
  coverageAreas,
  members,
}: Props) {
  const [rules, setRules] = useState<RoutingRuleRow[]>(initialRules);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SalesRoutingRuleForm & { active?: boolean }>({
    name: '',
    priority: 100,
    territory_id: null,
    coverage_area_id: null,
    vertical_id: null,
    assignee_user_id: null,
    assignment_method: 'primary',
    reason: null,
    active: true,
  });

  function resetForm() {
    setForm({
      name: '',
      priority: 100,
      territory_id: null,
      coverage_area_id: null,
      vertical_id: null,
      assignee_user_id: null,
      assignment_method: 'primary',
      reason: null,
      active: true,
    });
    setAdding(false);
    setEditingId(null);
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await createSalesRoutingRule(orgId, form);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRules((prev) => [...prev, { ...form, id: crypto.randomUUID(), active: true } as RoutingRuleRow]);
    resetForm();
  }

  async function handleUpdate(id: string) {
    if (!form.name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await updateSalesRoutingRule(orgId, id, form);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...form } : r)));
    resetForm();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this routing rule?')) return;
    setLoading(true);
    setError(null);
    const res = await deleteSalesRoutingRule(orgId, id);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  const isEditing = adding || editingId != null;
  const showAddForm = adding && !editingId;
  const formEl = (
    <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label className="text-xs">Name</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. All healthcare to Rep A"
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Priority (lower = first)</Label>
        <Input
          type="number"
          value={form.priority}
          onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value, 10) || 100 }))}
          className="mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Vertical</Label>
        <select
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.vertical_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, vertical_id: e.target.value || null }))}
        >
          <option value="">Any</option>
          {verticals.filter((v) => v.active).map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="text-xs">Territory (optional)</Label>
        <select
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.territory_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, territory_id: e.target.value || null }))}
        >
          <option value="">Any</option>
          {territories.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="text-xs">Coverage area (optional)</Label>
        <select
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.coverage_area_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, coverage_area_id: e.target.value || null }))}
        >
          <option value="">Any</option>
          {coverageAreas.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="text-xs">Assignee</Label>
        <select
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.assignee_user_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, assignee_user_id: e.target.value || null }))}
        >
          <option value="">—</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="text-xs">Assignment method</Label>
        <select
          className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={form.assignment_method}
          onChange={(e) => setForm((f) => ({ ...f, assignment_method: e.target.value as SalesRoutingRuleForm['assignment_method'] }))}
        >
          {ASSIGNMENT_METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label className="text-xs">Reason (optional)</Label>
        <Input
          value={form.reason ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value || null }))}
          placeholder="e.g. Healthcare specialist"
          className="mt-1"
        />
      </div>
      <div className="flex gap-2 sm:col-span-2">
        <Button
          size="sm"
          onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
          disabled={loading}
        >
          {editingId ? 'Update' : 'Add rule'}
        </Button>
        <Button size="sm" variant="ghost" onClick={resetForm}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Routing rules</h3>
        {!isEditing && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add rule
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Rules are evaluated by priority (lowest first). First matching rule assigns the lead. Set vertical for vertical-based splits.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {showAddForm && formEl}
      <ul className="space-y-2">
        {rules
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map((r) => (
            <li key={r.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              {editingId === r.id ? (
                formEl
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-medium">{r.name}</span>
                      <span className="ml-2 text-muted-foreground">(priority {r.priority})</span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(r.id); setForm({ name: r.name, priority: r.priority, territory_id: r.territory_id, coverage_area_id: r.coverage_area_id, vertical_id: r.vertical_id, assignee_user_id: r.assignee_user_id, assignment_method: r.assignment_method as SalesRoutingRuleForm['assignment_method'], reason: r.reason, active: r.active }); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(r.id)} disabled={loading}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0 text-xs text-muted-foreground">
                    {r.vertical_id && <span>Vertical: {verticals.find((v) => v.id === r.vertical_id)?.label ?? r.vertical_id}</span>}
                    {r.territory_id && <span>Territory: {territories.find((t) => t.id === r.territory_id)?.name ?? '—'}</span>}
                    {r.assignee_user_id && <span>Assignee: {members.find((m) => m.user_id === r.assignee_user_id)?.display_name ?? r.assignee_user_id}</span>}
                    <span>{r.assignment_method}</span>
                  </div>
                  {r.reason && <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>}
                </>
              )}
            </li>
          ))}
      </ul>
      {rules.length === 0 && !isEditing && (
        <p className="text-sm text-muted-foreground">No routing rules. Add one to assign leads by vertical (and optional geography).</p>
      )}
    </div>
  );
}
