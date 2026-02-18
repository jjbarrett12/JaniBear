'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import {
  Target,
  TrendingUp,
  FileText,
  AlertTriangle,
  Trophy,
  Flame,
  BarChart3,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react';
import type { RepSalesMetrics, RepPipelineByStage, LeaderboardRow, StalledDeal } from '@/types/sales';

const STAGE_LABELS: Record<string, string> = {
  prospect: 'Prospect',
  walkthrough: 'Walkthrough',
  drafted: 'Drafted',
  delivered: 'Delivered',
  negotiating: 'Negotiating',
  verbal_yes: 'Verbal Yes',
  signed: 'Signed',
  lost: 'Lost',
};

type CommandCenterData = {
  metrics: RepSalesMetrics | null;
  pipelineByStage: RepPipelineByStage[];
  leaderboard: LeaderboardRow[];
  stalledDeals: StalledDeal[];
  myRank: LeaderboardRow | null;
  totalReps: number;
};

const RED_ZONE_STALLED_THRESHOLD = 3;

export function SalesCommandCenter({
  orgId,
  repId,
  data,
  isAdmin,
  repName,
}: {
  orgId: string;
  repId: string;
  data: CommandCenterData;
  isAdmin: boolean;
  repName?: string;
}) {
  const { metrics, pipelineByStage, leaderboard, stalledDeals, myRank, totalReps } = data;
  const m = metrics;

  const weeklyGoal = m ? Math.ceil((m.monthly_mrr_target || 0) / 4) : 0;
  const proposalsThisWeek = m?.proposals_delivered_7d ?? 0;
  const weeklyProposalGoal = Math.max(1, weeklyGoal > 0 ? 4 : 4);
  const progressPct = weeklyProposalGoal ? Math.min(100, (proposalsThisWeek / weeklyProposalGoal) * 100) : 0;

  const coverage = m?.pipeline_coverage_ratio ?? 0;
  const coverageColor =
    coverage >= 3 ? 'text-green-600 dark:text-green-400' : coverage >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  const redZone =
    (m && m.proposals_delivered_7d === 0) ||
    (m && m.pipeline_coverage_ratio < 2) ||
    (stalledDeals.length >= RED_ZONE_STALLED_THRESHOLD);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Sales Command Center</h1>
        <p className="text-muted-foreground mt-1">
          {repName ? `${repName} · ` : ''}Pipeline & activity at a glance
        </p>
      </div>

      {redZone && (
        <div className="rounded-lg border border-amber-500/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Focus areas this week</p>
            <ul className="text-sm text-amber-700 dark:text-amber-300 mt-1 list-disc list-inside space-y-0.5">
              {m?.proposals_delivered_7d === 0 && (
                <li>Get at least one proposal out this week to keep pipeline moving.</li>
              )}
              {m && m.pipeline_coverage_ratio < 2 && (
                <li>Pipeline coverage is below 2x target — add or advance deals to build cushion.</li>
              )}
              {stalledDeals.length >= RED_ZONE_STALLED_THRESHOLD && (
                <li>You have {stalledDeals.length} stalled deals — schedule a follow-up touch.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Proposals Delivered (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{proposalsThisWeek}</p>
            <div className="mt-2">
              <Progress value={progressPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                vs weekly goal ({weeklyProposalGoal})
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pipeline Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${coverageColor}`}>
              {m ? (m.pipeline_coverage_ratio ?? 0).toFixed(1) : '0.0'}x
            </p>
            <p className="text-xs text-muted-foreground mt-1">Target: 2x+ green, 3x+ strong</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              MTD MRR Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(m?.mrr_closed_mtd ?? 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {m?.monthly_mrr_target
                ? `${Math.round(((m.mrr_closed_mtd ?? 0) / m.monthly_mrr_target) * 100)}% of target`
                : 'Set a target in settings'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Commission Forecast (private)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(((m?.weighted_pipeline ?? 0) * (m?.commission_rate ?? 0.1)))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">From weighted pipeline</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Close Rate (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {m?.close_rate_30d != null ? `${Math.round(m.close_rate_30d * 100)}%` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Contract (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {m?.avg_contract_size_30d != null ? formatCurrency(m.avg_contract_size_30d) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue per Proposal (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {m?.revenue_per_proposal_30d != null ? formatCurrency(m.revenue_per_proposal_30d) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Sales Cycle (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {m?.avg_sales_cycle_days_30d != null
                ? `${Math.round(m.avg_sales_cycle_days_30d)}d`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pipeline by Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineChart data={pipelineByStage} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaderboardPanel leaderboard={leaderboard} myRank={myRank} totalReps={totalReps} repId={repId} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5" />
                Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {m?.proposals_delivered_7d ? `${m.proposals_delivered_7d} delivered this week` : '0 this week'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Keep delivering to build your streak.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stalled Deals</CardTitle>
          <p className="text-sm text-muted-foreground">No activity in 10+ days — time for a follow-up.</p>
        </CardHeader>
        <CardContent>
          {stalledDeals.length === 0 ? (
            <p className="text-muted-foreground text-sm">No stalled deals. Nice work.</p>
          ) : (
            <ul className="space-y-3">
              {stalledDeals.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{d.name || 'Unnamed deal'}</p>
                    <p className="text-muted-foreground text-xs">
                      {STAGE_LABELS[d.stage] ?? d.stage} · {formatCurrency(d.estimated_mrr)} MRR
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {d.last_activity_at ? new Date(d.last_activity_at).toLocaleDateString() : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PipelineChart({ data }: { data: RepPipelineByStage[] }) {
  const maxMrr = Math.max(1, ...data.map((d) => d.sum_weighted_mrr));
  const stages = ['prospect', 'walkthrough', 'drafted', 'delivered', 'negotiating', 'verbal_yes'];

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">No active pipeline yet.</p>
    );
  }

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const row = data.find((d) => d.stage === stage);
        const sum = row?.sum_weighted_mrr ?? 0;
        const count = row?.count_active ?? 0;
        const pct = maxMrr ? (sum / maxMrr) * 100 : 0;
        return (
          <div key={stage} className="flex items-center gap-4">
            <span className="w-24 text-xs font-medium text-muted-foreground shrink-0">
              {STAGE_LABELS[stage] ?? stage}
            </span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary/80 rounded transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-20 text-right">
              {count} · {formatCurrency(sum)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardPanel({
  leaderboard,
  myRank,
  totalReps,
  repId,
}: {
  leaderboard: LeaderboardRow[];
  myRank: LeaderboardRow | null;
  totalReps: number;
  repId: string;
}) {
  if (leaderboard.length === 0) {
    return <p className="text-muted-foreground text-sm">No rankings yet.</p>;
  }

  return (
    <div className="space-y-3">
      {myRank && (
        <p className="text-sm font-medium rounded-lg bg-muted/60 px-3 py-2">
          You&apos;re #{myRank.rank} of {totalReps} this week
        </p>
      )}
      <ul className="space-y-2">
        {leaderboard.slice(0, 10).map((r) => (
          <li
            key={r.rep_id}
            className={`flex items-center justify-between rounded px-2 py-1.5 text-sm ${r.rep_id === repId ? 'bg-primary/10 font-medium' : ''}`}
          >
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground w-5">#{r.rank}</span>
              <span>{r.rep_name || 'Unknown'}</span>
              {r.badge && (
                <Badge variant={r.badge === 'top' ? 'default' : 'secondary'} className="text-[10px]">
                  {r.badge === 'top' ? 'Top' : 'Top 3'}
                </Badge>
              )}
            </span>
            <span className="text-muted-foreground font-mono text-xs">
              {(r.performance_score * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
