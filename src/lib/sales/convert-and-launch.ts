/**
 * Production-safe sales conversion: Lead → Contact → Account → Opportunity → Launch Packet.
 * Idempotent when lead already converted; no duplicate account/contact/opportunity; audit logged.
 */
import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { buildLaunchPayloadFromLead, type LaunchPacketPayload } from './launch-packet-payload';

export type ConvertAndLaunchInput = {
  orgId: string;
  userId: string;
  leadId: string;
  accountId?: string | null;
  createNewAccount?: boolean;
  accountName?: string | null;
  proposalId?: string | null;
  stage?: string;
  expectedValueCents?: number | null;
  closeDate?: string | null;
  payloadOverrides?: Partial<LaunchPacketPayload>;
};

export type ConvertAndLaunchResult =
  | {
      ok: true;
      opportunityId: string;
      accountId: string;
      contactId: string;
      launchPacketId: string;
      alreadyConverted: boolean;
    }
  | { ok: false; error: string; code?: string };

/** Find or create account; returns account id. */
async function findOrCreateAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  lead: { company?: string | null; contact_name?: string | null },
  input: { accountId?: string | null; createNewAccount?: boolean; accountName?: string | null }
): Promise<{ id: string } | { error: string }> {
  if (input.createNewAccount && input.accountName?.trim()) {
    const { data, error } = await supabase
      .from('accounts')
      .insert({ org_id: orgId, name: input.accountName.trim(), status: 'inactive' })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'Failed to create account' };
    return { id: data.id };
  }
  if (input.accountId) {
    const { data } = await supabase.from('accounts').select('id').eq('id', input.accountId).eq('org_id', orgId).single();
    if (!data) return { error: 'Account not found' };
    return { id: data.id };
  }
  const companyName = (lead.company?.trim() || lead.contact_name?.trim() || '').toLowerCase();
  if (!companyName) return { error: 'Select an account or provide a company/account name' };
  const { data: existing } = await supabase
    .from('accounts')
    .select('id')
    .eq('org_id', orgId)
    .ilike('name', companyName)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return { id: existing.id };
  const { data: created, error } = await supabase
    .from('accounts')
    .insert({ org_id: orgId, name: lead.company?.trim() || lead.contact_name?.trim() || 'Unknown', status: 'inactive' })
    .select('id')
    .single();
  if (error || !created) return { error: error?.message ?? 'Failed to create account' };
  return { id: created.id };
}

/** Find or create account_contact for this account (match by email or create). */
async function findOrCreateContact(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  accountId: string,
  lead: {
    contact_name?: string | null;
    contact_first_name?: string | null;
    contact_last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    mobile?: string | null;
  }
): Promise<{ id: string } | { error: string }> {
  const email = lead.email?.trim() || null;
  const [first, ...rest] = (lead.contact_name?.trim() || '').split(/\s+/);
  const firstName = lead.contact_first_name?.trim() || first || null;
  const lastName = lead.contact_last_name?.trim() || rest.join(' ') || null;
  if (email) {
    const { data: existing } = await supabase
      .from('account_contacts')
      .select('id')
      .eq('org_id', orgId)
      .eq('account_id', accountId)
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return { id: existing.id };
  }
  const { data: created, error } = await supabase
    .from('account_contacts')
    .insert({
      org_id: orgId,
      account_id: accountId,
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: lead.phone?.trim() || lead.mobile?.trim() || null,
      is_primary: true,
    })
    .select('id')
    .single();
  if (error || !created) return { error: error?.message ?? 'Failed to create contact' };
  return { id: created.id };
}

