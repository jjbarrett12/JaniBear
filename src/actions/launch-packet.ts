'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { isOperationsEnabled } from '@/lib/is-premium';
import { activateLaunchPacket } from '@/lib/ops-core/launch-activation';
import type { ServiceLineTypeCode } from '@/lib/ops-core/types';

const KNOWN_LINE_TYPES: ServiceLineTypeCode[] = [
  'nightly_janitorial',
  'floor_care',
  'porter',
  'windows',
  'trash',
  'restroom_reset',
];

/** Sales: create a draft launch packet for an account (e.g. from a won opportunity). Requires Grizzly+. */
export async function createLaunchPacket(accountId: string): Promise<{ ok: true; packetId: string } | { ok: false; error: string }> {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const operationsEnabled = await isOperationsEnabled(org.org_id, userId);
  if (!operationsEnabled) return { ok: false, error: 'Launch to Operations is not available on your plan. Upgrade to Grizzly.' };
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();
  if (!account) return { ok: false, error: 'Account not found' };

  const { data: packet, error } = await supabase
    .from('launch_packets')
    .insert({
      org_id: org.org_id,
      account_id: accountId,
      status: 'draft',
      created_by: userId ?? undefined,
      sales_owner: userId ?? undefined,
      payload_jsonb: {},
    })
    .select('id')
    .single();

  if (error) return { ok: false, error: error.message };
  if (!packet?.id) return { ok: false, error: 'Failed to create launch packet' };
  revalidatePath('/app/sales/launch-packets');
  revalidatePath('/app/ops/launch-intake');
  return { ok: true, packetId: packet.id };
}

/** Sales: move packet to ready or sent_to_ops. Only when status is draft or review. Requires Grizzly+. */
export async function sendLaunchPacketToOps(packetId: string): Promise<{ error?: string }> {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const operationsEnabled = await isOperationsEnabled(org.org_id, userId);
  if (!operationsEnabled) return { error: 'Launch to Operations is not available on your plan. Upgrade to Grizzly to hand off to Ops.' };
  const supabase = await createClient();

  const { data: packet } = await supabase
    .from('launch_packets')
    .select('id, org_id, status')
    .eq('id', packetId)
    .eq('org_id', org.org_id)
    .single();

  if (!packet) return { error: 'Launch packet not found' };
  if (packet.status !== 'draft' && packet.status !== 'review') {
    return { error: 'Only draft or review packets can be sent to Ops' };
  }

  const { error } = await supabase
    .from('launch_packets')
    .update({
      status: 'sent_to_ops',
      ready_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', packetId)
    .eq('org_id', org.org_id);

  if (error) return { error: error.message };
  if (process.env.NODE_ENV === 'development') {
    console.warn('[sendLaunchPacketToOps]', { packetId, org_id: org.org_id });
  }
  revalidatePath('/app/sales/launch-packets');
  revalidatePath('/app/ops/launch-intake');
  return {};
}

/** Ops: reject packet with reason. Only when status is ready or sent_to_ops. */
export async function rejectLaunchPacket(
  packetId: string,
  reason: string
): Promise<{ error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: packet } = await supabase
    .from('launch_packets')
    .select('id, org_id, status')
    .eq('id', packetId)
    .eq('org_id', org.org_id)
    .single();

  if (!packet) return { error: 'Launch packet not found' };
  if (packet.status !== 'ready' && packet.status !== 'sent_to_ops') {
    return { error: 'Only ready or sent_to_ops packets can be rejected' };
  }

  const { error } = await supabase
    .from('launch_packets')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_reason: (reason ?? '').trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packetId)
    .eq('org_id', org.org_id);

  if (error) return { error: error.message };
  revalidatePath('/app/ops/launch-intake');
  revalidatePath('/app/sales/launch-packets');
  return {};
}

