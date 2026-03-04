'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import type { LeaderboardRow, RepSalesMetrics } from '@/types/sales';
import { Trophy } from 'lucide-react';

interface RepPerformanceTableProps {
  leaderboard: LeaderboardRow[];
  repId: string;
  myMetrics: RepSalesMetrics | null;
}

export function RepPerformanceTable({
  leaderboard,
  repId,
  myMetrics,
}: RepPerformanceTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Performance
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Close rate, revenue closed, follow-up discipline.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 px-3 font-medium">Rep</th>
                <th className="py-2 px-3 font-medium text-right">Rank</th>
                <th className="py-2 px-3 font-medium text-right">Score</th>
                <th className="py-2 px-3 font-medium text-right">Badge</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(0, 10).map((r) => (
                <tr
                  key={r.rep_id}
                  className={`border-b border-border/50 ${
                    r.rep_id === repId ? 'bg-primary/10 font-medium' : ''
                  }`}
                >
                  <td className="py-2 px-3">{r.rep_name ?? 'Unknown'}</td>
                  <td className="py-2 px-3 text-right tabular-nums">#{r.rank}</td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {(r.performance_score * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 text-right">
                    {r.badge && (
                      <Badge variant={r.badge === 'top' ? 'default' : 'secondary'} className="text-[10px]">
                        {r.badge === 'top' ? 'Top' : 'Top 3'}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {myMetrics && (
          <div className="border-t border-border px-3 py-2 mt-2 text-xs text-muted-foreground">
            You: Close rate {myMetrics.close_rate_30d != null ? `${Math.round(myMetrics.close_rate_30d * 100)}%` : '—'} · 
            Revenue closed MTD {formatCurrency(myMetrics.mrr_closed_mtd)}
          </div>
        )}
        {leaderboard.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">No rankings yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
