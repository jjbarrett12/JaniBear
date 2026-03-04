'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AiAuditLogRow } from '@/app/app/settings/ai/types';

export interface AuditLogPanelProps {
  auditLog: AiAuditLogRow[];
}

export function AuditLogPanel({ auditLog }: AuditLogPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit log</CardTitle>
        <p className="text-sm text-muted-foreground">Last 20 AI config changes.</p>
      </CardHeader>
      <CardContent>
        {auditLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No changes recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {auditLog.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-2 gap-y-0">
                <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                <span>{e.action}</span>
                <span className="text-muted-foreground">{e.entity_type}</span>
                {e.entity_id && <span className="text-muted-foreground">#{e.entity_id.slice(0, 8)}</span>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
