/**
 * GRIZZLY Sales Engine — server actions.
 * All actions validate with Zod where applicable; org-scoped and RLS-safe.
 */

export {
  createLead,
  convertLeadToOpportunity,
  setLeadStatusAction,
  getLeadForDrawer,
} from '@/actions/leads';

export type { CreateLeadInput, CreateLeadResult, LeadForDrawer, ConvertLeadToOpportunityInput, ConvertLeadToOpportunityResult } from '@/actions/leads';

// Re-export for GRIZZLY: assignLead can be implemented as updateLead with assigned_to
// markLeadQualified = setLeadStatusAction(leadId, 'qualified')
// archiveLead = updateLead with is_archived: true
// createWalkthroughFromLead, createOpportunityFromLead → use convertLeadToOpportunity with options
// enrichLead → call integrations/leads adapters and write to lead_enrichment_snapshots
