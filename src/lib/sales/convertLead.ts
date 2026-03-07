/**
 * Robust conversion: Lead → Account, Contact, Opportunity, optional Walkthrough.
 * Prevents double conversion; writes activity logs; validates minimum data.
 */

import type { ConvertLeadOptions } from './schemas';
import type { LeadRecord } from './types';

export type ConversionResult =
  | { ok: true; opportunityId: string; accountId: string; contactId?: string; walkthroughId?: string }
  | { ok: false; error: string; code?: 'MINIMUM_DATA' | 'DUPLICATE' | 'ALREADY_CONVERTED' | 'VALIDATION' };

export interface ConvertLeadToSalesObjectsDeps {
  getLead: (leadId: string, orgId: string) => Promise<LeadRecord | null>;
  findDuplicateAccount: (orgId: string, companyName: string) => Promise<{ id: string } | null>;
  createAccount: (orgId: string, name: string, createdBy: string) => Promise<{ id: string }>;
  createContact: (orgId: string, accountId: string, lead: LeadRecord, createdBy: string) => Promise<{ id: string }>;
  createOpportunity: (params: {
    orgId: string;
    accountId: string;
    contactId?: string;
    leadId: string;
    stage: string;
    expectedValueCents?: number | null;
    expectedCloseDate?: string | null;
    ownerId: string;
    source?: string;
  }) => Promise<{ id: string }>;
  createWalkthrough: (params: {
    orgId: string;
    opportunityId: string;
    leadId: string;
    scheduledAt?: string;
    assignedRepId: string;
    buildingAddress?: string;
  }) => Promise<{ id: string }>;
  updateLeadConverted: (leadId: string, orgId: string, opportunityId: string, accountId: string) => Promise<void>;
  writeActivity: (params: {
    orgId: string;
    leadId: string;
    activityType: string;
    subject?: string;
    body?: string;
    createdBy: string;
    meta?: Record<string, unknown>;
  }) => Promise<void>;
}

const MINIMUM_FOR_CONVERSION = {
  companyOrContact: true,
};

/** Validate minimum data before conversion */
export function validateLeadForConversion(lead: LeadRecord): { valid: boolean; error?: string } {
  const hasCompanyOrContact = !!(lead.company?.trim() || lead.contact_name?.trim());
  if (!hasCompanyOrContact) return { valid: false, error: 'Company or contact name is required to convert.' };
  return { valid: true };
}

/** Main conversion: validate, detect duplicate, create/link account, contact, opportunity, optional walkthrough, update lead, log activity. */
export async function convertLeadToSalesObjects(
  options: ConvertLeadOptions,
  deps: ConvertLeadToSalesObjectsDeps,
  orgId: string,
  userId: string
): Promise<ConversionResult> {
  const lead = await deps.getLead(options.leadId, orgId);
  if (!lead) return { ok: false, error: 'Lead not found.', code: 'VALIDATION' };
  if (lead.converted_opportunity_id) return { ok: false, error: 'Lead already converted.', code: 'ALREADY_CONVERTED' };

  const validation = validateLeadForConversion(lead);
  if (!validation.valid) return { ok: false, error: validation.error!, code: 'MINIMUM_DATA' };

  const companyName = lead.company?.trim() || lead.contact_name?.trim() || 'Unknown';
  let accountId: string;

  if (options.createNewAccount && options.accountName?.trim()) {
    const created = await deps.createAccount(orgId, options.accountName.trim(), userId);
    accountId = created.id;
  } else if (options.accountId) {
    accountId = options.accountId;
  } else {
    const duplicate = await deps.findDuplicateAccount(orgId, companyName);
    if (duplicate) accountId = duplicate.id;
    else {
      const created = await deps.createAccount(orgId, companyName, userId);
      accountId = created.id;
    }
  }

  const contact = await deps.createContact(orgId, accountId, lead, userId);
  const opportunity = await deps.createOpportunity({
    orgId,
    accountId,
    contactId: contact.id,
    leadId: lead.id,
    stage: options.opportunityStage || 'qualified',
    expectedValueCents: options.expectedValueCents ?? null,
    expectedCloseDate: options.expectedCloseDate ?? null,
    ownerId: userId,
    source: lead.source ?? 'manual',
  });

  let walkthroughId: string | undefined;
  if (options.createWalkthrough && options.walkthroughScheduledAt) {
    const wt = await deps.createWalkthrough({
      orgId,
      opportunityId: opportunity.id,
      leadId: lead.id,
      scheduledAt: options.walkthroughScheduledAt,
      assignedRepId: userId,
      buildingAddress: lead.address ?? undefined,
    });
    walkthroughId = wt.id;
  }

  await deps.updateLeadConverted(lead.id, orgId, opportunity.id, accountId);
  await deps.writeActivity({
    orgId,
    leadId: lead.id,
    activityType: 'converted',
    subject: 'Converted to opportunity',
    body: `Opportunity ${opportunity.id}; Account ${accountId}${walkthroughId ? `; Walkthrough ${walkthroughId}` : ''}.`,
    createdBy: userId,
    meta: { opportunityId: opportunity.id, accountId, walkthroughId },
  });

  return {
    ok: true,
    opportunityId: opportunity.id,
    accountId,
    contactId: contact.id,
    walkthroughId,
  };
}
