/**
 * Executive Dashboard / Cockpit — shared types.
 * TODO: Replace with API/DB types when wiring real data.
 */

export type KpiAccent = 'emerald' | 'blue' | 'violet' | 'amber' | 'rose';

export interface KpiTileBadge {
  label: string;
  value: number;
}

export interface KpiTileData {
  title: string;
  value: string | number;
  subvalue?: string;
  /** Optional second line under subvalue (e.g. "3 buildings impacted"). */
  subvalueSecondary?: string;
  deltaText?: string;
  /** true = positive (green), false = negative (amber), undefined = neutral. */
  deltaPositive?: boolean;
  accent: KpiAccent;
  sparkData: number[];
  /** Optional icon override (e.g. 'ClipboardX' for missed tasks). */
  icon?: string;
  href?: string;
  /** Optional severity/category chips (e.g. "3 critical", "5 standard") */
  badges?: KpiTileBadge[];
  /** When set, show a small rose badge (e.g. "2 critical") next to subvalue. */
  criticalBadge?: KpiTileBadge;
  /** When true, show a small pulsing red dot (e.g. for service failures / critical misses). */
  criticalIndicator?: boolean;
  /** Optional third line under subvalue (e.g. "Top: Delta Arena (3)"). */
  subvalueTertiary?: string;
  /** Tooltip on hover (e.g. reason breakdown). */
  tooltipContent?: string;
}

export type AttentionSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AttentionItem {
  id: string;
  label: string;
  count: number;
  severity: AttentionSeverity;
  description?: string;
  href: string;
  /** Override link text (default "View"), e.g. "Review misses". */
  ctaLabel?: string;
}

export interface AIInsight {
  id: string;
  title: string;
  explanation: string;
  recommendation: string;
  actionLabel: string;
  actionHref: string;
  icon?: string;
  severity?: 'risk' | 'opportunity' | 'neutral';
}

export interface ActivityFeedItem {
  id: string;
  type: 'walkthrough' | 'inspection' | 'proposal' | 'contract' | 'issue' | 'task';
  title: string;
  subtitle?: string;
  timestamp: string;
  href?: string;
}

export interface SalesCommandMetrics {
  walkthroughsScheduled: number;
  proposalsSent: number;
  pipelineValue: number;
  contractsWonThisMonth: number;
}

export interface OperationsPerformance {
  inspectionScoreTrend: number[];
  crewUtilization: number[];
  openIssuesTrend: number[];
}

/** Missed Tasks / Coverage Gaps — severity, reason, status. */
export type MissedTaskSeverity = 'critical' | 'standard';
export type MissedTaskReason = 'not_submitted' | 'no_evidence' | 'qc_failed' | 'client_complaint';
export type MissedTaskStatus = 'unreviewed' | 'disputed' | 'confirmed' | 'resolved';

export interface MissedTaskRecord {
  id: string;
  locationId: string;
  locationName: string;
  shiftStart: string;
  shiftEnd: string;
  employeeId: string;
  employeeName: string;
  supervisorName?: string;
  tasks: { taskId: string; taskName: string; requiredEvidence?: boolean }[];
  severity: MissedTaskSeverity;
  reason: MissedTaskReason;
  status: MissedTaskStatus;
  createdAt: string;
}

export interface MissedTasksSummary {
  count: number;
  buildingsAffected: number;
  critical: number;
  standard: number;
}

/** KPI-row metric for Missed Tasks (24h). TODO: fetch from task completion engine; aggregate critical vs standard. */
export interface MissedTasksKpi {
  missedTasksToday: number;
  missedTasksUnreviewedToday: number;
  disputedToday: number;
  missedTasksCritical: number;
  missedTasksStandard: number;
  missedTasksTrend: number[];
  missedTasksDelta: string;
  /** Numeric delta vs yesterday for display (▲ +N / ▼ -N / — no change). */
  missedTasksDeltaValue: number;
  /** Buildings impacted by missed tasks today. */
  buildingsImpactedToday: number;
  topLocationName?: string;
  topLocationCount?: number;
  topEmployeeName?: string;
  topEmployeeCount?: number;
  reasonCounts?: Partial<Record<MissedTaskReason, number>>;
}

export interface ExecutiveDemoData {
  userName: string;
  orgName: string;
  kpiTiles: KpiTileData[];
  attentionItems: AttentionItem[];
  aiInsights: AIInsight[];
  activityFeed: ActivityFeedItem[];
  salesCommand: SalesCommandMetrics;
  operationsPerformance: OperationsPerformance;
  missedTasksSummary: MissedTasksSummary;
  missedTasks: MissedTaskRecord[];
  /** Tile metric for Missed Tasks (24h). TODO: calculate from incomplete checklists or failed inspections. */
  missedTasksKpi: MissedTasksKpi;
}

