'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createVertical, updateVertical, deleteVertical } from '@/actions/coverage-verticals';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export interface VerticalRow {
  id: string;
  key: string;
  label: string;
  active: boolean;
}

interface Props {
  orgId: string;
  verticals: VerticalRow[];
}

export function VerticalsManager({ orgId, verticals: initialVerticals }: Props) {
  const [verticals, setVerticals] = useState<VerticalRow[]>(initialVerticals);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!formKey.trim() || !formLabel.trim()) return;
    setLoading(true);
    setError(null);
    const res = await createVertical(orgId, formKey.trim(), formLabel.trim());
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setVerticals((prev) => [...prev, { id: crypto.randomUUID(), key: formKey.trim(), label: formLabel.trim(), active: true }]);
    setFormKey('');
    setFormLabel('');
    setAdding(false);
  }

  async function handleUpdate(id: string, key: string, label: string, active: boolean) {
    setLoading(true);
    setError(null);
    const res = await updateVertical(orgId, id, key, label, active);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setVerticals((prev) => prev.map((v) => (v.id === id ? { ...v, key, label, active } : v)));
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this vertical? Leads using it will have vertical_id cleared.')) return;
    setLoading(true);
    setError(null);
    const res = await deleteVertical(orgId, id);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setVerticals((prev) => prev.filter((v) => v.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Verticals</h3>
        {!adding && (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {adding && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="space-y-1">
            <Label className="text-xs">Key</Label>
            <Input
              placeholder="e.g. healthcare"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              className="h-8 w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              placeholder="e.g. Healthcare"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              className="h-8 w-36"
            />
          </div>
          <Button size="sm" onClick={handleCreate} disabled={loading}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setFormKey(''); setFormLabel(''); }}>
            Cancel
          </Button>
        </div>
      )}
      <ul className="space-y-1">
        {verticals.map((v) => (
          <li key={v.id} className="flex items-center gap-2 rounded border border-border/60 bg-card px-2 py-1.5 text-sm">
            {editingId === v.id ? (
              <>
                <Input
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  className="h-7 w-28"
                  placeholder="key"
                />
                <Input
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className="h-7 flex-1 min-w-0"
                  placeholder="label"
                />
                <Button size="sm" variant="ghost" className="h-7" onClick={() => handleUpdate(v.id, formKey, formLabel, v.active)} disabled={loading}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => { setEditingId(null); setFormKey(''); setFormLabel(''); }}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <span className="font-mono text-muted-foreground">{v.key}</span>
                <span className="flex-1 truncate">{v.label}</span>
                {!v.active && <span className="text-xs text-muted-foreground">(inactive)</span>}
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingId(v.id); setFormKey(v.key); setFormLabel(v.label); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(v.id)} disabled={loading}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
      {verticals.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No verticals yet. Add one to use vertical-based routing.</p>
      )}
    </div>
  );
}
