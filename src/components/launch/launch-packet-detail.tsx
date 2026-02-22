'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type LaunchPacketRecord = {
  id: string;
  org_id: string;
  account_id: string;
  status: string;
  payload_jsonb: Record<string, unknown>;
  ready_at: string | null;
  accepted_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
  account?: { name: string; status: string } | null;
};

type Props = {
  packet: LaunchPacketRecord;
  mode: 'sales' | 'ops';
  children?: React.ReactNode;
};

export function LaunchPacketDetail({ packet, mode, children }: Props) {
  const payload = (packet.payload_jsonb ?? {}) as {
    locations?: unknown[];
    scope?: unknown;
    schedule_draft?: unknown;
    sla?: unknown;
    staffing?: unknown;
    supplies?: unknown;
    docs_refs?: unknown[];
    risk_flags?: unknown[];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={packet.status === 'accepted' ? 'default' : packet.status === 'rejected' ? 'destructive' : 'secondary'}>
          {packet.status.replace(/_/g, ' ')}
        </Badge>
        {packet.account && (
          <span className="text-sm text-muted-foreground">Account: {packet.account.name}</span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(payload.locations) && payload.locations.length > 0 ? (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
              {JSON.stringify(payload.locations, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">No locations in payload.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scope</CardTitle>
        </CardHeader>
        <CardContent>
          {payload.scope != null ? (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
              {JSON.stringify(payload.scope, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">No scope in payload.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule draft</CardTitle>
        </CardHeader>
        <CardContent>
          {payload.schedule_draft != null ? (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
              {JSON.stringify(payload.schedule_draft, null, 2)}
            </pre>
          ) : (
            <p className="text-muted-foreground text-sm">No schedule draft.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SLA & staffing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payload.sla != null && (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-24">
              {JSON.stringify(payload.sla, null, 2)}
            </pre>
          )}
          {payload.staffing != null && (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-24">
              {JSON.stringify(payload.staffing, null, 2)}
            </pre>
          )}
          {!payload.sla && !payload.staffing && (
            <p className="text-muted-foreground text-sm">No SLA or staffing in payload.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplies & risk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {payload.supplies != null && (
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-24">
              {JSON.stringify(payload.supplies, null, 2)}
            </pre>
          )}
          {Array.isArray(payload.risk_flags) && payload.risk_flags.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Risk flags</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-24">
                {JSON.stringify(payload.risk_flags, null, 2)}
              </pre>
            </div>
          )}
          {payload.docs_refs != null && Array.isArray(payload.docs_refs) && payload.docs_refs.length > 0 && (
            <p className="text-sm text-muted-foreground">Docs refs: {payload.docs_refs.length} item(s)</p>
          )}
        </CardContent>
      </Card>

      {(packet.rejected_reason ?? '').trim() && (
        <Card>
          <CardHeader>
            <CardTitle>Rejection reason</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{packet.rejected_reason}</p>
          </CardContent>
        </Card>
      )}

      {children}
    </div>
  );
}