export async function convertLeadAndCreateLaunchPacket(
  input: ConvertAndLaunchInput
): Promise<ConvertAndLaunchResult> {
  const supabase = await createClient();
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', input.leadId)
    .eq('org_id', input.orgId)
    .single();
  if (leadErr || !lead) return { ok: false, error: 'Lead not found', code: 'NOT_FOUND' };

  const leadRow = lead as Record<string, unknown>;

  // Idempotent: already converted — return existing and ensure launch packet exists
  if (leadRow.converted_opportunity_id) {
    const oppId = leadRow.converted_opportunity_id as string;
    const accountId = (leadRow.converted_account_id as string) || (await supabase.from('opportunities').select('account_id').eq('id', oppId).single().then((r) => r.data?.account_id));
    if (!accountId) return { ok: false, error: 'Conversion state inconsistent', code: 'STATE' };
    let contactId = leadRow.converted_contact_id as string | undefined;
    if (!contactId) {
      const opp = await supabase.from('opportunities').select('contact_id').eq('id', oppId).single();
      contactId = opp.data?.contact_id ?? undefined;
    }
    let { data: packet } = await supabase
      .from('launch_packets')
      .select('id')
      .eq('org_id', input.orgId)
      .eq('opportunity_id', oppId)
      .maybeSingle();
    if (!packet) {
      const account = await supabase.from('accounts').select('id, name, billing_contact_name, billing_email, billing_phone').eq('id', accountId).single().then((r) => r.data);
      const payload = buildLaunchPayloadFromLead({
        lead: leadRow as Parameters<typeof buildLaunchPayloadFromLead>[0]['lead'],
        account: account ?? undefined,
        overrides: input.payloadOverrides,
      });
      const { data: newPacket, error: insertErr } = await supabase
        .from('launch_packets')
        .insert({
          org_id: input.orgId,
          account_id: accountId,
          opportunity_id: oppId,
          lead_id: input.leadId,
          status: 'draft',
          payload_jsonb: payload,
          created_by: input.userId,
          sales_owner: input.userId,
        })
        .select('id')
        .single();
      if (insertErr || !newPacket) return { ok: false, error: insertErr?.message ?? 'Failed to create launch packet' };
      packet = newPacket;
    }
    return {
      ok: true,
      opportunityId: oppId,
      accountId,
      contactId: contactId ?? '',
      launchPacketId: packet.id,
      alreadyConverted: true,
    };
  }

  const accountResult = await findOrCreateAccount(supabase, input.orgId, leadRow as { company?: string | null; contact_name?: string | null }, input);
  if ('error' in accountResult) return { ok: false, error: accountResult.error };
  const accountId = accountResult.id;

  const contactResult = await findOrCreateContact(
    supabase,
    input.orgId,
    accountId,
    leadRow as {
      contact_name?: string | null;
      contact_first_name?: string | null;
      contact_last_name?: string | null;
      email?: string | null;
      phone?: string | null;
      mobile?: string | null;
    }
  );
  if ('error' in contactResult) return { ok: false, error: contactResult.error };
  const contactId = contactResult.id;

  const stage = (input.stage?.trim() || 'qualified').toLowerCase().replace(/\s+/g, '_');
  const estValue = input.expectedValueCents != null ? input.expectedValueCents / 100 : null;
  const { data: opportunity, error: oppErr } = await supabase
    .from('opportunities')
    .insert({
      org_id: input.orgId,
      account_id: accountId,
      contact_id: contactId,
      lead_id: input.leadId,
      stage: stage || 'qualified',
      est_value: estValue,
      expected_close_date: input.closeDate || null,
      owner_id: input.userId,
      created_by: input.userId,
    })
    .select('id')
    .single();
  if (oppErr || !opportunity) return { ok: false, error: oppErr?.message ?? 'Failed to create opportunity' };

  if (input.proposalId) {
    await supabase
      .from('proposals')
      .update({ opportunity_id: opportunity.id, updated_at: new Date().toISOString() })
      .eq('id', input.proposalId)
      .eq('org_id', input.orgId);
    await supabase
      .from('opportunities')
      .update({ proposal_id: input.proposalId, updated_at: new Date().toISOString() })
      .eq('id', opportunity.id)
      .eq('org_id', input.orgId);
  }

  const account = await supabase.from('accounts').select('id, name, billing_contact_name, billing_email, billing_phone').eq('id', accountId).single().then((r) => r.data);
  const payload = buildLaunchPayloadFromLead({
    lead: leadRow as Parameters<typeof buildLaunchPayloadFromLead>[0]['lead'],
    account: account ?? undefined,
    overrides: input.payloadOverrides,
  });

  const { data: packet, error: packetErr } = await supabase
    .from('launch_packets')
    .insert({
      org_id: input.orgId,
      account_id: accountId,
      opportunity_id: opportunity.id,
      lead_id: input.leadId,
      status: 'draft',
      payload_jsonb: payload,
      created_by: input.userId,
      sales_owner: input.userId,
    })
    .select('id')
    .single();
  if (packetErr || !packet) return { ok: false, error: packetErr?.message ?? 'Failed to create launch packet' };

  const { error: updateErr } = await supabase
    .from('leads')
    .update({
      converted_opportunity_id: opportunity.id,
      converted_account_id: accountId,
      converted_contact_id: contactId,
      converted_at: new Date().toISOString(),
      status: 'converted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.leadId)
    .eq('org_id', input.orgId);
  if (updateErr) return { ok: false, error: updateErr.message };

  try {
    await supabase.from('audit_logs').insert({
      org_id: input.orgId,
      actor_user_id: input.userId,
      event_type: 'lead_converted',
      target_table: 'leads',
      target_id: input.leadId,
      metadata: {
        opportunity_id: opportunity.id,
        account_id: accountId,
        contact_id: contactId,
        launch_packet_id: packet.id,
        proposal_id: input.proposalId ?? null,
      },
    });
  } catch {
    // Non-fatal
  }

  return {
    ok: true,
    opportunityId: opportunity.id,
    accountId,
    contactId,
    launchPacketId: packet.id,
    alreadyConverted: false,
  };
}
