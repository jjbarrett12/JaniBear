'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import type { AttentionAlert } from '@/lib/kpi-metrics';

export interface AIExecutiveInsightProps {
  /** Summary line (e.g. anomalies summary). If not provided, derived from alerts. */
  summary?: string;
  /** Attention alerts to summarize as anomalies */
  alerts: AttentionAlert[];
}

export function AIExecutiveInsight({ summary, alerts }: AIExecutiveInsightProps) {
  const total = alerts.reduce((s, a) => s + a.count, 0);
  const hasAnomalies = total > 0;
  const displaySummary =
    summary ??
    (hasAnomalies
      ? `${total} item${total === 1 ? '' : 's'} need attention: ${alerts.slice(0, 3).map((a) => a.label).join('; ')}${alerts.length > 3 ? '…' : ''}`
      : 'No anomalies detected. Key metrics within target ranges.');

  return (
    <Card className="border-border bg-card overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-foreground">AI Executive Insight</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">{displaySummary}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
