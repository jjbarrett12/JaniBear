/**
 * Operator performance score calculation.
 * total_score = weighted sum of components, clamped 0–100.
 * Operators with total_score < 50 are "restricted" (no auto-assign).
 */

export interface OperatorScoreInput {
  qc_score: number;
  complaint_rate: number;
  missed_tasks_rate: number;
  response_time_score: number;
  leadership_score: number;
  capacity_score: number;
  territory_proximity_score: number;
}

const WEIGHTS = {
  qc_score: 0.35,
  complaint_component: 0.2,
  missed_tasks_component: 0.15,
  response_time_score: 0.1,
  leadership_score: 0.1,
  capacity_score: 0.1,
  // territory_proximity not in base total; applied per-account in suggestOperator
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * (100 - complaint_rate * 10) clamped 0–100
 */
function complaintComponent(complaint_rate: number): number {
  return clamp(100 - complaint_rate * 10, 0, 100);
}

/**
 * (100 - missed_tasks_rate * 100) clamped 0–100
 */
function missedTasksComponent(missed_tasks_rate: number): number {
  return clamp(100 - missed_tasks_rate * 100, 0, 100);
}

/**
 * Compute total performance score 0–100 from component scores.
 * Does not include territory_proximity (that is applied per candidate account).
 */
export function calculateTotalScore(input: OperatorScoreInput): number {
  const comp = complaintComponent(input.complaint_rate);
  const missed = missedTasksComponent(input.missed_tasks_rate);
  const total =
    input.qc_score * WEIGHTS.qc_score +
    comp * WEIGHTS.complaint_component +
    missed * WEIGHTS.missed_tasks_component +
    input.response_time_score * WEIGHTS.response_time_score +
    input.leadership_score * WEIGHTS.leadership_score +
    input.capacity_score * WEIGHTS.capacity_score;
  return clamp(total, 0, 100);
}

/** True if operator is restricted from auto-assign (total_score < 50). */
export function isRestricted(totalScore: number): boolean {
  return totalScore < 50;
}
