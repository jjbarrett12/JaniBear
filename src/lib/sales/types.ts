/**
 * Sales module types — B2B janitorial revenue workflow.
 * Lead → Qualified → Walkthrough → Opportunity → Proposal → Close.
 */

export const LEAD_SOURCES = [
  'manual',
  'csv_import',
  'website_form',
  'referral',
  'google_business',
  'zoominfo',
  'linkedin',
  'map_prospecting',
  'existing_customer_referral',
  'paste',
  'email',
  'text',
  'third_party',
  'voice',
  'scan',
  'other',
] as const;

export const LEAD_STATUSES = [
  'new',
  'enriched',
  'working',
  'attempted_contact',
  'contacted',
  'qualified',
  'walkthrough_scheduled',
  'walkthrough_completed',
  'proposal_stage',
  'converted',
  'unqualified',
  'lost',
  // Legacy
  'walkthrough_done',
  'proposal_sent',
  'won',
] as const;

export const WALKTHROUGH_STATUSES = [
  'requested',
  'scheduled',
  'completed',
  'no_show',
  'reschedule_needed',
  'scope_ready',
  'canceled',
] as const;

export const OPPORTUNITY_STAGES = [
  'qualified',
  'walkthrough_scheduled',
  'walkthrough_completed',
  'scoping',
  'proposal_sent',
  'negotiation',
  'verbal_yes',
  'closed_won',
  'closed_lost',
] as const;

export const PROPOSAL_STATES = [
  'draft',
  'internal_review',
  'sent',
  'viewed',
  'revision_requested',
  'accepted',
  'declined',
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type WalkthroughStatus = (typeof WALKTHROUGH_STATUSES)[number];
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];
export type ProposalState = (typeof PROPOSAL_STATES)[number];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  manual: 'Manual',
  csv_import: 'CSV Import',
  website_form: 'Website Form',
  referral: 'Referral',
  google_business: 'Google Business',
  zoominfo: 'ZoomInfo',
  linkedin: 'LinkedIn',
  map_prospecting: 'Map Prospecting',
  existing_customer_referral: 'Customer Referral',
  paste: 'Paste',
  email: 'Email',
  text: 'Text',
  third_party: 'Third Party',
  voice: 'Voice',
  scan: 'Scan',
  other: 'Other',
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  enriched: 'Enriched',
  working: 'Working',
  attempted_contact: 'Attempted',
  contacted: 'Contacted',
  qualified: 'Qualified',
  walkthrough_scheduled: 'Walkthrough Scheduled',
  walkthrough_completed: 'Walkthrough Done',
  proposal_stage: 'Proposal Stage',
  converted: 'Converted',
  unqualified: 'Unqualified',
  lost: 'Lost',
  walkthrough_done: 'Walkthrough Done',
  proposal_sent: 'Proposal Sent',
  won: 'Won',
};

export const WALKTHROUGH_STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  scheduled: 'Scheduled',
  completed: 'Completed',
  no_show: 'No Show',
  reschedule_needed: 'Reschedule Needed',
  scope_ready: 'Scope Ready',
  canceled: 'Canceled',
};

export const ENRICHMENT_STATUSES = ['pending', 'partial', 'complete', 'failed', 'skipped'] as const;
export type EnrichmentStatus = (typeof ENRICHMENT_STATUSES)[number];

export const LOST_REASONS = [
  'price',
  'no_decision',
  'incumbent_retained',
  'no_budget',
  'timing',
  'scope_mismatch',
  'poor_fit',
  'competitor_relationship',
  'lost_contact',
  'walkthrough_never_happened',
  'proposal_stalled',
  'other',
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price: 'Price',
  no_decision: 'No decision',
  incumbent_retained: 'Incumbent retained',
  no_budget: 'No budget',
  timing: 'Timing',
  scope_mismatch: 'Scope mismatch',
  poor_fit: 'Poor fit',
  competitor_relationship: 'Competitor relationship',
  lost_contact: 'Lost contact',
  walkthrough_never_happened: 'Walkthrough never happened',
  proposal_stalled: 'Proposal stalled',
  other: 'Other',
};

