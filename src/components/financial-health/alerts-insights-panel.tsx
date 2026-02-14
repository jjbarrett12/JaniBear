'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FinancialInsight } from '@/lib/financial-health-mock';
import Link from 'next/link';

interface AlertsInsightsPanelProps {
  insights: FinancialInsight[];
}

export function AlertsInsightsPanel({ insights }: AlertsInsightsPanelProps) {
  return (
    <Card className="rounded-xl border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Alerts &amp; insights</CardTitle>
        <p className="text-xs text-muted-foreground">Action-oriented; click to jump to chart</p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li key={insight.id}>
              <Link
                href={insight.link ?? '#'}
                className="block p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <Badge
                    variant="outline"
                    className={`shrink-0 ${
                      insight.severity === 'red'
                        ? 'border-health-red text-health-red bg-health-red/10'
                        : insight.severity === 'amber'
                          ? 'border-health-amber text-health-amber bg-health-amber/10'
                          : 'border-health-green text-health-green bg-health-green/10'
                    }`}
                  >
                    {insight.severity.toUpperCase()}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
