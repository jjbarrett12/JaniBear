/**
 * Operations core — scalable model types.
 * Separates commercial (account) from execution (agreements, lines, assignments, events).
 */

export const SERVICE_AGREEMENT_STATUSES = ['draft', 'active', 'paused', 'ended', 'cancelled'] as const;
export type ServiceAgreementStatus = (typeof SERVICE_AGREEMENT_STATUSES)[number];

export const SERVICE_LINE_TYPE_CODES = [
  'nightly_janitorial',
  'floor_care',
  'porter',
  'windows',
  'trash',
  'restroom_reset',
] as const;
export type ServiceLineTypeCode = (typeof SERVICE_LINE_TYPE_CODES)[number];

export const SERVICE_EVENT_STATUSES = ['scheduled', 'completed', 'missed', 'partial', 'cancelled'] as const;
export type ServiceEventStatus = (typeof SERVICE_EVENT_STATUSES)[number];

export const CREW_CHANGE_REQUEST_STATUSES = ['requested', 'approved', 'rejected', 'replaced'] as const;
export type CrewChangeRequestStatus = (typeof CREW_CHANGE_REQUEST_STATUSES)[number];

export interface ServiceAgreementRow {
  id: string;
  org_id: string;
  account_id: string;
  facility_id: string;
  name: string;
  status: ServiceAgreementStatus;
  /** Effective start date (alias: start_date in DB). */
  start_date: string;
  /** Effective end date, nullable (alias: end_date in DB). */
  end_date: string | null;
  contract_ref: string | null;
  contract_value_monthly: number | null;
  service_frequency: string | null;
  /** Days serviced (e.g. Mon,Tue,Wed); stored as service_days in DB. */
  service_days: string[] | null;
  /** Scope summary for ops/scheduling; synced from proposal/walkthrough when created from launch. */
  general_scope_summary: string | null;
  notes: string | null;
  /** Opportunity this agreement was created from (launch/proposal close). */
  source_opportunity_id: string | null;
  /** Proposal (and PDF) this agreement was created from; contract artifact remains separate. */
  source_proposal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceLineRow {
  id: string;
  org_id: string;
  service_agreement_id: string;
  line_type: ServiceLineTypeCode;
  name: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceAssignmentRow {
  id: string;
  org_id: string;
  facility_id: string;
  service_line_id: string | null;
  crew_id: string;
  supervisor_id: string | null;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ServiceEventRow {
  id: string;
  org_id: string;
  facility_id: string;
  service_line_id: string | null;
  service_date: string;
  crew_id: string | null;
  service_assignment_id: string | null;
  status: ServiceEventStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InspectionProgramRow {
  id: string;
  org_id: string;
  facility_id: string;
  service_line_id: string | null;
  template_id: string;
  name: string;
  cadence: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrewChangeRequestRow {
  id: string;
  org_id: string;
  facility_id: string;
  service_line_id: string | null;
  reason: string;
  requested_by: string;
  requested_at: string;
  status: CrewChangeRequestStatus;
  current_assignment_id: string | null;
  replacement_crew_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  new_assignment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Effective-dated: assignment is current when effective_from <= date and (effective_to is null or effective_to >= date). */
export function isAssignmentEffectiveAt(assignment: { effective_from: string; effective_to: string | null }, asOfDate: string): boolean {
  if (assignment.effective_from > asOfDate) return false;
  if (assignment.effective_to != null && assignment.effective_to < asOfDate) return false;
  return true;
}
