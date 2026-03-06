/**
 * Map lead.status to counter bucket for rep_lead_counters.
 * new_count = "new" / uncontacted; working_count = in progress; qualified_count = qualified/won.
 */

export type LeadCountBucket = 'new' | 'working' | 'qualified';

const NEW_STATUSES = new Set(['new', 'uncontacted']);
const WORKING_STATUSES = new Set([
  'contacted',
  'proposal_sent',
  'walkthrough_scheduled',
  'walkthrough_done',
  'working',
  'in_progress',
]);
const QUALIFIED_STATUSES = new Set(['qualified', 'won', 'closed_won']);

export function getLeadStatusBucket(status: string | null | undefined): LeadCountBucket | null {
  if (!status || typeof status !== 'string') return null;
  const s = status.toLowerCase().trim();
  if (NEW_STATUSES.has(s)) return 'new';
  if (WORKING_STATUSES.has(s)) return 'working';
  if (QUALIFIED_STATUSES.has(s)) return 'qualified';
  return null;
}
