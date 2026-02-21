'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RevenueMonth, MarginMonth } from '@/lib/financial-health-mock';

interface RevenueMarginTrendChartProps {
  revenueMonths: RevenueMonth[];
  marginMonths: MarginMonth[];
}

type Granularity = 'weekly' | 'monthly';

/** Merges revenue and margin for tooltip: revenue, direct costs, GM% */
function mergeData(
  revenueMonths: RevenueMonth[],
  marginMonths: MarginMonth[]
): { period: string; revenue: number; marginPct: number; directCosts: number }[] {
  return revenueMonths.map((r, i) => {
    const margin = marginMonths[i]?.marginPct ?? 50;
    const revenueK = r.revenue;
    const directCostsK = revenueK * (1 - margin / 100);
    return {
      period: r.month,
      revenue: revenueK,
      marginPct: margin,
      directCosts: directCostsK,
    };
  });
}

export function RevenueMarginTrendChart({ revenueMonths, marginMonths }: RevenueMarginTrendChartProps) {
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const data = mergeData(revenueMonths, marginMonths);

  return (
    <Card className="rounded-xl border shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">Revenue + Margin trend</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tooltip: revenue, direct costs, GM%
          </p>
        </div>
        <div className="flex rounded-md border border-border p-0.5">
          <Button
            variant={granularity === 'weekly' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setGranularity('weekly')}
          >
            Weekly
          </Button>
          <Button
            variant={granularity === 'monthly' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setGranularity('monthly')}
          >
            Monthly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `$${v}k`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                className="fill-muted-foreground"
                tickFormatter={(v) => `${v}%`}
                domain={[0, 70]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length || !label) return null;
                  const d = payload[0]?.payload as { revenue: number; directCosts: number; marginPct: number };
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
                      <p className="font-medium text-foreground mb-1">{label}</p>
                      <p className="text-xs">Revenue: ${d.revenue.toFixed(1)}k</p>
                      <p className="text-xs">Direct costs: ${d.directCosts.toFixed(1)}k</p>
                      <p className="text-xs">GM%: {d.marginPct.toFixed(1)}%</p>
                    </div>
                  );
                }}
              />
              <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="revenue" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="marginPct"
                stroke="hsl(var(--health-green))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="marginPct"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
