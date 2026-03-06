/**
 * Service Deployments: types for the operations pipeline (Kanban stages, deployment types, API shapes).
 */

export const DEPLOYMENT_STAGES = [
  'request_logged',
  'review_approval',
  'crew_assignment',
  'go_live_prep',
  'live_monitoring',
  'stabilization_complete',
] as const;

export type DeploymentStage = (typeof DEPLOYMENT_STAGES)[number];

export const DEPLOYMENT_TYPES = [
  'new_account',
  'crew_reassignment',
  'scope_change',
  'franchise_transfer',
  'service_restart',
] as const;

export type DeploymentType = (typeof DEPLOYMENT_TYPES)[number];

export const STAGE_LABELS: Record<DeploymentStage, string> = {
  request_logged: 'Request Logged',
  review_approval: 'Review & Approval',
  crew_assignment: 'Crew Assignment',
  go_live_prep: 'Go-Live Preparation',
  live_monitoring: 'Live Monitoring',
  stabilization_complete: 'Stabilization Complete',
};

export const DEPLOYMENT_TYPE_LABELS: Record<DeploymentType, string> = {
  new_account: 'New account',
  crew_reassignment: 'Crew reassignment',
  scope_change: 'Scope change',
  franchise_transfer: 'Franchise transfer',
  service_restart: 'Service restart',
};

export interface ServiceDeploymentRow {
  id: string;
  org_id: string;
  account_id: string;
  deployment_type: DeploymentType;
  reason: string | null;
  requested_by: string | null;
  requested_at: string;
  stage: DeploymentStage;
  assigned_crew_id: string | null;
  facility_id: string | null;
  notes: string | null;
  go_live_checklist: unknown;
  stabilization_metrics: unknown;
  created_at: string;
  updated_at: string;
  account?: { name: string } | null;
  assigned_crew?: { name: string } | null;
  requested_by_profile?: { full_name: string | null } | null;
}

export interface DeploymentEventRow {
  id: string;
  deployment_id: string;
  from_stage: string | null;
  to_stage: string;
  created_by: string | null;
  created_at: string;
  payload: unknown;
}

export interface DeploymentWithDetails extends ServiceDeploymentRow {
  events: DeploymentEventRow[];
  account_name: string;
  assigned_crew_name: string | null;
  requested_by_name: string | null;
}
