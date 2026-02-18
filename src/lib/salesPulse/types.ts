/**
 * Sales Pulse email payload types (daily/weekly scoreboard).
 */

export interface RepEmailPayload {
  repId: string;
  email: string;
  fullName: string | null;
  rank: number;
  totalReps: number;
  performanceScore: number;
  pipelineCoverageRatio: number;
  commissionForecast: number;
  mrrClosedMtd: number;
  monthlyTarget: number;
  pctToTarget: number;
  /** Suggested one action line */
  actionLine: string;
  /** Weakest KPI label for weekly */
  weakestKpi?: string;
  /** Simple projected gain if improves (weekly) */
  projectedGain?: string;
}

export interface DailyPulsePayload {
  orgId: string;
  date: string; // YYYY-MM-DD
  /** Top 3 by proposals delivered yesterday */
  topByDelivered: { repId: string; repName: string; count: number }[];
  /** Top 3 by pipeline added proxy / weighted pipeline */
  topByPipeline: { repId: string; repName: string; value: number }[];
  /** Top 3 by MRR closed (yesterday or MTD) */
  topByMrr: { repId: string; repName: string; value: number }[];
  teamTotals: {
    proposalsDeliveredYesterday: number;
    pipelineTotal: number;
    mrrClosedMtd: number;
  };
  perRep: RepEmailPayload[];
}

export interface WeeklyScoreboardPayload {
  orgId: string;
  weekStart: string; // YYYY-MM-DD
  top3: { rank: number; repName: string; performanceScore: number }[];
  teamTotals: {
    proposalsDeliveredWeek: number;
    pipelineTotal: number;
    mrrClosedWeek: number;
  };
  perRep: RepEmailPayload[];
}
