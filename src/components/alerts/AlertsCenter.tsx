'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  listAlerts,
  dismissAlert,
  assignAlert,
  listOrgMembersForAssign,
  generateAlertsForOrg,
  type AlertRow,
  type AlertStatus,
  type AlertType,
  type AlertSeverity,
} from '@/actions/alerts';
import { AlertSignalsView } from './AlertSignalsView';
import { AlertCircle, RefreshCw, X } from 'lucide-react';

const TYPE_LABELS: Record<AlertType, string> = {
  account_health_decay: 'Account health',
  missed_inspection: 'Missed inspection',
  ar_aging: 'AR aging',
  margin_leakage: 'Margin',
};

const SEVERITY_CLASS: Record<AlertSeverity, string> = {
  critical: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  high: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  medium: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/30',
  low: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

export function AlertsCenter({ orgId }: { orgId: string }) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('open');
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Array<{ userId: string; name: string }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { alerts: list, error } = await listAlerts(orgId, {
      ...(filterStatus !== 'all' && { status: filterStatus }),
      ...(filterType !== 'all' && { type: filterType }),
    });
    if (!error) setAlerts(list);
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [orgId, filterStatus, filterType]);

  useEffect(() => {
    listOrgMembersForAssign(orgId).then((r) => r.members && setMembers(r.members));
  }, [orgId]);

  const handleDismiss = async (id: string) => {
    await dismissAlert(orgId, id);
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'dismissed' as const, dismissed_at: new Date().toISOString() } : a))
    );
  };

  const handleAssign = async (id: string, userId: string | null) => {
    await assignAlert(orgId, id, userId);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: userId ? 'assigned' : 'open', assigned_to: userId } as AlertRow : a)));
  };

  const handleRefreshAlerts = async () => {
    setRefreshing(true);
    await generateAlertsForOrg(orgId);
    await load();
    setRefreshing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alerts
          </CardTitle>
          <CardDescription>Dismiss or assign alerts. Expand to see contributing signals.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshAlerts} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh alerts
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AlertStatus | 'all')}
          >
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AlertType | 'all')}
          >
            <option value="all">All types</option>
            {(Object.keys(TYPE_LABELS) as AlertType[]).map((t) => (
              <option key={t} value={t}>{TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No alerts match the filters.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium border ${SEVERITY_CLASS[a.severity]}`}>
                        {a.severity}
                      </span>
                      <span className="text-xs text-muted-foreground">{TYPE_LABELS[a.type]}</span>
                    </div>
                    <p className="font-medium mt-1">{a.title}</p>
                    {a.body && <p className="text-sm text-muted-foreground mt-0.5">{a.body}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    {a.status === 'open' && (
                      <>
                        <select
                          className="rounded border border-input bg-background px-2 py-1 text-xs"
                          value={a.assigned_to ?? ''}
                          onChange={(e) => handleAssign(a.id, e.target.value || null)}
                        >
                          <option value="">Assign to…</option>
                          {members.map((m) => (
                            <option key={m.userId} value={m.userId}>{m.name}</option>
                          ))}
                        </select>
                        <Button variant="ghost" size="sm" onClick={() => handleDismiss(a.id)} className="text-muted-foreground">
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    >
                      {expandedId === a.id ? 'Hide' : 'What changed?'}
                    </Button>
                  </div>
                </div>
                {expandedId === a.id && <AlertSignalsView signals={a.signals} />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
