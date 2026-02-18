/**
 * Generate daily pulse payload for an org. Used by cron to build and send per-rep emails.
 */
import { createAdminClient } from '@/lib/supabase/admin';
import type { DailyPulsePayload, RepEmailPayload } from './types';

export async function generateDailyPulse(
  orgId: string,
  date: string
): Promise<DailyPulsePayload> {
  const supabase = createAdminClient();

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data: proposals } = await supabase
    .from('sales_proposals')
    .select('rep_id, delivered_at')
    .eq('org_id', orgId)
    .not('delivered_at', 'is', null)
    .gte('delivered_at', dayStart)
    .lte('delivered_at', dayEnd);

  const { data: repMetrics } = await supabase
    .from('rep_sales_metrics')
    .select('*')
    .eq('org_id', orgId);
  const metrics = (repMetrics ?? []) as Array<{
    rep_id: string;
    proposals_delivered_7d: number;
    mrr_closed_mtd: number;
    weighted_pipeline: number;
    pipeline_coverage_ratio: number;
    monthly_mrr_target: number;
    commission_rate: number;
    close_rate_30d: number | null;
  }>;

  const leaderboard = computeLeaderboardFromMetrics(metrics);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', [...new Set([...(proposals ?? []).map((p) => p.rep_id), ...metrics.map((m) => m.rep_id)])]);
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const deliveredByRep = new Map<string, number>();
  (proposals ?? []).forEach((p) => {
    deliveredByRep.set(p.rep_id, (deliveredByRep.get(p.rep_id) ?? 0) + 1);
  });

  const topByDelivered = [...deliveredByRep.entries()]
    .map(([repId, count]) => ({
      repId,
      repName: profileMap.get(repId) ?? 'Unknown',
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const topByPipeline = metrics
    .map((m) => ({
      repId: m.rep_id,
      repName: profileMap.get(m.rep_id) ?? 'Unknown',
      value: m.weighted_pipeline ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const topByMrr = metrics
    .map((m) => ({
      repId: m.rep_id,
      repName: profileMap.get(m.rep_id) ?? 'Unknown',
      value: m.mrr_closed_mtd ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const teamProposalsYesterday = (proposals ?? []).length;
  const teamPipelineTotal = metrics.reduce((s, m) => s + (m.weighted_pipeline ?? 0), 0);
  const teamMrrMtd = metrics.reduce((s, m) => s + (m.mrr_closed_mtd ?? 0), 0);

  const repIds = [...new Set(metrics.map((m) => m.rep_id))];
  const { data: users } = await supabase.auth.admin.listUsers();
  const emailByRep = new Map<string, string>();
  users?.users?.forEach((u) => {
    if (repIds.includes(u.id)) emailByRep.set(u.id, u.email ?? '');
  });

  const perRep: RepEmailPayload[] = metrics.map((m) => {
    const rank = leaderboard.findIndex((r) => r.rep_id === m.rep_id) + 1 || leaderboard.length;
    const totalReps = leaderboard.length;
    const target = m.monthly_mrr_target || 1;
    const pct = Math.round(((m.mrr_closed_mtd ?? 0) / target) * 100);
    let actionLine = 'Keep momentum — schedule your next proposal delivery.';
    if ((m.proposals_delivered_7d ?? 0) === 0) actionLine = 'Get one proposal out today to stay on track.';
    else if ((m.pipeline_coverage_ratio ?? 0) < 2) actionLine = 'Add or advance a deal to improve pipeline coverage.';

    return {
      repId: m.rep_id,
      email: emailByRep.get(m.rep_id) ?? '',
      fullName: profileMap.get(m.rep_id) ?? null,
      rank: rank || totalReps,
      totalReps,
      performanceScore: leaderboard.find((l) => l.rep_id === m.rep_id)?.performance_score ?? 0,
      pipelineCoverageRatio: m.pipeline_coverage_ratio ?? 0,
      commissionForecast: (m.weighted_pipeline ?? 0) * (m.commission_rate ?? 0.1),
      mrrClosedMtd: m.mrr_closed_mtd ?? 0,
      monthlyTarget: m.monthly_mrr_target ?? 0,
      pctToTarget: pct,
      actionLine,
    };
  });

  return {
    orgId,
    date,
    topByDelivered,
    topByPipeline,
    topByMrr,
    teamTotals: {
      proposalsDeliveredYesterday: teamProposalsYesterday,
      pipelineTotal: teamPipelineTotal,
      mrrClosedMtd: teamMrrMtd,
    },
    perRep,
  };
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
