'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';
import type { ArAgingBucket, CashPoint } from '@/lib/financial-health-mock';

interface CashCollectionsChartsProps {
  arAging: ArAgingBucket[];
  cashForecast: CashPoint[];
}

const agingColors = [
  'hsl(var(--health-green))',
  'hsl(var(--chart-2))',
  'hsl(var(--health-amber))',
  'hsl(var(--health-red))',
  'hsl(var(--health-red))',
];

export function CashCollectionsCharts({
  arAging,
  cashForecast,
}: CashCollectionsChartsProps) {
  const forecast = cashForecast.filter((p) => p.forecast);

  return (
    <section className="space-y-6" id="cash">
      <h2 className="text-xl font-semibold text-foreground">Cash & Collections</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AR Aging</CardTitle>
            <p className="text-xs text-muted-foreground">Current / 1-30 / 31-60 / 61-90 / 90+</p>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={arAging}
                  margin={{ top: 5, right: 5, left: -10, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}k`} />
                  <YAxis type="category" dataKey="bucket" width={60} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string, props: { payload: ArAgingBucket }) => [
                      `$${value}k (${props.payload.count} invoices)`,
                      props.payload.bucket,
                    ]}
                  />
                  <Bar dataKey="amount" name="Amount" radius={[0, 4, 4, 0]}>
                    {arAging.map((_, i) => (
                      <Cell key={i} fill={agingColors[i % agingColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cash on hand + 90-day forecast</CardTitle>
            <p className="text-xs text-muted-foreground">Solid = actual; dashed = forecast</p>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashForecast} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => `$${v / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string, props: { payload: CashPoint }) => [
                      `$${(value / 1000).toFixed(1)}k${props.payload.forecast ? ' (forecast)' : ''}`,
                      'Cash',
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cash"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    strokeDasharray={undefined}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="cash"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                    connectNulls
                    data={forecast}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payroll gap (timing risk)</CardTitle>
          <p className="text-xs text-muted-foreground">Payroll date vs expected receivables</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 rounded bg-health-amber" />
              <span className="text-sm text-muted-foreground">Next payroll: $24k (Feb 15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-12 rounded bg-health-green" />
              <span className="text-sm text-muted-foreground">Expected AR by then: $28k</span>
            </div>
            <p className="text-sm text-muted-foreground">
              No gap this period. Watch 31–60 day bucket for next month.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
