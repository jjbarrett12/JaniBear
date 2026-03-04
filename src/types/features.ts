/**
 * Type definitions for all integrated features:
 * recurring billing, work orders, marketing automation,
 * CSAT/NPS surveys, route optimization, workflow engine,
 * and contract renewals.
 */

// ============================================================================
// Recurring Billing
// ============================================================================

export type BillingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
export type BillingStatus = 'active' | 'paused' | 'cancelled' | 'completed';
export type ReminderType = 'upcoming' | 'due' | 'overdue_3d' | 'overdue_7d' | 'overdue_14d' | 'overdue_30d' | 'custom';
export type ReminderChannel = 'email' | 'sms' | 'both';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface RecurringBillingSchedule {
  id: string;
  org_id: string;
  account_id: string;
  facility_id: string | null;
  description: string | null;
  frequency: BillingFrequency;
  amount_cents: number;
  currency: string;
  day_of_month: number | null;
  day_of_week: number | null;
  starts_at: string;
  ends_at: string | null;
  next_invoice_at: string | null;
  last_invoiced_at: string | null;
  auto_send: boolean;
  stripe_price_id: string | null;
  stripe_subscription_id: string | null;
  status: BillingStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  accounts?: { name: string; billing_email?: string };
  facilities?: { name: string } | null;
}

export interface PaymentReminder {
  id: string;
  org_id: string;
  invoice_id: string;
  reminder_type: ReminderType;
  scheduled_for: string;
  sent_at: string | null;
  channel: ReminderChannel;
  recipient_email: string | null;
  recipient_phone: string | null;
  status: ReminderStatus;
  error_message: string | null;
  created_at: string;
}

export interface ARAgingBucket {
  label: string;
  count: number;
  total_cents: number;
}

export interface RecurringBillingStats {
  active_schedules: number;
  total_mrr_cents: number;
  next_billing_count: number;
  overdue_invoices: number;
  aging_buckets: ARAgingBucket[];
}

// ============================================================================
// Work Orders
// ============================================================================

export type WorkOrderStatus = 'pending' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderCategory = 'cleaning' | 'repair' | 'supply_restock' | 'inspection_followup' | 'complaint' | 'other';
export type WorkOrderSource = 'manual' | 'inspection' | 'ticket' | 'schedule' | 'workflow';
export type PhotoType = 'before' | 'during' | 'after';

export interface WorkOrder {
  id: string;
  org_id: string;
  title: string | null;
  description: string | null;
  site_id: string | null;
  facility_id: string | null;
  account_id: string | null;
  issue_id: string | null;
  assigned_to: string | null;
  crew_id: string | null;
  due_at: string | null;
  sla_deadline: string | null;
  started_at: string | null;
  completed_at: string | null;
  estimated_duration_min: number | null;
  actual_duration_min: number | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  category: WorkOrderCategory | null;
  source: WorkOrderSource;
  source_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  items?: WorkOrderItem[];
  photos?: WorkOrderPhoto[];
  facilities?: { name: string } | null;
  accounts?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  description: string;
  quantity: number;
  unit: string;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  sort_order: number;
  created_at: string;
}

export interface WorkOrderPhoto {
  id: string;
  work_order_id: string;
  photo_url: string;
  caption: string | null;
  taken_at: string;
  taken_by: string | null;
  photo_type: PhotoType;
}

export interface WorkOrderStats {
  total: number;
  pending: number;
  in_progress: number;
  completed_today: number;
  overdue_sla: number;
  avg_completion_min: number | null;
}

// ============================================================================
// Marketing Automation (Email Sequences)
// ============================================================================

export type SequenceTrigger = 'manual' | 'new_lead' | 'proposal_sent' | 'proposal_viewed' | 'inspection_complete' | 'contract_expiring' | 'lost_deal';
export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived';
export type StepType = 'email' | 'sms' | 'task' | 'wait' | 'condition';
export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'bounced' | 'unsubscribed' | 'replied';
export type SequenceEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed' | 'task_created' | 'task_completed';
export type TemplateCategory = 'general' | 'sales' | 'followup' | 'onboarding' | 'renewal' | 'survey' | 'marketing' | 'notification';

