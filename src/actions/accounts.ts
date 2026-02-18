'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export type CreateAccountWithFacilitiesPayload = {
  account_name: string;
  status?: 'active' | 'inactive';
  billing_contact_name?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_terms?: string | null;
  notes?: string | null;
  /** Optional: invite this email as the first account admin (creates an invite link). */
  first_admin_email?: string | null;
  facilities: {
    name: string;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    timezone?: string | null;
    access_notes?: string | null;
    service_notes?: string | null;
    is_primary?: boolean;
  }[];
};

export type BuildingForBatch = {
  name: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  access_notes?: string | null;
  service_notes?: string | null;
};

/** Create one account and multiple facilities (first facility primary unless specified). */
export async function createAccountWithFacilities(
  payload: CreateAccountWithFacilitiesPayload
): Promise<{ accountId: string; facilityIds: string[]; inviteLink?: string; error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  if (!payload.account_name?.trim()) {
    return { accountId: '', facilityIds: [], error: 'Account name is required' };
  }
  if (!payload.facilities?.length) {
    return { accountId: '', facilityIds: [], error: 'At least one facility is required' };
  }

  const { data: account, error: accError } = await supabase
    .from('accounts')
    .insert({
      org_id: org.org_id,
      name: payload.account_name.trim(),
      status: payload.status ?? 'active',
      billing_contact_name: payload.billing_contact_name ?? null,
      billing_email: payload.billing_email ?? null,
      billing_phone: payload.billing_phone ?? null,
      billing_terms: payload.billing_terms ?? null,
      notes: payload.notes ?? null,
    })
    .select('id')
    .single();

  if (accError || !account) {
    return { accountId: '', facilityIds: [], error: accError?.message ?? 'Failed to create account' };
  }

  const facilitiesToInsert = payload.facilities.map((f, i) => ({
    org_id: org.org_id,
    account_id: account.id,
    name: f.name.trim(),
    address_line1: f.address_line1 ?? null,
    address_line2: f.address_line2 ?? null,
    city: f.city ?? null,
    state: f.state ?? null,
    zip: f.zip ?? null,
    timezone: f.timezone ?? null,
    access_notes: f.access_notes ?? null,
    service_notes: f.service_notes ?? null,
    is_primary: f.is_primary ?? i === 0,
  }));

  const { data: facilities, error: facError } = await supabase
    .from('facilities')
    .insert(facilitiesToInsert)
    .select('id');

  if (facError || !facilities?.length) {
    await supabase.from('accounts').delete().eq('id', account.id);
    return { accountId: account.id, facilityIds: [], error: facError?.message ?? 'Failed to create facilities' };
  }

  let inviteLink: string | undefined;
  if (payload.first_admin_email?.trim()) {
    const { inviteAccountUserByEmail } = await import('@/actions/account-users');
    const result = await inviteAccountUserByEmail(account.id, payload.first_admin_email.trim(), 'admin');
    inviteLink = result.inviteLink;
  }

  revalidatePath('/app/accounts');
  revalidatePath(`/app/accounts/${account.id}`);
  return { accountId: account.id, facilityIds: facilities.map((f) => f.id), inviteLink };
}

/** Create one account per building (building = account). */
export async function createBuildingAsAccountBatch(
  buildings: BuildingForBatch[],
  companyName?: string
): Promise<{ created: number; accountIds: string[]; error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();
  const accountIds: string[] = [];

  for (const b of buildings) {
    if (!b.name?.trim()) continue;
    const accountName = companyName?.trim() ? `${companyName} - ${b.name.trim()}` : b.name.trim();
    const { accountId } = await createAccountWithFacilities({
      account_name: accountName,
      status: 'active',
      facilities: [
        {
          name: b.name.trim(),
          address_line1: b.address_line1 ?? null,
          address_line2: b.address_line2 ?? null,
          city: b.city ?? null,
          state: b.state ?? null,
          zip: b.zip ?? null,
          access_notes: b.access_notes ?? null,
          service_notes: b.service_notes ?? null,
          is_primary: true,
        },
      ],
    });
    if (accountId) accountIds.push(accountId);
  }

  revalidatePath('/app/accounts');
  return { created: accountIds.length, accountIds };
}

/** Set a facility as the primary for its account (clears primary on others). */
export async function setPrimaryFacility(
  accountId: string,
  facilityId: string
): Promise<{ error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { error: clearError } = await supabase
    .from('facilities')
    .update({ is_primary: false })
    .eq('account_id', accountId)
    .eq('org_id', org.org_id);

  if (clearError) return { error: clearError.message };

  const { error: setError } = await supabase
    .from('facilities')
    .update({ is_primary: true })
    .eq('id', facilityId)
    .eq('account_id', accountId)
    .eq('org_id', org.org_id);

  if (setError) return { error: setError.message };

  revalidatePath('/app/accounts');
  revalidatePath(`/app/accounts/${accountId}`);
  return {};
}
