/**
 * Build ranked recommended actions for Operations Command Center.
 * Priority 1-100; higher = more urgent.
 */

import type {
  CommandCenterKPIs,
  CoverageGapRow,
  RiskAccountRow,
  ReliabilityRow,
  BackupPoolRow,
  RecommendedAction,
} from './command-center-types';

export interface BuildRecommendedActionsInput {
  coverageGaps: CoverageGapRow[];
  riskAccounts: RiskAccountRow[];
  reliabilityAlerts: ReliabilityRow[];
  backupPools: BackupPoolRow[];
  kpis: CommandCenterKPIs;
}

export function buildRecommendedActions(input: BuildRecommendedActionsInput): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  for (const g of input.coverageGaps) {
    if (g.coverage_status === 'coverage_needed') {
      actions.push({
        type: 'coverage_gap',
        priority: 95,
        title: `Assign backup: ${g.account_name}`,
        subtitle: `Shift ${g.start_time} – ${g.end_time} needs coverage`,
        entity_type: 'shift_coverage',
        entity_id: g.id,
        suggested_action: 'Assign a backup operator from the pool or recommend list.',
      });
    }
  }

  for (const r of input.riskAccounts) {
    if (r.risk_level === 'critical') {
      actions.push({
        type: 'risk_account',
        priority: 90,
        title: `Critical risk: ${r.account_name}`,
        subtitle: r.top_reason ?? 'Review and assign backup or create intervention.',
        entity_type: 'account_risk_snapshot',
        entity_id: r.id,
        account_id: r.account_id,
        suggested_action: 'View risk detail, assign backup, or create intervention plan.',
      });
    } else if (r.risk_level === 'high') {
      actions.push({
        type: 'risk_account',
        priority: 75,
        title: `High risk: ${r.account_name}`,
        subtitle: r.top_reason ?? 'Monitor and consider backup.',
        entity_type: 'account_risk_snapshot',
        entity_id: r.id,
        account_id: r.account_id,
        suggested_action: 'Review risk detail and consider backup or intervention.',
      });
    }
  }

  for (const p of input.backupPools) {
    if (p.coverage_health === 'critical') {
      actions.push({
        type: 'backup_pool_gap',
        priority: 85,
        title: `No backup capacity: ${p.name}`,
        subtitle: p.territory_name ? `${p.territory_name} has 0 qualified backups available.` : 'Expand pool or add members.',
        entity_type: 'backup_pool',
        entity_id: p.id,
        suggested_action: 'Add backup pool members or increase capacity for this territory.',
      });
    } else if (p.coverage_health === 'thin') {
      actions.push({
        type: 'backup_pool_gap',
        priority: 60,
        title: `Thin backup pool: ${p.name}`,
        subtitle: `Only ${p.available_tonight} backup(s) available.`,
        entity_type: 'backup_pool',
        entity_id: p.id,
        suggested_action: 'Consider adding more members to this backup pool.',
      });
    }
  }

  for (const r of input.reliabilityAlerts) {
    if (r.reliability_score < 50) {
      actions.push({
        type: 'reliability_alert',
        priority: 70,
        title: `Low reliability: ${r.operator_name}`,
        subtitle: `Score ${r.reliability_score}; consider restricting from critical accounts.`,
        entity_type: 'crew_reliability',
        entity_id: r.id,
        suggested_action: 'Review operator performance; restrict from new critical accounts if needed.',
      });
    } else if (r.reliability_score < 65) {
      actions.push({
        type: 'reliability_alert',
        priority: 55,
        title: `Watch: ${r.operator_name}`,
        subtitle: `Reliability ${r.reliability_score}; trend: ${r.trend}.`,
        entity_type: 'crew_reliability',
        entity_id: r.id,
        suggested_action: 'Monitor and support; consider backup coverage for their shifts.',
      });
    }
  }

  actions.sort((a, b) => b.priority - a.priority);
  return actions.slice(0, 20);
}
