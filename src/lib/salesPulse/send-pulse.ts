/**
 * Build email content from payload and send via adapter.
 */
import type { DailyPulsePayload, WeeklyScoreboardPayload, RepEmailPayload } from './types';
import type { EmailAdapter } from './email-adapter';
import { stubEmailAdapter } from './email-adapter';

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function dailyRepHtml(p: RepEmailPayload, team: DailyPulsePayload['teamTotals']): string {
  return `
    <h3>Your snapshot</h3>
    <p>Rank: #${p.rank} of ${p.totalReps} · Pipeline coverage: ${(p.pipelineCoverageRatio ?? 0).toFixed(1)}x</p>
    <p>Commission forecast (from weighted pipeline): ${formatCurrency(p.commissionForecast)}</p>
    <p><strong>${p.actionLine}</strong></p>
    <hr/>
    <p><small>Team yesterday: ${team.proposalsDeliveredYesterday} proposals · Pipeline total: ${formatCurrency(team.pipelineTotal)} · MTD MRR: ${formatCurrency(team.mrrClosedMtd)}</small></p>
  `;
}

function weeklyRepHtml(p: RepEmailPayload, team: WeeklyScoreboardPayload['teamTotals']): string {
  return `
    <h3>Your week</h3>
    <p>Rank: #${p.rank} of ${p.totalReps} · ${p.pctToTarget}% to target</p>
    <p>Weakest KPI to improve: ${p.weakestKpi ?? '—'}. ${p.projectedGain ?? ''}</p>
    <p><strong>${p.actionLine}</strong></p>
    <hr/>
    <p><small>Team week: ${team.proposalsDeliveredWeek} proposals · Pipeline: ${formatCurrency(team.pipelineTotal)} · MRR closed: ${formatCurrency(team.mrrClosedWeek)}</small></p>
  `;
}

export async function sendDailyPulse(
  payload: DailyPulsePayload,
  adapter: EmailAdapter = stubEmailAdapter
): Promise<{ sent: number; failed: string[] }> {
  const failed: string[] = [];
  let sent = 0;
  const team = payload.teamTotals;
  const topLines = [
    `Top by delivered: ${payload.topByDelivered.map((r) => r.repName).join(', ')}`,
    `Top by pipeline: ${payload.topByPipeline.map((r) => r.repName).join(', ')}`,
    `Top by MRR: ${payload.topByMrr.map((r) => r.repName).join(', ')}`,
  ].join('<br/>');

  for (const rep of payload.perRep) {
    if (!rep.email) continue;
    const html = `
      <h2>Daily Sales Pulse — ${payload.date}</h2>
      <p>Yesterday's leaders:</p>
      ${topLines}
      <p>Team: ${team.proposalsDeliveredYesterday} proposals · ${formatCurrency(team.pipelineTotal)} pipeline · ${formatCurrency(team.mrrClosedMtd)} MTD</p>
      ${dailyRepHtml(rep, team)}
    `;
    const result = await adapter.send({
      to: rep.email,
      subject: `Daily Sales Pulse — ${payload.date}`,
      html,
    });
    if (result.ok) sent++;
    else failed.push(rep.email);
  }
  return { sent, failed };
}

export async function sendWeeklyScoreboard(
  payload: WeeklyScoreboardPayload,
  adapter: EmailAdapter = stubEmailAdapter
): Promise<{ sent: number; failed: string[] }> {
  const failed: string[] = [];
  let sent = 0;
  const team = payload.teamTotals;
  const top3Lines = payload.top3
    .map((r) => `#${r.rank} ${r.repName} (${(r.performanceScore * 100).toFixed(0)}%)`)
    .join('<br/>');

  for (const rep of payload.perRep) {
    if (!rep.email) continue;
    const html = `
      <h2>Weekly Scoreboard — week of ${payload.weekStart}</h2>
      <p>Top 3:</p>
      ${top3Lines}
      <p>Team: ${team.proposalsDeliveredWeek} proposals · ${formatCurrency(team.pipelineTotal)} pipeline · ${formatCurrency(team.mrrClosedWeek)} closed</p>
      ${weeklyRepHtml(rep, team)}
    `;
    const result = await adapter.send({
      to: rep.email,
      subject: `Weekly Sales Scoreboard — ${payload.weekStart}`,
      html,
    });
    if (result.ok) sent++;
    else failed.push(rep.email);
  }
  return { sent, failed };
}
