'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listAlerts, type AlertRow, type AlertType, type AlertSeverity } from '@/actions/alerts';
import { AlertSignalsView } from './AlertSignalsView';
import { Activity } from 'lucide-react';

const TYPE_LABELS: Record<AlertType, string> = {
  account_health_decay: 'Account health',
  missed_inspection: 'Missed inspection',
  ar_aging: 'AR aging',
  margin_leakage: 'Margin',
};

const HEAT_CLASS: Record<AlertSeverity, string> = {
  critical: 'border-l-4 border-l-red-500 bg-red-500/5',
  high: 'border-l-4 border-l-amber-500 bg-amber-500/5',
  medium: 'border-l-4 border-l-yellow-500 bg-yellow-500/5',
  low: 'border-l-4 border-l-slate-400 bg-slate-500/5',
};

export function RiskRadarPanel({ orgId }: { orgId: string }) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listAlerts(orgId, {
      status: 'open',
      ...(filterType !== 'all' && { type: filterType }),
      ...(filterSeverity !== 'all' && { severity: filterSeverity }),
    }).then(({ alerts: list, error }) => {
      if (!error) setAlerts(list);
      setLoading(false);
    });
  }, [orgId, filterType, filterSeverity]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Risk radar
        </CardTitle>
        <CardDescription>Open alerts by severity. Click to see what changed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
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
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as AlertSeverity | 'all')}
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open alerts.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={`rounded-r-lg p-3 ${HEAT_CLASS[a.severity]}`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                >
                  <span className="text-xs font-medium uppercase text-muted-foreground">{a.severity}</span>
                  <p className="font-medium mt-0.5">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[a.type]}</p>
                </button>
                {expandedId === a.id && <AlertSignalsView signals={a.signals} />}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
