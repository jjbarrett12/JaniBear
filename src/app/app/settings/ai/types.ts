/**
 * AI Control Center — shared types and enums.
 * Triggers/actions match spec; validation via zod in actions.
 */

export const AI_TRIGGER_TYPES = [
  'inspection_score_below',
  'account_health_below',
  'invoice_overdue_days',
  'lead_inactive_days',
  'sla_breach',
  'schedule_gap_no_crew',
] as const;

export const AI_ACTION_TYPES = [
  'generate_action_plan',
  'draft_client_email',
  'draft_internal_summary',
  'create_task',
  'post_alert',
  'generate_proposal_addendum',
] as const;

export const AI_MODULE_KEYS = [
  'proposals.generator',
  'walkthrough.scope_builder',
  'inspections.risk_analysis',
  'accounts.health_assistant',
  'finance.leakage_detection',
  'comms.auto_followups',
  'ops.crew_optimization',
] as const;

export type AiTriggerType = (typeof AI_TRIGGER_TYPES)[number];
export type AiActionType = (typeof AI_ACTION_TYPES)[number];
export type AiModuleKey = (typeof AI_MODULE_KEYS)[number];

export interface AiOrgConfigRow {
  id: string;
  org_id: string;
  ai_enabled: boolean;
  budget_limit_cents: number | null;
  budget_hard_cap: boolean;
  notify_at_percent?: number | null;
  notify_channel?: 'in_app' | 'email' | 'slack' | null;
  data_access: Record<string, boolean>;
  redaction_level: 'none' | 'basic' | 'aggressive';
  retain_prompts: boolean;
  retain_prompts_days: number;
  model_key: string;
  temperature: number;
  response_length: 'short' | 'standard' | 'detailed';
  confidence_threshold: 'low' | 'med' | 'high';
  use_cheaper_model_drafts: boolean;
  provider: 'openai' | 'byok';
  byok_validated_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Module key -> label for UI */
export const MODULE_LABELS: Record<string, string> = {
  'proposals.generator': 'Proposal Generator',
  'walkthrough.scope_builder': 'Scope Builder',
  'inspections.risk_analysis': 'Inspection Risk Analysis',
  'accounts.health_assistant': 'Account Health Assistant',
  'finance.leakage_detection': 'Revenue Leakage Detection',
  'comms.auto_followups': 'Auto Follow-ups',
  'ops.crew_optimization': 'Crew Optimization',
};

/** Module key -> one-line description */
export const MODULE_DESCRIPTIONS: Record<string, string> = {
  'proposals.generator': 'Draft proposals from walkthrough + pricing',
  'walkthrough.scope_builder': 'Turn walkthrough notes into scoped tasks',
  'inspections.risk_analysis': 'Spot risk and failure patterns',
  'accounts.health_assistant': 'Detect churn risk and next-best action',
  'finance.leakage_detection': 'Find missed charges and scope creep',
  'comms.auto_followups': 'Draft follow-ups for overdue invoices & leads',
  'ops.crew_optimization': 'Suggest staffing + routing improvements',
};

/** Human-readable trigger summary from trigger_type + trigger_params */
export function triggerSummary(triggerType: string, triggerParams: Record<string, unknown>): string {
  switch (triggerType) {
    case 'inspection_score_below':
      return `Inspection score below ${Number(triggerParams?.threshold ?? 85)}%`;
    case 'invoice_overdue_days':
      return `Invoice overdue by ${Number(triggerParams?.days ?? 30)} days`;
    case 'sla_breach':
      return 'SLA breach detected';
    case 'account_health_below':
      return `Account health below ${Number(triggerParams?.threshold ?? 60)}%`;
    case 'lead_inactive_days':
      return `Lead inactive ${Number(triggerParams?.days ?? 14)} days`;
    case 'schedule_gap_no_crew':
      return 'Schedule gap (no crew)';
    default:
      return triggerType;
  }
}

/** Human-readable action summary from actions jsonb */
export function actionSummary(actions: unknown[]): string {
  const labels: Record<string, string> = {
    generate_action_plan: 'Generate action plan',
    create_task: 'Create task',
    draft_client_email: 'Draft client email',
    draft_internal_summary: 'Draft internal summary',
    post_alert: 'Post alert',
    generate_proposal_addendum: 'Generate proposal addendum',
  };
  const list = Array.isArray(actions)
    ? (actions as { type?: string }[]).map((a) => labels[a?.type ?? ''] ?? a?.type ?? '—')
    : [];
  return list.length ? list.join(', ') : '—';
}

export interface AiModuleStateRow {
  id: string;
  org_id: string;
  module_key: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  calls_this_month: number;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiAutomationRuleRow {
  id: string;
  org_id: string;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_params: Record<string, unknown>;
  conditions: unknown[];
  actions: unknown[];
  notify_settings: Record<string, unknown>;
  cooldown_minutes: number;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiUsageRow {
  id: string;
  org_id: string;
  period: string;
  usage_date: string | null;
  tokens_input: number;
  tokens_output: number;
  estimated_cost_cents: number;
  module_key: string | null;
  created_at: string;
}

export interface AiAuditLogRow {
  id: string;
  org_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown> | null;
  created_at: string;
}
