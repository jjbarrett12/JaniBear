'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AdminEmptyState } from '@/components/admin/admin-empty-state';
import { ADMIN_MICROCOPY } from '@/lib/admin-microcopy';
import { FileText, Filter } from 'lucide-react';

export type AuditEvent = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_user_id: string | null;
  created_at: string | null;
  meta: { before?: unknown; after?: unknown };
};

export function AdminAuditClient({ initialEvents }: { initialEvents: AuditEvent[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [actionFilter, setActionFilter] = useState(searchParams.get('action') ?? '');
  const [from, setFrom] = useState(searchParams.get('from') ?? '');
  const [to, setTo] = useState(searchParams.get('to') ?? '');

  function applyFilters() {
    const p = new URLSearchParams();
    if (actionFilter.trim()) p.set('action', actionFilter.trim());
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    router.push(`/app/admin/audit?${p.toString()}`);
  }

  const events = initialEvents;

  return (
    <div className="space-y-4">
      <div className="p-4 border-b border-white/10 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-muted-foreground block mb-1">Action type</label>
          <Input
            placeholder="e.g. role_change"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-white/5 border-white/10 h-9"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">From</label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-white/5 border-white/10 h-9 w-[140px]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">To</label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-white/5 border-white/10 h-9 w-[140px]"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={applyFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Apply
        </Button>
      </div>

      {events.length === 0 ? (
        <AdminEmptyState
          icon={<FileText className="h-7 w-7" />}
          title={ADMIN_MICROCOPY.empty.audit.title}
          description={ADMIN_MICROCOPY.empty.audit.description}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Time</TableHead>
              <TableHead className="text-muted-foreground font-medium">Actor</TableHead>
              <TableHead className="text-muted-foreground font-medium">Action</TableHead>
              <TableHead className="text-muted-foreground font-medium">Target</TableHead>
              <TableHead className="text-muted-foreground font-medium">Meta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id} className="border-white/10 hover:bg-white/5">
                <TableCell className="text-muted-foreground text-sm tabular-nums">
                  {e.created_at
                    ? new Date(e.created_at).toLocaleString(undefined, {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })
                    : '—'}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {e.actor_user_id ? e.actor_user_id.slice(0, 8) + '…' : '—'}
                </TableCell>
                <TableCell className="font-medium">{e.action}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.entity_type}
                  {e.entity_id ? ` · ${String(e.entity_id).slice(0, 8)}…` : ''}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                  {e.meta?.after || e.meta?.before ? 'Yes' : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
