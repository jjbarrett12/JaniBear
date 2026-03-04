'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import type { PipelineStageHealth } from '@/types/sales';
import { BarChart3, AlertTriangle } from 'lucide-react';

export function PipelineHealthBoard({ stages }: { stages: PipelineStageHealth[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Pipeline health
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Count, value, avg days, conversion. Red = bottleneck.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3 font-medium">Stage</th>
                <th className="py-2 px-3 font-medium text-right">Count</th>
                <th className="py-2 px-3 font-medium text-right">Value</th>
                <th className="py-2 px-3 font-medium text-right">Avg days</th>
                <th className="py-2 px-3 font-medium text-right">Conversion %</th>
                <th className="py-2 px-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {stages.map((row) => (
                <tr
                  key={row.stage}
                  className={`border-b border-border/50 hover:bg-muted/30 ${
                    row.isBottleneck ? 'bg-red-500/5' : ''
                  }`}
                >
                  <td className="py-2 px-3 font-medium">{row.stageLabel}</td>
                  <td className="py-2 px-3 text-right tabular-nums">{row.count}</td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {formatCurrency(row.totalValue)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">{row.avgDaysInStage}d</td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {row.conversionPct != null ? `${row.conversionPct}%` : '—'}
                  </td>
                  <td className="py-2 px-3">
                    {row.isBottleneck && (
                      <AlertTriangle className="h-4 w-4 text-health-red" title="Bottleneck" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {stages.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No pipeline stages yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
