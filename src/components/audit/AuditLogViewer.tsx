'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listAuditLog, listAuditLogActors, type AuditLogEntry } from '@/actions/audit-log';
import { FileText } from 'lucide-react';

const ENTITY_TYPES = ['account', 'invoice', 'proposal', 'inspection', 'contract'];
const ACTION_LABELS: Record<string, string> = {
  pricing_change: 'Pricing change',
  proposal_edit: 'Proposal edit',
  contract_frequency_change: 'Contract frequency',
  inspection_score_change: 'Inspection score',
  invoice_edit: 'Invoice edit',
  account_update: 'Account update',
  invoice_create: 'Invoice created',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function AuditLogViewer({ orgId }: { orgId: string }) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [actors, setActors] = useState<Array<{ user_id: string; full_name: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entityType, setEntityType] = useState('');
  const [actorUserId, setActorUserId] = useState('');

  const load = async () => {
    setLoading(true);
    const { entries: list, error: err } = await listAuditLog(orgId, {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      entityType: entityType || undefined,
      actorUserId: actorUserId || undefined,
    });
    setError(err ?? null);
    if (!err) setEntries(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [orgId, fromDate, toDate, entityType, actorUserId]);

  useEffect(() => {
    listAuditLogActors(orgId).then((r) => r.actors && setActors(r.actors));
  }, [orgId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit log
        </CardTitle>
        <CardDescription>Key actions across CRM, Ops, and Finance. Immutable; admin-only access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">From date</label>
            <input
              type="date"
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">To date</label>
            <input
              type="date"
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Entity type</label>
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
            >
              <option value="">All</option>
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Actor</label>
            <select
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm min-w-[140px]"
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
            >
              <option value="">All</option>
              {actors.map((a) => (
                <option key={a.user_id} value={a.user_id}>{a.full_name ?? a.user_id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-amber-600 dark:text-amber-400">{error}</p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit entries match the filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Action</th>
                  <th className="py-2 pr-4 font-medium">Entity</th>
                  <th className="py-2 pr-4 font-medium">Actor</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">{formatDate(e.created_at)}</td>
                    <td className="py-2 pr-4">{ACTION_LABELS[e.action] ?? e.action}</td>
                    <td className="py-2 pr-4">{e.entity_type}{e.entity_id ? ` ${e.entity_id.slice(0, 8)}…` : ''}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{e.actor_user_id ? (actors.find((a) => a.user_id === e.actor_user_id)?.full_name ?? e.actor_user_id.slice(0, 8) + '…') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
