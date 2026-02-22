'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/** Sales: move packet to ready or sent_to_ops. Only when status is draft or review. */
export async function sendLaunchPacketToOps(packetId: string): Promise<{ error?: string }> {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
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
    .select('id, org_id, account_id, status, payload_jsonb')
    .eq('id', packetId)
    .eq('org_id', org.org_id)
    .single();

  if (!packet) return { error: 'Launch packet not found' };
  if (packet.status !== 'ready' && packet.status !== 'sent_to_ops') {
    return { error: 'Only ready or sent_to_ops packets can be accepted' };
  }

  const payload = (packet.payload_jsonb ?? {}) as {
    locations?: Array<{ name: string; address_line1?: string; city?: string; state?: string; zip?: string }>;
  };

  // 1. Mark account active
  const { error: accountError } = await supabase
    .from('accounts')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', packet.account_id)
    .eq('org_id', org.org_id);

  if (accountError) return { error: `Failed to activate account: ${accountError.message}` };

  // 2. Create facilities from payload if present (account may already have some)
  if (Array.isArray(payload.locations) && payload.locations.length > 0) {
    const existing = await supabase
      .from('facilities')
      .select('id')
      .eq('account_id', packet.account_id)
      .eq('org_id', org.org_id);
    const existingCount = (existing.data ?? []).length;
    for (let i = 0; i < payload.locations.length; i++) {
      const loc = payload.locations[i];
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

  // 3. Mark packet accepted
  const { error: packetError } = await supabase
    .from('launch_packets')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      ops_owner: userId ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', packetId)
    .eq('org_id', org.org_id);

  if (packetError) return { error: `Failed to mark accepted: ${packetError.message}` };

  // TODO: Generate initial Service Schedules from payload.schedule_draft
  // TODO: Create "First Week" Tasks bundle (kickoff checklist)
  // TODO: Schedule first Inspection + QC cadence defaults
  // TODO: Bind SLA policies to Account/Locations
  // TODO: Audit log entry + notifications to ops_owner + sales_owner

  revalidatePath('/app/ops/launch-intake');
  revalidatePath('/app/sales/launch-packets');
  revalidatePath(`/app/accounts/${packet.account_id}`);
  return {};
}