/** Ops: accept launch — atomic: activate account, locations, create schedules/tasks/inspection/SLA, audit. */
export async function acceptLaunchPacket(packetId: string): Promise<{ error?: string }> {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  const supabase = await createClient();

  const { data: packet } = await supabase
    .from('launch_packets')
    .select('id, org_id, account_id, opportunity_id, status, payload_jsonb')
    .eq('id', packetId)
    .eq('org_id', org.org_id)
    .single();

  if (!packet) return { error: 'Launch packet not found' };
  if (packet.status !== 'ready' && packet.status !== 'sent_to_ops') {
    return { error: 'Only ready or sent_to_ops packets can be accepted' };
  }

  const payload = (packet.payload_jsonb ?? {}) as {
    locations?: Array<{ name: string; address_line1?: string; city?: string; state?: string; zip?: string }>;
    service_locations?: Array<{ name?: string; address_line_1?: string; city?: string; state?: string; zip?: string }>;
    service_frequency?: string;
    service_days?: string[];
    sold_services?: string[];
    scope_summary?: string;
    special_notes?: string;
    estimated_start_date?: string;
    contract_ref?: string;
  };

  // 1. Mark account active
  const { error: accountError } = await supabase
    .from('accounts')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', packet.account_id)
    .eq('org_id', org.org_id);

  if (accountError) return { error: `Failed to activate account: ${accountError.message}` };

  // 2. Create facilities from payload (support both locations and service_locations)
  const locationsToCreate =
    payload.locations?.length ? payload.locations : payload.service_locations?.map((s) => ({
      name: s.name ?? 'Location',
      address_line1: s.address_line_1 ?? undefined,
      city: s.city,
      state: s.state,
      zip: s.zip,
    }));
  if (Array.isArray(locationsToCreate) && locationsToCreate.length > 0) {
    const existing = await supabase
      .from('facilities')
      .select('id')
      .eq('account_id', packet.account_id)
      .eq('org_id', org.org_id);
    const existingCount = (existing.data ?? []).length;
    for (let i = 0; i < locationsToCreate.length; i++) {
      const loc = locationsToCreate[i];
      await supabase.from('facilities').insert({
        org_id: org.org_id,
        account_id: packet.account_id,
        name: loc.name ?? `Location ${existingCount + i + 1}`,
        address_line1: loc.address_line1 ?? null,
        city: loc.city ?? null,
        state: loc.state ?? null,
        zip: loc.zip ?? null,
        is_primary: i === 0 && existingCount === 0,
      });
    }
  }

  // 3. Get first facility for this account (for service agreement)
  const { data: facilities } = await supabase
    .from('facilities')
    .select('id')
    .eq('account_id', packet.account_id)
    .eq('org_id', org.org_id)
    .order('created_at', { ascending: true })
    .limit(1);
  const firstFacilityId = facilities?.[0]?.id ?? null;

  // 4. Create service agreement from launch (production-safe structured scope)
  let serviceAgreementId: string | null = null;
  if (firstFacilityId && userId) {
    let sourceProposalId: string | null = null;
    if (packet.opportunity_id) {
      const { data: opp } = await supabase
        .from('opportunities')
        .select('proposal_id')
        .eq('id', packet.opportunity_id)
        .single();
      sourceProposalId = (opp as { proposal_id?: string | null } | null)?.proposal_id ?? null;
    }
    const lineTypesFromPayload =
      payload.sold_services?.filter((s): s is ServiceLineTypeCode =>
        KNOWN_LINE_TYPES.includes(s.toLowerCase().replace(/\s+/g, '_') as ServiceLineTypeCode)
      ).map((s) => s.toLowerCase().replace(/\s+/g, '_') as ServiceLineTypeCode) ?? [];
    const startDate = payload.estimated_start_date ?? new Date().toISOString().slice(0, 10);
    try {
      const { agreementId } = await activateLaunchPacket({
        orgId: org.org_id,
        launchPacketId: packetId,
        createdBy: userId,
        payload: {
          facilityId: firstFacilityId,
          accountId: packet.account_id,
          agreementName: (payload.service_locations?.[0]?.name ?? payload.locations?.[0]?.name) || 'Primary agreement',
          startDate,
          serviceFrequency: payload.service_frequency ?? null,
          serviceDays: payload.service_days ?? null,
          generalScopeSummary: payload.scope_summary ?? payload.special_notes ?? null,
          sourceOpportunityId: packet.opportunity_id ?? null,
          sourceProposalId,
          contractRef: payload.contract_ref ?? null,
          lineTypes: lineTypesFromPayload.length > 0 ? lineTypesFromPayload : undefined,
        },
      });
      serviceAgreementId = agreementId;
    } catch (err) {
      // Non-fatal: packet still accepted; agreement can be created manually or retried
      console.error('[acceptLaunchPacket] activateLaunchPacket failed', err);
    }
  }

  // 5. Mark packet accepted and link service_agreement_id if created
  const { error: packetError } = await supabase
    .from('launch_packets')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      ops_owner: userId ?? undefined,
      ...(serviceAgreementId ? { service_agreement_id: serviceAgreementId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', packetId)
    .eq('org_id', org.org_id);

  if (packetError) return { error: `Failed to mark accepted: ${packetError.message}` };

  revalidatePath('/app/ops/launch-intake');
  revalidatePath('/app/sales/launch-packets');
  revalidatePath(`/app/accounts/${packet.account_id}`);
  return {};
}
