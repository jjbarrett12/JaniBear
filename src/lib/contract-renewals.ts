/**
 * Contract renewal service: tracks expiration dates, sends reminder
 * notifications at 90/60/30 days, and manages the renewal pipeline.
 */
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createNotification } from '@/lib/activity-logger';
import { sendEmail } from '@/lib/email';
import type { ContractRenewal, RenewalPipelineSummary } from '@/types/features';

export async function getRenewals(orgId: string, filters?: {
  status?: string;
  assigned_to?: string;
}): Promise<ContractRenewal[]> {
  const supabase = await createClient();
  let query = supabase
    .from('contract_renewals')
    .select('*, accounts(name), profiles:assigned_to(full_name)')
    .eq('org_id', orgId)
    .order('expires_at', { ascending: true });

  if (filters?.status) query = query.eq('renewal_status', filters.status);
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ContractRenewal[];
}

export async function createRenewal(
  orgId: string,
  renewal: Partial<ContractRenewal>
): Promise<ContractRenewal> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('contract_renewals')
    .insert({
      org_id: orgId,
      account_id: renewal.account_id,
      contract_id: renewal.contract_id,
      contract_name: renewal.contract_name,
      current_mrr: renewal.current_mrr,
      expires_at: renewal.expires_at,
      assigned_to: renewal.assigned_to,
      auto_renew: renewal.auto_renew ?? false,
      notes: renewal.notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ContractRenewal;
}

export const RENEWAL_STATUS_VALUES = [
  'upcoming',
  'notified_90d',
  'notified_60d',
  'notified_30d',
  'proposal_sent',
  'negotiating',
  'renewed',
  'lost',
  'expired',
] as const;

export type RenewalStatusValue = (typeof RENEWAL_STATUS_VALUES)[number];

export function isAllowedRenewalStatus(value: string): value is RenewalStatusValue {
  return RENEWAL_STATUS_VALUES.includes(value as RenewalStatusValue);
}

export async function updateRenewalStatus(
  id: string,
  orgId: string,
  status: string,
  extras?: Partial<ContractRenewal>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('contract_renewals')
    .update({
      renewal_status: status,
      ...extras,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('org_id', orgId);
  if (error) throw error;
}

/**
 * Cron: scan all upcoming renewals and send notifications at 90/60/30 day marks.
 * Moves renewal_status forward as notifications are sent.
 */
export async function processRenewalReminders(): Promise<{ notified: number }> {
  const supabase = createAdminClient();
  const now = new Date();

  const windows = [
    { days: 90, from_status: 'upcoming', to_status: 'notified_90d' },
    { days: 60, from_status: 'notified_90d', to_status: 'notified_60d' },
    { days: 30, from_status: 'notified_60d', to_status: 'notified_30d' },
  ];

  let notified = 0;

  for (const window of windows) {
    const cutoff = new Date(now.getTime() + window.days * 86400000).toISOString().slice(0, 10);

    const { data: renewals } = await supabase
      .from('contract_renewals')
      .select('*, accounts(name, billing_email, billing_contact_name)')
      .eq('renewal_status', window.from_status)
      .lte('expires_at', cutoff);

    for (const renewal of renewals ?? []) {
      const acct = renewal.accounts as {
        name: string;
        billing_email?: string;
        billing_contact_name?: string;
      } | null;

      if (renewal.assigned_to) {
        await createNotification({
          orgId: renewal.org_id,
          userId: renewal.assigned_to,
          type: 'system',
          title: `Contract expiring in ${window.days} days`,
          message: `${acct?.name ?? 'Account'} contract expires on ${renewal.expires_at}. Current MRR: $${renewal.current_mrr?.toFixed(2) ?? '0'}`,
          link: `/app/contracts`,
        });
      }

      if (acct?.billing_email && window.days === 30) {
        await sendEmail({
          to: acct.billing_email,
          subject: `Your service contract is expiring soon`,
          html: `
            <p>Hi ${acct.billing_contact_name || 'there'},</p>
            <p>Your service contract with us expires on <strong>${renewal.expires_at}</strong>.</p>
            <p>We'd love to continue serving you. Your account representative will be reaching out to discuss renewal options.</p>
            <p>Thank you for being a valued client!</p>
          `,
        });
      }

      await supabase
        .from('contract_renewals')
        .update({ renewal_status: window.to_status, updated_at: now.toISOString() })
        .eq('id', renewal.id);

      notified++;
    }
  }

  // Mark expired contracts
  const { data: expired } = await supabase
    .from('contract_renewals')
    .select('id')
    .in('renewal_status', ['upcoming', 'notified_90d', 'notified_60d', 'notified_30d'])
    .lt('expires_at', now.toISOString().slice(0, 10));

  for (const r of expired ?? []) {
    await supabase
      .from('contract_renewals')
      .update({ renewal_status: 'expired', updated_at: now.toISOString() })
      .eq('id', r.id);
  }

  return { notified };
}

export async function getRenewalPipeline(orgId: string): Promise<RenewalPipelineSummary> {
  const supabase = await createClient();
  const now = new Date();
  const d30 = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const d60 = new Date(now.getTime() + 60 * 86400000).toISOString().slice(0, 10);
  const d90 = new Date(now.getTime() + 90 * 86400000).toISOString().slice(0, 10);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { data: all } = await supabase
    .from('contract_renewals')
    .select('id, expires_at, renewal_status, current_mrr, renewed_at')
    .eq('org_id', orgId);

  const renewals = all ?? [];
  const active = renewals.filter((r) => !['renewed', 'lost', 'expired'].includes(r.renewal_status));

  const exp30 = active.filter((r) => r.expires_at <= d30).length;
  const exp60 = active.filter((r) => r.expires_at > d30 && r.expires_at <= d60).length;
  const exp90 = active.filter((r) => r.expires_at > d60 && r.expires_at <= d90).length;
  const mrrAtRisk = active.reduce((sum, r) => sum + (r.current_mrr ?? 0), 0);

  const renewedMtd = renewals.filter(
    (r) => r.renewal_status === 'renewed' && r.renewed_at && r.renewed_at >= monthStart
  ).length;
  const lostMtd = renewals.filter(
    (r) => r.renewal_status === 'lost'
  ).length;

  const totalDecided = renewals.filter((r) => ['renewed', 'lost'].includes(r.renewal_status)).length;
  const totalRenewed = renewals.filter((r) => r.renewal_status === 'renewed').length;
  const renewalRate = totalDecided > 0 ? totalRenewed / totalDecided : null;

  return {
    expiring_30d: exp30,
    expiring_60d: exp60,
    expiring_90d: exp90,
    total_mrr_at_risk: mrrAtRisk,
    renewed_mtd: renewedMtd,
    lost_mtd: lostMtd,
    renewal_rate_ytd: renewalRate,
  };
}
