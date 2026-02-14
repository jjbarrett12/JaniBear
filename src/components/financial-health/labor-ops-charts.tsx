'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
} from 'recharts';
import type { LaborMonth, OvertimeWeek, AccountBubble } from '@/lib/financial-health-mock';

interface LaborOpsChartsProps {
  laborTrend: LaborMonth[];
  overtimeWeekly: OvertimeWeek[];
  accountBubbles: AccountBubble[];
  bidAccuracy: number;
}

const laborRed = 65;
const laborAmber = 55;

export function LaborOpsCharts({
  laborTrend,
  overtimeWeekly,
  accountBubbles,
  bidAccuracy,
}: LaborOpsChartsProps) {
  const scatterData = accountBubbles.map((b) => ({
    ...b,
    x: b.revenue,
    y: b.marginPct,
    z: Math.min(50, b.hours / 4),
  }));

  const bidHealth =
    bidAccuracy < 0.95 ? 'red' : bidAccuracy <= 1.05 ? 'amber' : 'green';

  return (
    <section className="space-y-6" id="labor">
      <h2 className="text-xl font-semibold text-foreground">Labor & Ops Efficiency</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Labor % of Revenue trend (12 months)</CardTitle>
            <p className="text-xs text-muted-foreground">Target &lt;55% green | 55–65% amber | &gt;65% red</p>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={laborTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <ReferenceLine y={laborRed} stroke="hsl(var(--health-red))" strokeDasharray="4 4" />
                  <ReferenceLine y={laborAmber} stroke="hsl(var(--health-amber))" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    domain={[50, 70]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Labor %']}
                  />
                  <Line
                    type="monotone"
                    dataKey="laborPct"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Overtime hours (weekly) + Overtime %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overtimeWeekly} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'hours' ? 'Overtime hrs' : 'Overtime %',
                    ]}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--health-amber))" name="hours" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pct" fill="hsl(var(--chart-2))" name="pct" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Accounts: Revenue vs Margin %</CardTitle>
            <p className="text-xs text-muted-foreground">Bubble size = hours; color = health</p>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Revenue"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `$${v}k`}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Margin %"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ZAxis type="number" dataKey="z" range={[80, 400]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(_, __, props: { payload: AccountBubble }) => [
                      `${props.payload.name}: $${props.payload.revenue}k rev, ${props.payload.marginPct}% margin`,
                      'Account',
                    ]}
                  />
                  {scatterData.map((point, i) => (
                    <Scatter
                      key={point.name}
                      data={[point]}
                      fill={
                        point.health === 'green'
                          ? 'hsl(var(--health-green))'
                          : point.health === 'amber'
                            ? 'hsl(var(--health-amber))'
                            : 'hsl(var(--health-red))'
                      }
                      shape="circle"
                    />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bid Accuracy Index</CardTitle>
            <p className="text-xs text-muted-foreground">Quoted hours ÷ Actual hours. Target 0.95–1.05</p>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] flex flex-col items-center justify-center">
              <div
                className={`text-4xl font-bold tabular-nums ${
                  bidHealth === 'green'
                    ? 'text-health-green'
                    : bidHealth === 'amber'
                      ? 'text-health-amber'
                      : 'text-health-red'
                }`}
              >
                {bidAccuracy.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Current index</p>
              <div className="w-full max-w-[200px] mt-4 h-3 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full bg-health-red rounded-l-full"
                  style={{ width: '31.6%' }}
                />
                <div
                  className="h-full bg-health-amber"
                  style={{ width: '33.4%' }}
                />
                <div
                  className="h-full bg-health-green rounded-r-full"
                  style={{ width: '35%' }}
                />
              </div>
              <div className="flex justify-between w-full max-w-[200px] mt-1 text-[10px] text-muted-foreground">
                <span>0.95</span>
                <span>1.05</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
