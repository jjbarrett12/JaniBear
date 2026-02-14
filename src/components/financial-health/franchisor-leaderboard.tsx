'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FranchiseeScore } from '@/lib/financial-health-mock';

interface FranchisorLeaderboardProps {
  franchisees: FranchiseeScore[];
}

/** Franchisor view: leaderboard by Bear Health Score (outcome review only; no labor control). */
export function FranchisorLeaderboard({ franchisees }: FranchisorLeaderboardProps) {
  const atRisk = franchisees.filter(
    (f) =>
      f.cashRunwayMonths < 2 || f.laborPct > 65 || f.arDays > 45
  );

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Franchisee outcomes (recommended view)</h2>
      <p className="text-sm text-muted-foreground">
        Ranked by self-reported Bear Health Score. Suggested standard only—not labor control.
      </p>

      {atRisk.length > 0 && (
        <Card className="rounded-xl border-health-red border-l-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">At-risk flags</CardTitle>
            <p className="text-xs text-muted-foreground">
              Cash runway &lt;2 mo, Labor % &gt;65, or AR &gt;45 days
            </p>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground">
              {atRisk.map((f) => (
                <li key={f.id}>
                  {f.name}:{' '}
                  {f.cashRunwayMonths < 2 && `Cash ${f.cashRunwayMonths} mo `}
                  {f.laborPct > 65 && `Labor ${f.laborPct}% `}
                  {f.arDays > 45 && `AR ${f.arDays} days`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Leaderboard by Bear Health Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Franchisee</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="w-16">Health</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
                <TableHead className="text-right">Cash runway</TableHead>
                <TableHead className="text-right">Labor %</TableHead>
                <TableHead className="text-right">AR days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {franchisees.map((f, i) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>{f.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.score}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        f.health === 'green' ? 'bg-health-green' : f.health === 'amber' ? 'bg-health-amber' : 'bg-health-red'
                      }`}
                      aria-hidden
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{f.marginPct}%</TableCell>
                  <TableCell className="text-right tabular-nums">{f.cashRunwayMonths}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.laborPct}%</TableCell>
                  <TableCell className="text-right tabular-nums">{f.arDays}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-xl border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Margin distribution (box plot placeholder)</CardTitle>
          <p className="text-xs text-muted-foreground">Suggested standard: margin distribution across franchisees</p>
        </CardHeader>
        <CardContent>
          <div className="h-12 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Min</span>
            <div className="flex-1 h-6 rounded bg-muted flex">
              <div className="w-1/4 bg-health-red rounded-l opacity-70" />
              <div className="w-1/2 bg-health-amber" />
              <div className="w-1/4 bg-health-green rounded-r opacity-70" />
            </div>
            <span className="text-xs text-muted-foreground">Max</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Median margin: {(() => {
              const sorted = [...franchisees].map((f) => f.marginPct).sort((a, b) => a - b);
              const m = sorted[Math.floor(sorted.length / 2)];
              return `${m}%`;
            })()}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
