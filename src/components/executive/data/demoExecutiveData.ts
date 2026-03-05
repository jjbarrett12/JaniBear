/**
 * Executive Dashboard — demo data for premium cockpit UI.
 * TODO: Replace with server action / API (e.g. getExecutiveDashboardData(orgId)).
 */

import type {
  ExecutiveDemoData,
  KpiTileData,
  AttentionItem,
  AIInsight,
  ActivityFeedItem,
  SalesCommandMetrics,
  OperationsPerformance,
  MissedTasksSummary,
  MissedTaskRecord,
  MissedTasksKpi,
  MissedTaskReason,
} from '../types';

const REASON_LABELS: Record<MissedTaskReason, string> = {
  not_submitted: 'Not submitted',
  no_evidence: 'No evidence',
  qc_failed: 'QC failed',
  client_complaint: 'Client complaint',
};

function formatReasonCountsTooltip(reasonCounts?: Partial<Record<MissedTaskReason, number>>): string {
  if (!reasonCounts || Object.keys(reasonCounts).length === 0) return '';
  return (['not_submitted', 'no_evidence', 'qc_failed', 'client_complaint'] as const)
    .filter((r) => (reasonCounts[r] ?? 0) > 0)
    .map((r) => `${REASON_LABELS[r]}: ${reasonCounts[r]}`)
    .join('\n');
}

function formatMissedTasksDelta(deltaValue: number): string {
  if (deltaValue > 0) return `▲ +${deltaValue} vs yesterday`;
  if (deltaValue < 0) return `▼ ${deltaValue} vs yesterday`;
  return '— no change';
}

export function getDemoExecutiveData(orgName = 'Your Company'): ExecutiveDemoData {
  const missedTasks = getMissedTasksRecords();
  const missedTasksSummary = getMissedTasksSummary(missedTasks);
  const missedTasksKpi = getMissedTasksKpi();
  return {
    userName: 'Alex',
    orgName,
    kpiTiles: getKpiTiles(missedTasksKpi),
    attentionItems: getAttentionItems(),
    aiInsights: getAIInsights(),
    activityFeed: getActivityFeed(),
    salesCommand: getSalesCommandMetrics(),
    operationsPerformance: getOperationsPerformance(),
    missedTasksSummary,
    missedTasks,
    missedTasksKpi,
  };
}

/** TODO: fetch missed tasks from task completion engine; calculate misses based on incomplete checklists or failed inspections; aggregate critical vs standard. */
function getMissedTasksKpi(): MissedTasksKpi {
  return {
    missedTasksToday: 7,
    missedTasksUnreviewedToday: 5,
    disputedToday: 1,
    missedTasksCritical: 2,
    missedTasksStandard: 5,
    missedTasksTrend: [3, 4, 2, 5, 4, 6, 7],
    missedTasksDelta: '+3 vs yesterday',
    missedTasksDeltaValue: 3,
    buildingsImpactedToday: 3,
    topLocationName: 'Delta Arena',
    topLocationCount: 3,
    topEmployeeName: 'Jordan Reyes',
    topEmployeeCount: 2,
    reasonCounts: {
      not_submitted: 2,
      no_evidence: 2,
      qc_failed: 2,
      client_complaint: 1,
    },
  };
}

