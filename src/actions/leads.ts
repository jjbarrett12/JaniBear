'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId, getCurrentUser, getCurrentOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type CreateLeadInput = {
  source: 'paste' | 'email' | 'text' | 'third_party' | 'voice' | 'scan';
  contact_name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  raw_text?: string | null;
};

export type CreateLeadResult = { ok: true; leadId: string } | { ok: false; error: string };

/** Create a new lead (e.g. from Import Lead paste/email/scan). Uses server client to avoid schema cache issues. */
export async function createLead(input: CreateLeadInput): Promise<CreateLeadResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Not signed in.' };
  const org = await getCurrentOrg();
  if (!org?.org_id) return { ok: false, error: 'Organization not found.' };
  const supabase = await createClient();
  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      org_id: org.org_id,
      source: input.source,
      contact_name: input.contact_name ?? null,
      company: input.company ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      raw_text: input.raw_text ?? null,
      status: 'new',
      created_by_user_id: user.id,
    })
    .select('id')
    .single();
  if (error) {
    const msg = error.message ?? '';
    if (msg.includes('schema cache') || msg.includes('does not exist') || (msg.includes('relation') && msg.includes('leads')))
      return { ok: false, error: 'Leads table is missing. In Supabase Dashboard open SQL Editor and run the migration: supabase/migrations/089_ensure_leads_table.sql (or run: supabase db push).' };
    return { ok: false, error: error.message };
  }
  if (!lead?.id) return { ok: false, error: 'Failed to create lead' };

  // Duplicate detection: flag new lead if it matches existing leads in org
  try {
    const { data: candidates } = await supabase
      .from('leads')
      .select('id, org_id, company, contact_name, email, phone, city, state, address')
      .eq('org_id', org.org_id)
      .limit(400);
    const newLeadRecord = {
      id: lead.id,
      org_id: org.org_id,
      company: input.company ?? null,
      contact_name: input.contact_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      address: input.address ?? null,
    };
    const { findDuplicateCandidates } = await import('@/lib/sales/duplicateDetection');
    const matches = findDuplicateCandidates(newLeadRecord, (candidates ?? []) as Parameters<typeof findDuplicateCandidates>[1], lead.id);
    if (matches.length > 0) {
      await supabase.from('leads').update({ is_possible_duplicate: true, updated_at: new Date().toISOString() }).eq('id', lead.id).eq('org_id', org.org_id);
    }
  } catch {
    // Non-fatal: duplicate flag is best-effort
  }

  revalidatePath('/app/sales/leads');
  revalidatePath('/app/sales/leads/new');
  return { ok: true, leadId: lead.id };
}

export type LeadForDrawer = {
  lead: {
    id: string;
    contact_name: string | null;
    company: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    source: string;
    status: string;
    notes: string | null;
    raw_text: string | null;
    created_at: string;
    updated_at: string;
    converted_opportunity_id: string | null;
  } | null;
  touchLog: { id: string; completed_at: string | null; channel: string; notes: string | null }[];
  nextTouchAt: string | null;
};

export async function getLeadForDrawer(orgId: string, leadId: string): Promise<LeadForDrawer> {
  const supabase = await createClient();
  const { data: lead } = await supabase
    .from('leads')
    .select('id, contact_name, company, email, phone, address, city, state, zip, source, status, notes, raw_text, created_at, updated_at, converted_opportunity_id')
    .eq('id', leadId)
    .eq('org_id', orgId)
    .single();

  const [touchRes, enrollmentRes] = await Promise.all([
    supabase.from('lead_touch_log').select('id, completed_at, channel, notes').eq('lead_id', leadId).order('completed_at', { ascending: false, nullsFirst: false }).limit(20),
    supabase.from('lead_cadence_enrollments').select('next_touch_at').eq('lead_id', leadId).maybeSingle(),
  ]);

  const touchLog = (touchRes.data ?? []) as { id: string; completed_at: string | null; channel: string; notes: string | null }[];
  const nextTouchAt = enrollmentRes.data?.next_touch_at ?? null;

  return { lead: lead ?? null, touchLog, nextTouchAt };
}

