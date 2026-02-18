/**
 * Generate weekly scoreboard payload for an org. Used by cron to build and send per-rep emails.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { WeeklyScoreboardPayload, RepEmailPayload } from './types';

export async function generateWeeklyScoreboard(
  orgId: string,
  weekStart: string
): Promise<WeeklyScoreboardPayload> {
  const supabase = createAdminClient();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  const { data: repMetrics } = await supabase
    .from('rep_sales_metrics')
    .select('*')
    .eq('org_id', orgId);
  const metrics = (repMetrics ?? []) as Array<{
    rep_id: string;
    proposals_delivered_7d: number;
    proposals_delivered_30d: number;
    mrr_closed_mtd: number;
    weighted_pipeline: number;
    pipeline_coverage_ratio: number;
    close_rate_30d: number | null;
    monthly_mrr_target: number;
    commission_rate: number;
  }>;

  const leaderboard = computeLeaderboardFromMetrics(metrics);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', metrics.map((m) => m.rep_id));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const { data: users } = await supabase.auth.admin.listUsers();
  const emailByRep = new Map<string, string>();
  users?.users?.forEach((u) => {
    if (metrics.some((m) => m.rep_id === u.id)) emailByRep.set(u.id, u.email ?? '');
  });

  const top3 = leaderboard.slice(0, 3).map((r, i) => ({
    rank: i + 1,
    repName: profileMap.get(r.rep_id) ?? 'Unknown',
    performanceScore: r.performance_score,
  }));

  const teamProposalsWeek = metrics.reduce((s, m) => s + (m.proposals_delivered_7d ?? 0), 0);
  const teamPipelineTotal = metrics.reduce((s, m) => s + (m.weighted_pipeline ?? 0), 0);
  const teamMrrWeek = metrics.reduce((s, m) => s + (m.mrr_closed_mtd ?? 0), 0);

  const perRep: RepEmailPayload[] = metrics.map((m) => {
    const rank = leaderboard.findIndex((r) => r.rep_id === m.rep_id) + 1 || leaderboard.length;
    const totalReps = leaderboard.length;
    const target = m.monthly_mrr_target || 1;
    const pct = Math.round(((m.mrr_closed_mtd ?? 0) / target) * 100);
    const score = leaderboard.find((l) => l.rep_id === m.rep_id)?.performance_score ?? 0;
    const weakestKpi = getWeakestKpi(m);
    const projectedGain = 'Improving your weakest metric could add to projected commission.';

    return {
      repId: m.rep_id,
      email: emailByRep.get(m.rep_id) ?? '',
      fullName: profileMap.get(m.rep_id) ?? null,
      rank: rank || totalReps,
      totalReps,
      performanceScore: score,
      pipelineCoverageRatio: m.pipeline_coverage_ratio ?? 0,
      commissionForecast: (m.weighted_pipeline ?? 0) * (m.commission_rate ?? 0.1),
      mrrClosedMtd: m.mrr_closed_mtd ?? 0,
      monthlyTarget: m.monthly_mrr_target ?? 0,
      pctToTarget: pct,
      actionLine: `Focus this week: ${weakestKpi}.`,
      weakestKpi,
      projectedGain,
    };
  });

  return {
    orgId,
    weekStart,
    top3,
    teamTotals: {
      proposalsDeliveredWeek: teamProposalsWeek,
      pipelineTotal: teamPipelineTotal,
      mrrClosedWeek: teamMrrWeek,
    },
    perRep,
  };
}

function getWeakestKpi(m: {
  pipeline_coverage_ratio: number;
  proposals_delivered_7d: number;
  close_rate_30d: number | null;
  mrr_closed_mtd: number;
  monthly_mrr_target: number;
}): string {
  const coverage = m.pipeline_coverage_ratio ?? 0;
  const delivered = m.proposals_delivered_7d ?? 0;
  const close = m.close_rate_30d ?? 0;
  const pct = m.monthly_mrr_target ? (m.mrr_closed_mtd ?? 0) / m.monthly_mrr_target : 0;
  if (coverage < 2) return 'pipeline coverage';
  if (delivered === 0) return 'proposals delivered';
  if (close < 0.3) return 'close rate';
  if (pct < 0.5) return 'MRR to target';
  return 'maintain momentum';
}

function computeLeaderboardFromMetrics(
  metrics: Array<{
    rep_id: string;
    mrr_closed_mtd: number;
    weighted_pipeline: number;
    proposals_delivered_7d: number;
    close_rate_30d: number | null;
  }>
): { rep_id: string; performance_score: number }[] {
  if (metrics.length === 0) return [];
  const mrr = metrics.map((m) => m.mrr_closed_mtd ?? 0);
  const pipe = metrics.map((m) => m.weighted_pipeline ?? 0);
  const del = metrics.map((m) => m.proposals_delivered_7d ?? 0);
  const close = metrics.map((m) => m.close_rate_30d ?? 0);
  const minMrr = Math.min(...mrr);
  const maxMrr = Math.max(...mrr);
  const minPipe = Math.min(...pipe);
  const maxPipe = Math.max(...pipe);
  const minDel = Math.min(...del);
  const maxDel = Math.max(...del);
  const minClose = Math.min(...close);
  const maxClose = Math.max(...close);
  const n = (v: number, min: number, max: number) =>
    max > min ? (v - min) / (max - min) : 0;
  return metrics
    .map((m) => ({
      rep_id: m.rep_id,
      performance_score:
        n(m.mrr_closed_mtd ?? 0, minMrr, maxMrr) * 0.4 +
        n(m.weighted_pipeline ?? 0, minPipe, maxPipe) * 0.25 +
        n(m.proposals_delivered_7d ?? 0, minDel, maxDel) * 0.2 +
        n(m.close_rate_30d ?? 0, minClose, maxClose) * 0.15,
    }))
    .sort((a, b) => b.performance_score - a.performance_score);
}