/** KPI row order: Revenue, Buildings, Crews, Inspections, Missed Tasks, Alerts. */
function getKpiTiles(missedKpi: MissedTasksKpi): KpiTileData[] {
  const revenue = {
    title: 'Revenue scheduled today',
    value: '$12,440',
    subvalue: 'Recurring',
    deltaText: '+4.2% vs yesterday',
    deltaPositive: true as const,
    accent: 'emerald' as const,
    sparkData: [0.72, 0.68, 0.75, 0.78, 0.82, 0.85, 0.88],
  };
  const buildings = {
    title: 'Buildings scheduled today',
    value: 28,
    deltaText: '+2 vs yesterday',
    deltaPositive: true as const,
    accent: 'blue' as const,
    sparkData: [0.7, 0.72, 0.68, 0.75, 0.78, 0.82, 0.85],
  };
  const crews = {
    title: 'Crews active',
    value: '18 / 20',
    subvalue: '2 slots open',
    deltaText: '1 gap',
    deltaPositive: false as const,
    accent: 'amber' as const,
    sparkData: [0.82, 0.85, 0.88, 0.9, 0.88, 0.9, 0.9],
  };
  const inspections = {
    title: 'Inspections due today',
    value: 5,
    deltaText: '1 overdue',
    deltaPositive: false as const,
    accent: 'violet' as const,
    sparkData: [0.4, 0.5, 0.45, 0.6, 0.55, 0.5, 0.6],
  };
  const topLine =
    missedKpi.topLocationName != null && missedKpi.topLocationCount != null
      ? `Top: ${missedKpi.topLocationName} (${missedKpi.topLocationCount})`
      : missedKpi.topEmployeeName != null && missedKpi.topEmployeeCount != null
        ? `Top: ${missedKpi.topEmployeeName} (${missedKpi.topEmployeeCount})`
        : undefined;
  const missedTasksTile: KpiTileData = {
    title: 'Missed Tasks (24h)',
    value: missedKpi.missedTasksUnreviewedToday,
    subvalue: `${missedKpi.missedTasksToday} total • ${missedKpi.missedTasksUnreviewedToday} unreviewed`,
    subvalueSecondary: `${missedKpi.buildingsImpactedToday} buildings impacted`,
    subvalueTertiary: topLine,
    deltaText: formatMissedTasksDelta(missedKpi.missedTasksDeltaValue),
    deltaPositive:
      missedKpi.missedTasksDeltaValue > 0
        ? true
        : missedKpi.missedTasksDeltaValue < 0
          ? false
          : undefined,
    accent: 'amber',
    sparkData: missedKpi.missedTasksTrend,
    href: '/app/ops/missed-tasks',
    criticalBadge:
      missedKpi.missedTasksCritical > 0
        ? { label: 'critical', value: missedKpi.missedTasksCritical }
        : undefined,
    criticalIndicator: missedKpi.missedTasksCritical > 0,
    icon: 'ClipboardX',
    tooltipContent: formatReasonCountsTooltip(missedKpi.reasonCounts),
  };
  const alerts = {
    title: 'Attention / SLA breaches',
    value: 3,
    subvalue: 'Need action',
    deltaText: '2 urgent',
    deltaPositive: false as const,
    accent: 'rose' as const,
    sparkData: [0.15, 0.2, 0.18, 0.22, 0.2, 0.25, 0.2],
  };
  return [revenue, buildings, crews, inspections, missedTasksTile, alerts];
}

function getAttentionItems(): AttentionItem[] {
  return [
    {
      id: '1',
      label: 'SLA breaches',
      count: 2,
      severity: 'critical',
      description: 'Inspections or tasks past due',
      href: '/app/ops/issues-sla',
    },
    {
      id: '2',
      label: 'Missed inspections',
      count: 1,
      severity: 'high',
      description: 'Sites not yet inspected this period',
      href: '/app/ops/inspections',
    },
    {
      id: '3',
      label: 'Accounts below health',
      count: 4,
      severity: 'medium',
      description: 'Score under threshold',
      href: '/app/accounts',
    },
    {
      id: '4',
      label: 'Staffing shortages',
      count: 2,
      severity: 'medium',
      description: 'Crew gaps for scheduled work',
      href: '/app/ops/launches',
    },
  ];
}

function getAIInsights(): AIInsight[] {
  return [
    {
      id: '1',
      title: '3 accounts at churn risk',
      explanation: 'Declining inspection scores and late feedback over the last 14 days.',
      recommendation: 'Schedule a check-in with each account and review quality notes.',
      actionLabel: 'Open accounts',
      actionHref: '/app/accounts',
      severity: 'risk',
    },
    {
      id: '2',
      title: 'Tomorrow staffing risk: Medium',
      explanation: '2 sites have no crew assigned for tomorrow’s schedule.',
      recommendation: 'Assign backup crew or notify site contacts.',
      actionLabel: 'Notify supervisor',
      actionHref: '/app/ops/launches',
      severity: 'risk',
    },
    {
      id: '3',
      title: 'SLA risk: 2 sites likely to breach today',
      explanation: 'Open issues are approaching response deadlines.',
      recommendation: 'Dispatch or escalate to meet SLA.',
      actionLabel: 'Create task',
      actionHref: '/app/ops/issues-sla',
      severity: 'risk',
    },
    {
      id: '4',
      title: 'Pipeline momentum up 12%',
      explanation: 'More proposals sent and higher close rate this week.',
      recommendation: 'Keep current cadence; consider doubling down on top territories.',
      actionLabel: 'View pipeline',
      actionHref: '/app/sales/pipeline',
      severity: 'opportunity',
    },
  ];
}