export interface EmailTemplate {
  id: string;
  org_id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  category: TemplateCategory;
  variables: string[];
  is_system: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailSequence {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  trigger_type: SequenceTrigger;
  status: SequenceStatus;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  steps?: EmailSequenceStep[];
  enrollment_count?: number;
}

export interface EmailSequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  step_type: StepType;
  delay_days: number;
  delay_hours: number;
  template_id: string | null;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  task_title: string | null;
  task_description: string | null;
  condition_field: string | null;
  condition_operator: string | null;
  condition_value: string | null;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface EmailSequenceEnrollment {
  id: string;
  org_id: string;
  sequence_id: string;
  lead_id: string | null;
  contact_email: string;
  contact_name: string | null;
  current_step: number;
  status: EnrollmentStatus;
  enrolled_at: string;
  next_step_at: string | null;
  completed_at: string | null;
  enrolled_by: string | null;
  metadata: Record<string, unknown>;
}

export interface SequenceEvent {
  id: string;
  enrollment_id: string;
  step_id: string | null;
  event_type: SequenceEventType;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

export interface SequenceStats {
  total_enrolled: number;
  active: number;
  completed: number;
  replied: number;
  bounced: number;
  open_rate: number | null;
  click_rate: number | null;
  reply_rate: number | null;
}

// ============================================================================
// Customer Surveys (CSAT / NPS)
// ============================================================================

export type SurveyType = 'csat' | 'nps' | 'custom';
export type SurveyTrigger = 'manual' | 'post_inspection' | 'monthly' | 'quarterly' | 'on_ticket_resolve';
export type SurveyStatus = 'draft' | 'active' | 'paused' | 'archived';
export type QuestionType = 'rating' | 'nps' | 'text' | 'multiple_choice' | 'yes_no';
export type ResponseStatus = 'pending' | 'partial' | 'completed' | 'expired';

export interface CustomerSurvey {
  id: string;
  org_id: string;
  name: string;
  survey_type: SurveyType;
  description: string | null;
  trigger_type: SurveyTrigger;
  status: SurveyStatus;
  settings: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  questions?: SurveyQuestion[];
  response_count?: number;
  avg_score?: number | null;
}

export interface SurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  is_required: boolean;
  sort_order: number;
  created_at: string;
}

export interface SurveyResponse {
  id: string;
  org_id: string;
  survey_id: string;
  account_id: string | null;
  facility_id: string | null;
  respondent_email: string | null;
  respondent_name: string | null;
  overall_score: number | null;
  nps_score: number | null;
  status: ResponseStatus;
  token: string;
  submitted_at: string | null;
  expires_at: string | null;
  created_at: string;
  // Joined
  answers?: SurveyAnswer[];
  accounts?: { name: string } | null;
  facilities?: { name: string } | null;
}

export interface SurveyAnswer {
  id: string;
  response_id: string;
  question_id: string;
  answer_text: string | null;
  answer_rating: number | null;
  answer_choice: string | null;
  created_at: string;
}

export interface SurveyScorecard {
  avg_csat: number | null;
  nps_score: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  total_responses: number;
  response_rate: number | null;
  trend: 'up' | 'down' | 'stable';
  by_account: Array<{
    account_id: string;
    account_name: string;
    avg_score: number;
    response_count: number;
  }>;
}

// ============================================================================
// Route Optimization & GPS Check-In
// ============================================================================

export type RoutePlanStatus = 'draft' | 'optimized' | 'active' | 'completed';
export type RouteStopStatus = 'pending' | 'en_route' | 'arrived' | 'in_progress' | 'completed' | 'skipped';
export type CheckType = 'in' | 'out';

export interface RoutePlan {
  id: string;
  org_id: string;
  name: string;
  date: string;
  crew_id: string | null;
  assigned_to: string | null;
  status: RoutePlanStatus;
  total_drive_min: number | null;
  total_stops: number | null;
  optimization_metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  stops?: RouteStop[];
  profiles?: { full_name: string } | null;
}

export interface RouteStop {
  id: string;
  route_id: string;
  facility_id: string | null;
  stop_order: number;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  arrival_time: string | null;
  departure_time: string | null;
  estimated_duration_min: number | null;
  actual_duration_min: number | null;
  drive_time_from_prev_min: number | null;
  status: RouteStopStatus;
  notes: string | null;
  created_at: string;
  // Joined
  facilities?: { name: string; address?: string } | null;
}

export interface CrewCheckIn {
  id: string;
  org_id: string;
  user_id: string;
  facility_id: string | null;
  route_stop_id: string | null;
  check_type: CheckType;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
  is_within_geofence: boolean | null;
  photo_url: string | null;
  device_info: Record<string, unknown>;
  checked_at: string;
  // Joined
  profiles?: { full_name: string } | null;
  facilities?: { name: string } | null;
}

export interface TimeOnSiteReport {
  facility_id: string;
  facility_name: string;
  date: string;
  user_name: string;
  check_in: string;
  check_out: string | null;
  duration_min: number | null;
  within_geofence: boolean;
}

// ============================================================================
// Workflow Automation Engine
// ============================================================================

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TriggerType =
  | 'inspection_completed' | 'inspection_score_below'
  | 'ticket_created' | 'ticket_resolved'
  | 'invoice_overdue' | 'invoice_paid'
  | 'contract_expiring'
  | 'survey_score_below' | 'survey_completed'
  | 'work_order_created' | 'work_order_completed'
  | 'lead_created' | 'proposal_sent' | 'proposal_signed'
  | 'schedule' | 'manual';
export type ActionType =
  | 'send_email' | 'send_sms'
  | 'create_task' | 'create_work_order' | 'create_issue'
  | 'update_status' | 'update_field'
  | 'assign_to_user' | 'assign_to_crew'
  | 'create_notification' | 'log_activity'
  | 'wait' | 'condition';
export type WorkflowLogStatus = 'started' | 'completed' | 'failed' | 'skipped';

export interface AutomationWorkflow {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  status: WorkflowStatus;
  run_count: number;
  last_run_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  triggers?: AutomationTrigger[];
  actions?: AutomationAction[];
}

export interface AutomationTrigger {
  id: string;
  workflow_id: string;
  trigger_type: TriggerType;
  conditions: Record<string, unknown>;
  schedule_cron: string | null;
  created_at: string;
}

export interface AutomationAction {
  id: string;
  workflow_id: string;
  action_order: number;
  action_type: ActionType;
  config: Record<string, unknown>;
  created_at: string;
}

export interface AutomationLog {
  id: string;
  workflow_id: string;
  trigger_id: string | null;
  status: WorkflowLogStatus;
  actions_run: number;
  trigger_data: Record<string, unknown>;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// ============================================================================
// Contract Renewals
// ============================================================================

export type RenewalStatus =
  | 'upcoming' | 'notified_90d' | 'notified_60d' | 'notified_30d'
  | 'proposal_sent' | 'negotiating' | 'renewed' | 'lost' | 'expired';

export interface ContractRenewal {
  id: string;
  org_id: string;
  account_id: string;
  contract_id: string | null;
  contract_name: string | null;
  current_mrr: number | null;
  proposed_mrr: number | null;
  expires_at: string;
  renewal_status: RenewalStatus;
  assigned_to: string | null;
  proposal_id: string | null;
  notes: string | null;
  auto_renew: boolean;
  renewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  accounts?: { name: string } | null;
  profiles?: { full_name: string } | null;
}

export interface RenewalPipelineSummary {
  expiring_30d: number;
  expiring_60d: number;
  expiring_90d: number;
  total_mrr_at_risk: number;
  renewed_mtd: number;
  lost_mtd: number;
  renewal_rate_ytd: number | null;
}

// ============================================================================
// Feature Codes (must match features table codes)
// ============================================================================

export const FEATURE_CODES = {
  RECURRING_BILLING: 'recurring_billing',
  WORK_ORDERS: 'work_orders',
  MARKETING_AUTOMATION: 'marketing_automation',
  CUSTOMER_SURVEYS: 'customer_surveys',
  ROUTE_OPTIMIZATION: 'route_optimization',
  WORKFLOW_ENGINE: 'workflow_engine',
  CONTRACT_RENEWALS: 'contract_renewals',
  CUSTOMER_PORTAL: 'customer_portal',
} as const;

export type FeatureCode = (typeof FEATURE_CODES)[keyof typeof FEATURE_CODES];
