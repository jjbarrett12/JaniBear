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
  ReferenceLine,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { MarginMonth, WaterfallItem, ContractProfitRow } from '@/lib/financial-health-mock';

interface ProfitabilityChartsProps {
  marginTrend: MarginMonth[];
  waterfall: WaterfallItem[];
  contractProfitability: ContractProfitRow[];
}

const marginRed = 40;
const marginAmberMax = 55;

export function ProfitabilityCharts({
  marginTrend,
  waterfall,
  contractProfitability,
}: ProfitabilityChartsProps) {
  const sortedContracts = [...contractProfitability].sort((a, b) => a.marginPct - b.marginPct);

  return (
    <section className="space-y-6" id="profitability">
      <h2 className="text-xl font-semibold text-foreground">Profitability & Margin</h2>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gross Margin % trend (12 months)</CardTitle>
            <p className="text-xs text-muted-foreground">Green &gt;55% | Amber 40–55% | Red &lt;40%</p>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={marginTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <ReferenceLine y={marginRed} stroke="hsl(var(--health-red))" strokeDasharray="4 4" />
                  <ReferenceLine y={marginAmberMax} stroke="hsl(var(--health-amber))" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    domain={[0, 70]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Margin']}
                  />
                  <Line
                    type="monotone"
                    dataKey="marginPct"
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
            <CardTitle className="text-base">Revenue to Net Profit (Waterfall)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfall} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    tickFormatter={(v) => (v >= 0 ? `$${v / 1000}k` : `-$${Math.abs(v) / 1000}k`)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`$${value >= 0 ? value : Math.abs(value)}`, 'Amount']}
                  />
                  <Bar
                    dataKey="value"
                    fill={(entry: { value: number }) =>
                      entry.value >= 0 ? 'hsl(var(--health-green))' : 'hsl(var(--health-red))'
                    }
                    radius={[0, 0, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contract Profitability Matrix</CardTitle>
          <p className="text-xs text-muted-foreground">Sorted by worst margin</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Labor</TableHead>
                  <TableHead className="text-right">Supplies</TableHead>
                  <TableHead className="text-right">Margin $</TableHead>
                  <TableHead className="text-right">Margin %</TableHead>
                  <TableHead className="w-16">Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedContracts.map((row) => (
                  <TableRow key={row.client}>
                    <TableCell className="font-medium">{row.client}</TableCell>
                    <TableCell className="text-right tabular-nums">${row.revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">${row.labor.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">${row.supplies.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">${row.marginDollars.toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.marginPct}%</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block h-3 w-3 rounded-full ${
                          row.health === 'green' ? 'bg-health-green' : row.health === 'amber' ? 'bg-health-amber' : 'bg-health-red'
                        }`}
                        aria-hidden
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