function getActivityFeed(): ActivityFeedItem[] {
  return [
    { id: '1', type: 'walkthrough', title: 'Walkthrough completed', subtitle: 'Delta Arena', timestamp: '2 min ago', href: '/app/sales/walkthroughs' },
    { id: '2', type: 'inspection', title: 'Inspection submitted', subtitle: 'Hilton Downtown', timestamp: '8 min ago', href: '/app/ops/inspections' },
    { id: '3', type: 'proposal', title: 'Proposal generated', subtitle: 'City Convention Center', timestamp: '14 min ago', href: '/app/sales/proposals' },
    { id: '4', type: 'contract', title: 'Contract signed', subtitle: 'Riverside Medical', timestamp: '1 hr ago', href: '/app/sales/pipeline' },
    { id: '5', type: 'task', title: 'Task completed', subtitle: 'Crew B — West Plaza', timestamp: '1 hr ago', href: '/app/ops/tasks' },
    { id: '6', type: 'issue', title: 'Issue reported', subtitle: 'North Campus — Restroom', timestamp: '2 hrs ago', href: '/app/ops/issues-sla' },
  ];
}

function getSalesCommandMetrics(): SalesCommandMetrics {
  return {
    walkthroughsScheduled: 4,
    proposalsSent: 7,
    pipelineValue: 124000,
    contractsWonThisMonth: 3,
  };
}

function getOperationsPerformance(): OperationsPerformance {
  return {
    inspectionScoreTrend: [78, 80, 82, 79, 84, 85, 86, 84, 87],
    crewUtilization: [82, 85, 88, 90, 87, 91, 89],
    openIssuesTrend: [12, 10, 11, 9, 8, 7, 6],
  };
}

/** TODO: Replace with server-side fetch of missed tasks scoped by org_id. */
function getMissedTasksSummary(records: MissedTaskRecord[]): MissedTasksSummary {
  const locationIds = new Set(records.map((r) => r.locationId));
  const critical = records.filter((r) => r.severity === 'critical').length;
  const standard = records.filter((r) => r.severity === 'standard').length;
  return {
    count: records.length,
    buildingsAffected: locationIds.size,
    critical,
    standard,
  };
}

