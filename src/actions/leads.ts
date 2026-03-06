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
  stage?: string;
  expectedValueCents?: number | null;
  closeDate?: string | null;
};

export type ConvertLeadToOpportunityResult =
  | { ok: true; opportunityId: string; accountId: string }
  | { ok: false; error: string };

/** Convert a lead to an opportunity: create/link account, create opportunity, update lead. */
export async function convertLeadToOpportunity(
  input: ConvertLeadToOpportunityInput
): Promise<ConvertLeadToOpportunityResult> {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from('leads')
    .select('id, org_id, company, contact_name, converted_opportunity_id')
    .eq('id', input.leadId)
    .eq('org_id', org.org_id)
    .single();

  if (!lead) return { ok: false, error: 'Lead not found' };
  if (lead.converted_opportunity_id) return { ok: false, error: 'Lead already converted to an opportunity' };

  let accountId: string;

  if (input.createNewAccount && input.accountName?.trim()) {
    const name = input.accountName.trim();
    const { data: newAccount, error: accountError } = await supabase
      .from('accounts')
      .insert({
        org_id: org.org_id,
        name,
        status: 'inactive',
      })
      .select('id')
      .single();
    if (accountError || !newAccount) return { ok: false, error: accountError?.message ?? 'Failed to create account' };
    accountId = newAccount.id;
  } else if (input.accountId) {
    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', input.accountId)
      .eq('org_id', org.org_id)
      .single();
    if (!existing) return { ok: false, error: 'Account not found' };
    accountId = existing.id;
  } else {
    return { ok: false, error: 'Select an account or create a new one' };
  }

  const stage = (input.stage?.trim() || 'qualified').toLowerCase().replace(/\s+/g, '_');
  const estValue = input.expectedValueCents != null ? input.expectedValueCents / 100 : null;

  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .insert({
      org_id: org.org_id,
      account_id: accountId,
      stage: stage || 'qualified',
      est_value: estValue,
      owner_id: userId ?? undefined,
      created_by: userId ?? undefined,
    })
    .select('id')
    .single();

  if (oppError || !opportunity) return { ok: false, error: oppError?.message ?? 'Failed to create opportunity' };

  const { error: updateError } = await supabase
    .from('leads')
    .update({
      converted_opportunity_id: opportunity.id,
      converted_account_id: accountId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.leadId)
    .eq('org_id', org.org_id);

  if (updateError) return { ok: false, error: updateError.message };

  if (process.env.NODE_ENV === 'development') {
    console.warn('[convertLeadToOpportunity]', { leadId: input.leadId, opportunityId: opportunity.id, accountId });
  }

  revalidatePath('/app/sales/leads');
  revalidatePath(`/app/sales/leads/${input.leadId}`);
  revalidatePath('/app/sales/pipeline');
  revalidatePath('/app/crm/pipeline');
  revalidatePath(`/app/crm/opportunities/${opportunity.id}`);
  return { ok: true, opportunityId: opportunity.id, accountId };
}

/** Set lead status (e.g. 'lost' for Disqualify). Updates rep_lead_counters when status bucket changes. */
export async function setLeadStatusAction(leadId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();
  const allowed = ['new', 'contacted', 'walkthrough_scheduled', 'walkthrough_done', 'proposal_sent', 'won', 'lost'];
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