export type ConvertLeadToOpportunityInput = {
  leadId: string;
  /** Use existing account (id). */
  accountId?: string | null;
  /** Create new account; name required. */
  createNewAccount?: boolean;
  accountName?: string;
  /** Link this proposal to the new opportunity. */
  proposalId?: string | null;
  stage?: string;
  expectedValueCents?: number | null;
  closeDate?: string | null;
};

export type ConvertLeadToOpportunityResult =
  | { ok: true; opportunityId: string; accountId: string; contactId: string; launchPacketId: string; alreadyConverted?: boolean }
  | { ok: false; error: string };

/**
 * Convert lead to Contact → Account → Opportunity → Launch Packet (production-safe, idempotent).
 * Creates account_contact, find-or-create account, opportunity, launch packet with full payload; audit logged.
 * If lead already converted, returns existing ids and ensures a launch packet exists.
 */
export async function convertLeadToOpportunity(
  input: ConvertLeadToOpportunityInput
): Promise<ConvertLeadToOpportunityResult> {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) return { ok: false, error: 'Not signed in' };

  const { convertLeadAndCreateLaunchPacket } = await import('@/lib/sales/convert-and-launch');
  const result = await convertLeadAndCreateLaunchPacket({
    orgId: org.org_id,
    userId,
    leadId: input.leadId,
    accountId: input.accountId,
    createNewAccount: input.createNewAccount,
    accountName: input.accountName ?? undefined,
    proposalId: input.proposalId,
    stage: input.stage,
    expectedValueCents: input.expectedValueCents,
    closeDate: input.closeDate ?? undefined,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath('/app/sales/leads');
  revalidatePath(`/app/sales/leads/${input.leadId}`);
  revalidatePath('/app/sales/launch-packets');
  revalidatePath(`/app/sales/launch-packets/${result.launchPacketId}`);
  revalidatePath('/app/sales/pipeline');
  revalidatePath('/app/crm/pipeline');
  revalidatePath(`/app/crm/opportunities/${result.opportunityId}`);
  return {
    ok: true,
    opportunityId: result.opportunityId,
    accountId: result.accountId,
    contactId: result.contactId,
    launchPacketId: result.launchPacketId,
    alreadyConverted: result.alreadyConverted,
  };
}

/** Set lead status (e.g. 'lost' for Disqualify). Updates rep_lead_counters when status bucket changes. */
export async function setLeadStatusAction(leadId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();
  const allowed = [
    'new', 'enriched', 'working', 'attempted_contact', 'contacted', 'qualified',
    'walkthrough_scheduled', 'walkthrough_completed', 'walkthrough_done', 'proposal_stage', 'proposal_sent',
    'converted', 'unqualified', 'won', 'lost',
  ];
  if (!allowed.includes(status)) return { ok: false, error: 'Invalid status' };
  const { data: lead } = await supabase
    .from('leads')
    .select('assigned_user_id, status')
    .eq('id', leadId)
    .eq('org_id', org.org_id)
    .single();
  const prevStatus = (lead as { status?: string } | null)?.status ?? null;
  const assignee = (lead as { assigned_user_id?: string | null } | null)?.assigned_user_id ?? null;
  const { error } = await supabase
    .from('leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('org_id', org.org_id);
  if (error) return { ok: false, error: error.message };
  if (assignee && (prevStatus !== status)) {
    const { updateRepLeadCounters } = await import('@/lib/leads/capacity/updateRepLeadCounters');
    await updateRepLeadCounters(org.org_id, {
      prevAssigneeId: assignee,
      newAssigneeId: assignee,
      prevStatus,
      newStatus: status,
    });
  }
  revalidatePath('/app/sales/leads');
  revalidatePath(`/app/sales/leads/${leadId}`);
  return { ok: true };
}

/** GRIZZLY: Assign lead to a rep (assigned_to and assigned_user_id for compatibility). */
export async function assignLeadAction(leadId: string, userId: string | null): Promise<{ ok: boolean; error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();
  const { error } = await supabase
    .from('leads')
    .update({
      assigned_user_id: userId ?? null,
      assigned_to: userId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)
    .eq('org_id', org.org_id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/app/sales/leads');
  revalidatePath(`/app/sales/leads/${leadId}`);
  return { ok: true };
}
