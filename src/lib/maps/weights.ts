/**
 * Heatmap weight rules for Sales (leads) and Ops (accounts).
 * Used by the territory map heatmap overlay.
 */

/** Lead/Prospect: priority for heat weight */
export type LeadPriority = 'high' | 'normal' | 'low';

/** Lead/Prospect: status category for heat weight multiplier */
export type LeadStatusCategory = 'new' | 'working' | 'qualified' | 'disqualified';

export interface LeadWeightInput {
  score?: number | null;
  priority?: LeadPriority | string | null;
  status?: string | null;
}

/**
 * Sales weight: base from score (0–100), then priority and status multipliers.
 * base = clamp(score, 0..100)
 * priority: high=1.25, normal=1.0, low=0.8
 * status: new=1.15, working=1.0, qualified=0.9, disqualified=0.2
 */
export function salesLeadWeight(input: LeadWeightInput): number {
  const base = Math.max(0, Math.min(100, input.score ?? 50));
  const priorityMult =
    input.priority === 'high' ? 1.25 : input.priority === 'low' ? 0.8 : 1.0;
  const statusMult = leadStatusMultiplier(input.status);
  return base * priorityMult * statusMult;
}

function leadStatusMultiplier(status: string | null | undefined): number {
  if (!status) return 1.0;
  const s = status.toLowerCase();
  if (s === 'new' || s === 'uncontacted') return 1.15;
  if (s === 'contacted' || s === 'proposal_sent' || s === 'walkthrough_scheduled' || s === 'walkthrough_done') return 1.0;
  if (s === 'won' || s === 'closed_won') return 0.9;
  if (s === 'lost' || s === 'closed_lost') return 0.2;
  return 1.0;
}

export interface AccountRiskInput {
  health_status?: 'green' | 'yellow' | 'red' | string | null;
  last_inspection_score?: number | null;
  open_ticket_count?: number;
  overdue_ticket_count?: number;
  missed_shifts_7d?: number;
}

/**
 * Ops risk score 0–100 (higher = worse risk). Used for heatmap weight.
 * Uses health_status, inspection score, tickets, missed shifts.
 * If no data: placeholder 50.
 */
export function opsAccountRiskScore(input: AccountRiskInput): number {
  const healthScore =
    input.health_status === 'red' ? 80 : input.health_status === 'yellow' ? 50 : 20;
  const inspection = input.last_inspection_score != null ? 100 - Math.min(100, Math.max(0, input.last_inspection_score)) : 0;
  const tickets = (input.open_ticket_count ?? 0) * 5 + (input.overdue_ticket_count ?? 0) * 15;
  const missed = (input.missed_shifts_7d ?? 0) * 10;
  const raw = (healthScore * 0.4) + (inspection * 0.2) + Math.min(30, tickets) + Math.min(30, missed);
  return Math.max(0, Math.min(100, Math.round(raw)));
}
