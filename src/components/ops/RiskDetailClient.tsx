'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Snapshot {
  risk_score?: number;
  risk_level?: string;
  reasons?: string[];
  metrics?: Record<string, unknown>;
  recommended_backups?: Array<{
    operator_type: string;
    operator_id: string;
    operator_name?: string;
    score?: number;
    distance?: number;
    capacity?: number;
    rationale?: string[];
  }>;
  status?: string;
}

interface Props {
  orgId: string;
  accountId: string;
  accountName: string;
  snapshot: Snapshot | null;
  events: Array<{ id: string; action: string; meta: unknown; created_at: string }>;
}

export function RiskDetailClient({ orgId, accountId, accountName, snapshot, events }: Props) {
  const [status, setStatus] = useState(snapshot?.status ?? '');
  const [loading, setLoading] = useState<string | null>(null);

  async function post(endpoint: string, body?: object) {
    setLoading(endpoint);
    try {
      const res = await fetch(`/api/app/risk/accounts/${accountId}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error(await res.text());
      if (endpoint === '/acknowledge' || endpoint === '/dismiss') setStatus(endpoint === '/acknowledge' ? 'acknowledged' : 'dismissed');
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  if (!snapshot) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center text-muted-foreground">
        No risk snapshot for this account. Run risk detection to generate one.
        <div className="mt-4">
          <Link href={`/app/accounts/${accountId}`}>
            <Button variant="outline">View account</Button>
          </Link>
        </div>
      </div>
    );
  }

  const backups = (snapshot.recommended_backups ?? []) as Snapshot['recommended_backups'];
  const level = (snapshot.risk_level ?? 'low') as string;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className={level === 'critical' ? 'bg-destructive' : level === 'high' ? 'bg-amber-600' : 'bg-muted'}>
          {level} — Score {snapshot.risk_score ?? 0}
        </Badge>
        {status && <span className="text-sm text-muted-foreground">Status: {status}</span>}
      </div>

      {snapshot.reasons && snapshot.reasons.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="font-medium text-foreground mb-2">Reasons</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {snapshot.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {backups.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="font-medium text-foreground mb-3">Recommended backups (top 3)</h3>
          <div className="space-y-2">
            {backups.map((b, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded bg-muted/50 p-2 text-sm">
                <div>
                  <span className="font-medium">{b.operator_name ?? b.operator_id}</span>
                  <span className="ml-2 text-muted-foreground capitalize">({b.operator_type})</span>
                  {b.rationale && b.rationale.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">{b.rationale.join(' · ')}</div>
                  )}
                </div>
                <Button
                  size="sm"
                  disabled={!!loading}
                  onClick={() => post('/assign-backup', { operator_type: b.operator_type, operator_id: b.operator_id })}
                >
                  Assign backup
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(status === 'active' || !status) && (
          <>
            <Button variant="outline" disabled={!!loading} onClick={() => post('/acknowledge')}>
              Acknowledge
            </Button>
            <Button variant="outline" disabled={!!loading} onClick={() => post('/dismiss')}>
              Dismiss
            </Button>
          </>
        )}
        <Button disabled={!!loading} onClick={() => post('/intervention')}>
          Create intervention
        </Button>
        <Link href={`/app/accounts/${accountId}`}>
          <Button variant="ghost">View account</Button>
        </Link>
      </div>

      {events.length > 0 && (
        <div className="rounded-lg border border-border p-4">
          <h3 className="font-medium text-foreground mb-2">Recent events</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            {events.slice(0, 10).map((e) => (
              <li key={e.id}>
                {e.action} — {new Date(e.created_at).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