/** TODO: Replace with server action / API (org-scoped missed tasks). */
function getMissedTasksRecords(): MissedTaskRecord[] {
  return [
    {
      id: 'mt-1',
      locationId: 'loc-1',
      locationName: 'Delta Arena',
      shiftStart: '2025-03-05T22:00:00',
      shiftEnd: '2025-03-06T06:00:00',
      employeeId: 'e1',
      employeeName: 'Jordan Reyes',
      supervisorName: 'Maria Chen',
      tasks: [
        { taskId: 't1', taskName: 'Lobby vacuum', requiredEvidence: true },
        { taskId: 't2', taskName: 'Restroom checklist', requiredEvidence: true },
        { taskId: 't3', taskName: 'Trash removal', requiredEvidence: false },
      ],
      severity: 'critical',
      reason: 'no_evidence',
      status: 'unreviewed',
      createdAt: '2025-03-06T07:15:00',
    },
    {
      id: 'mt-2',
      locationId: 'loc-2',
      locationName: 'Hilton Downtown',
      shiftStart: '2025-03-05T23:00:00',
      shiftEnd: '2025-03-06T05:00:00',
      employeeId: 'e2',
      employeeName: 'Sam Foster',
      supervisorName: 'Maria Chen',
      tasks: [
        { taskId: 't4', taskName: 'Floor burnish', requiredEvidence: true },
      ],
      severity: 'standard',
      reason: 'not_submitted',
      status: 'unreviewed',
      createdAt: '2025-03-06T06:45:00',
    },
    {
      id: 'mt-3',
      locationId: 'loc-3',
      locationName: 'North Campus — Building A',
      shiftStart: '2025-03-05T18:00:00',
      shiftEnd: '2025-03-06T02:00:00',
      employeeId: 'e3',
      employeeName: 'Alex Rivera',
      supervisorName: 'James Wu',
      tasks: [
        { taskId: 't5', taskName: 'Entry glass clean', requiredEvidence: false },
        { taskId: 't6', taskName: 'Break room wipe-down', requiredEvidence: true },
      ],
      severity: 'critical',
      reason: 'qc_failed',
      status: 'disputed',
      createdAt: '2025-03-06T03:20:00',
    },
    {
      id: 'mt-4',
      locationId: 'loc-1',
      locationName: 'Delta Arena',
      shiftStart: '2025-03-04T22:00:00',
      shiftEnd: '2025-03-05T06:00:00',
      employeeId: 'e4',
      employeeName: 'Casey Kim',
      supervisorName: 'Maria Chen',
      tasks: [
        { taskId: 't7', taskName: 'Stairwell sweep', requiredEvidence: false },
      ],
      severity: 'standard',
      reason: 'not_submitted',
      status: 'confirmed',
      createdAt: '2025-03-05T07:00:00',
    },
    {
      id: 'mt-5',
      locationId: 'loc-4',
      locationName: 'Riverside Medical — West Wing',
      shiftStart: '2025-03-05T20:00:00',
      shiftEnd: '2025-03-06T04:00:00',
      employeeId: 'e5',
      employeeName: 'Morgan Tate',
      supervisorName: 'James Wu',
      tasks: [
        { taskId: 't8', taskName: 'Patient room sanitize', requiredEvidence: true },
        { taskId: 't9', taskName: 'Hallway mop', requiredEvidence: true },
      ],
      severity: 'critical',
      reason: 'client_complaint',
      status: 'unreviewed',
      createdAt: '2025-03-06T05:30:00',
    },
    {
      id: 'mt-6',
      locationId: 'loc-5',
      locationName: 'City Convention Center',
      shiftStart: '2025-03-05T21:00:00',
      shiftEnd: '2025-03-06T05:00:00',
      employeeId: 'e6',
      employeeName: 'Jamie Lee',
      supervisorName: 'Maria Chen',
      tasks: [
        { taskId: 't10', taskName: 'Exhibit hall vacuum', requiredEvidence: true },
        { taskId: 't11', taskName: 'Restroom restock', requiredEvidence: false },
        { taskId: 't12', taskName: 'Lobby dust', requiredEvidence: false },
      ],
      severity: 'standard',
      reason: 'no_evidence',
      status: 'unreviewed',
      createdAt: '2025-03-06T06:00:00',
    },
    {
      id: 'mt-7',
      locationId: 'loc-2',
      locationName: 'Hilton Downtown',
      shiftStart: '2025-03-04T23:00:00',
      shiftEnd: '2025-03-05T05:00:00',
      employeeId: 'e2',
      employeeName: 'Sam Foster',
      supervisorName: 'Maria Chen',
      tasks: [
        { taskId: 't13', taskName: 'Guest corridor checklist', requiredEvidence: true },
      ],
      severity: 'standard',
      reason: 'not_submitted',
      status: 'resolved',
      createdAt: '2025-03-05T05:45:00',
    },
    {
      id: 'mt-8',
      locationId: 'loc-6',
      locationName: 'West Plaza — Retail',
      shiftStart: '2025-03-05T19:00:00',
      shiftEnd: '2025-03-06T01:00:00',
      employeeId: 'e7',
      employeeName: 'Riley Brooks',
      supervisorName: 'James Wu',
      tasks: [
        { taskId: 't14', taskName: 'Storefront glass', requiredEvidence: false },
        { taskId: 't15', taskName: 'Back office vacuum', requiredEvidence: true },
      ],
      severity: 'standard',
      reason: 'qc_failed',
      status: 'unreviewed',
      createdAt: '2025-03-06T02:10:00',
    },
    {
      id: 'mt-9',
      locationId: 'loc-3',
      locationName: 'North Campus — Building A',
      shiftStart: '2025-03-05T18:00:00',
      shiftEnd: '2025-03-06T02:00:00',
      employeeId: 'e8',
      employeeName: 'Taylor Nguyen',
      supervisorName: 'James Wu',
      tasks: [
        { taskId: 't16', taskName: 'Lab surface disinfect', requiredEvidence: true },
      ],
      severity: 'critical',
      reason: 'no_evidence',
      status: 'unreviewed',
      createdAt: '2025-03-06T03:45:00',
    },
  ];
}
