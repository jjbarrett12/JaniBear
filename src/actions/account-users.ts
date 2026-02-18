'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { randomBytes } from 'crypto';

export type AccountUserRow = {
  id: string;
  account_id: string;
  user_id: string;
  role: 'admin' | 'member';
  status: 'invited' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  profiles: { full_name: string | null } | null;
};

export type AccountUserLimitResult = {
  allowed: boolean;
  current: number;
  limit: number;
  message?: string;
};

/** Check if the account can add another user (under user_limit). */
export async function checkAccountUserLimit(accountId: string): Promise<AccountUserLimitResult> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, user_limit, org_id')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();

  if (!account) {
    return { allowed: false, current: 0, limit: 0, message: 'Account not found' };
  }

  const limit = Number(account.user_limit) || 5;
  const { count } = await supabase
    .from('account_users')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('status', 'active');

  const current = count ?? 0;
  if (current >= limit) {
    return {
      allowed: false,
      current,
      limit,
      message: `User limit reached (${current}/${limit}). Increase the account plan to add more users.`,
    };
  }
  return { allowed: true, current, limit };
}

/** List users for an account (with profile names). */
export async function listAccountUsers(accountId: string): Promise<{
  users: AccountUserRow[];
  limit: number;
  current: number;
  error?: string;
}> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, user_limit, org_id')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();

  if (!account) {
    return { users: [], limit: 0, current: 0, error: 'Account not found' };
  }

  const { data: users, error } = await supabase
    .from('account_users')
    .select('id, account_id, user_id, role, status, created_at, updated_at, profiles(full_name)')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) return { users: [], limit: Number(account.user_limit) || 5, current: 0, error: error.message };

  const activeCount = (users ?? []).filter((u) => u.status === 'active').length;
  return {
    users: (users ?? []) as AccountUserRow[],
    limit: Number(account.user_limit) || 5,
    current: activeCount,
  };
}

/** Add an existing user (by user_id) to the account. Fails if at user_limit. */
export async function addUserToAccount(
  accountId: string,
  userId: string,
  role: 'admin' | 'member' = 'admin'
): Promise<{ error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const limitResult = await checkAccountUserLimit(accountId);
  if (!limitResult.allowed) return { error: limitResult.message };

  const { error } = await supabase.from('account_users').insert({
    account_id: accountId,
    user_id: userId,
    role,
    status: 'active',
  });

  if (error) {
    if (error.code === '23505') return { error: 'This user is already on the account.' };
    return { error: error.message };
  }

  revalidatePath('/app/accounts');
  revalidatePath(`/app/accounts/${accountId}`);
  return {};
}

/** Remove a user from an account. */
export async function removeUserFromAccount(accountId: string, userId: string): Promise<{ error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { error } = await supabase
    .from('account_users')
    .delete()
    .eq('account_id', accountId)
    .eq('user_id', userId);

  if (error) return { error: error.message };
  revalidatePath('/app/accounts');
  revalidatePath(`/app/accounts/${accountId}`);
  return {};
}

/** List org members (for dropdown) that are not already account users. */
export async function listOrgMembersNotOnAccount(accountId: string): Promise<
  { id: string; full_name: string | null }[] | { error: string }
> {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, org_id')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();
  if (!account) return { error: 'Account not found' };

  const { data: existing } = await supabase
    .from('account_users')
    .select('user_id')
    .eq('account_id', accountId);
  const existingIds = new Set((existing ?? []).map((r) => r.user_id));

  const { data: members } = await supabase
    .from('org_members')
    .select('user_id, profiles(full_name)')
    .eq('org_id', org.org_id)
    .or('status.eq.active,status.is.null');

  if (!members) return [];
  const list = members
    .filter((m) => !existingIds.has(m.user_id))
    .map((m) => ({
      id: m.user_id,
      full_name: (m.profiles as { full_name: string | null } | null)?.full_name ?? null,
    }));
  return list;
}

/** Create an invite for an email. Returns the invite link (path + token). */
export async function inviteAccountUserByEmail(
  accountId: string,
  email: string,
  role: 'admin' | 'member' = 'admin'
): Promise<{ inviteLink?: string; error?: string }> {
  const org = await requireOrg();
  const supabase = await createClient();

  const limitResult = await checkAccountUserLimit(accountId);
  if (!limitResult.allowed) return { error: limitResult.message };

  const { data: account } = await supabase
    .from('accounts')
    .select('id, org_id')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();
  if (!account) return { error: 'Account not found' };

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const createdBy = await (await import('@/lib/auth')).getCurrentUserId();

  const { error } = await supabase.from('account_invites').insert({
    account_id: accountId,
    email: email.trim().toLowerCase(),
    role,
    token,
    expires_at: expiresAt.toISOString(),
    created_by: createdBy ?? undefined,
  });

  if (error) return { error: error.message };

  const invitePath = `/app/accounts/join?token=${token}`;
  revalidatePath('/app/accounts');
  revalidatePath(`/app/accounts/${accountId}`);
  return { inviteLink: invitePath };
}

/** Accept an account invite by token. Call when user is logged in; adds them to org (if needed) and account_users. */
export async function acceptAccountInvite(token: string): Promise<{ accountId?: string; error?: string }> {
  const supabase = await createClient();
  const userId = await (await import('@/lib/auth')).getCurrentUserId();
  if (!userId) return { error: 'You must be signed in to accept this invite.' };

  const { data, error } = await supabase.rpc('accept_account_invite', { p_token: token });

  if (error) return { error: error.message };
  const result = data as { ok?: boolean; error?: string; account_id?: string } | null;
  if (!result || !result.ok) return { error: result?.error ?? 'Invalid or expired invite.' };

  revalidatePath('/app/accounts');
  if (result.account_id) revalidatePath(`/app/accounts/${result.account_id}`);
  return { accountId: result.account_id };
}