export const OPPORTUNITY_STAGE_LABELS: Record<OpportunityStage, string> = {
  qualified: 'Qualified',
  walkthrough_scheduled: 'Walkthrough Scheduled',
  walkthrough_completed: 'Walkthrough Completed',
  scoping: 'Scoping',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  verbal_yes: 'Verbal Yes',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

export interface LeadRecord {
  id: string;
  org_id: string;
  source: string;
  status: string;
  contact_name: string | null;
  company: string | null;
  title?: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  lat?: number | null;
  lng?: number | null;
  estimated_sq_ft?: number | null;
  estimated_locations?: number | null;
  employee_count?: number | null;
  current_cleaning_provider?: string | null;
  notes?: string | null;
  raw_text?: string | null;
  assigned_user_id?: string | null;
  assigned_to?: string | null;
  lead_score?: number | null;
  qualification_score?: number | null;
  next_follow_up_at?: string | null;
  last_contact_at?: string | null;
  enrichment_status?: string | null;
  duplicate_of_lead_id?: string | null;
  import_batch_id?: string | null;
  converted_opportunity_id?: string | null;
  converted_account_id?: string | null;
  overflow?: boolean;
  overflow_reason?: string | null;
  created_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
  /** GRIZZLY */
  legal_business_name?: string | null;
  mobile?: string | null;
  address_line_1?: string | null;
  google_place_id?: string | null;
  is_possible_duplicate?: boolean | null;
  first_touched_at?: string | null;
  last_activity_at?: string | null;
  next_action?: string | null;
  next_action_due_at?: string | null;
  lost_reason?: string | null;
  lost_notes?: string | null;
  is_archived?: boolean | null;
}

export interface LeadActivityRecord {
  id: string;
  org_id: string;
  lead_id: string;
  activity_type: 'call' | 'email' | 'sms' | 'meeting' | 'note' | 'touch' | 'status_change' | 'converted';
  subject?: string | null;
  body?: string | null;
  created_by?: string | null;
  created_at: string;
  meta?: Record<string, unknown>;
}

export interface OpportunityRecord {
  id: string;
  org_id: string;
  account_id?: string | null;
  client_id?: string | null;
  stage: string;
  est_mrr?: number | null;
  est_value?: number | null;
  owner_id?: string | null;
  expected_close_date?: string | null;
  probability?: number | null;
  loss_reason?: string | null;
  next_action?: string | null;
  next_action_due?: string | null;
  created_at: string;
  closed_at?: string | null;
}

export interface WalkthroughRecord {
  id: string;
  org_id: string;
  opportunity_id?: string | null;
  lead_id?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  status: string;
  building_address?: string | null;
  sqft_estimate?: number | null;
}

/** Saved view keys for Leads list (GRIZZLY) */
export const LEAD_SAVED_VIEWS = [
  'my_new_leads',
  'hot_leads',
  'needs_first_touch',
  'needs_follow_up',
  'ready_for_walkthrough',
  'unworked_imports',
  'high_value_targets',
  'referrals',
  'possible_duplicates',
] as const;

export type LeadSavedViewKey = (typeof LEAD_SAVED_VIEWS)[number];

/** Normalized enrichment shape for adapters (ZoomInfo, Google, LinkedIn) — do not hardwire providers in core. */
export interface NormalizedLeadEnrichment {
  companyName?: string;
  website?: string;
  phone?: string;
  industry?: string;
  employeeCount?: number;
  estimatedRevenue?: number;
  estimatedSqft?: number;
  address?: {
    line1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  contacts?: Array<{
    firstName?: string;
    lastName?: string;
    fullName?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
  }>;
  placeId?: string;
  notes?: string[];
  confidence?: number;
}
