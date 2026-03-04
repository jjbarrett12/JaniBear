'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type AuditRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  actor_user_id: string | null;
  before_state: unknown;
  after_state: unknown;
  created_at: string;
};

export function AdminAuditTab({ orgId }: { orgId: string }) {
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/orgs/${orgId}/audit?limit=50`)
      .then((r) => r.json())
      .then((d) => setAudit(d.audit ?? []))
      .finally(() => setLoading(false));
  }, [orgId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>
          Role changes, invites, removals, and settings changes. Immutable trail.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : audit.length === 0 ? (
          <p className="text-muted-foreground py-4">No audit entries yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Actor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audit.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.action}</TableCell>
                  <TableCell className="text-sm">
                    {row.entity_type}
                    {row.entity_id && (
                      <span className="text-muted-foreground ml-1 truncate max-w-[120px] inline-block">
                        {row.entity_id.slice(0, 8)}…
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.actor_user_id ? `${row.actor_user_id.slice(0, 8)}…` : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
