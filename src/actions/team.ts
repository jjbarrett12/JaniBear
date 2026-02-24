'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { getActiveOrgIdFromCookie } from '@/lib/user-context';
import { checkSeatLimit } from '@/lib/org-limits';
import { revalidatePath } from 'next/cache';
import { ASSIGNABLE_ROLES, type AssignableRole } from '@/lib/team-roles';

/** Update an org member's role. Caller must be owner/admin/manager; cannot change an owner's role. */
export async function updateMemberRole(
  membershipId: string,
  newRole: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const orgId = await getActiveOrgIdFromCookie();
  if (!userId || !orgId) return { error: 'Unauthorized' };

  const { data: caller } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();
  if (!caller || !['owner', 'admin', 'manager'].includes(caller.role))
    return { error: 'Forbidden' };

  if (!ASSIGNABLE_ROLES.includes(newRole as AssignableRole))
    return { error: 'Invalid role' };

  const { data: target } = await supabase
    .from('org_members')
    .select('id, org_id, role')
    .eq('id', membershipId)
    .single();
  if (!target || target.org_id !== orgId) return { error: 'Membership not found' };
  if (target.role === 'owner') return { error: 'Cannot change owner role' };

  const { error } = await supabase
    .from('org_members')
    .update({ role: newRole })
    .eq('id', membershipId);
  if (error) return { error: error.message };
  revalidatePath('/app/settings/team');
  return {};
}

/** Create an org invite; returns the join URL. Checks seat limit at creation time. */
export async function createOrgInvite(
  email: string,
  role: string
): Promise<{ inviteLink?: string; error?: string }> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  const orgId = await getActiveOrgIdFromCookie();
  if (!userId || !orgId) return { error: 'Unauthorized' };

  const { data: caller } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single();
  if (!caller || !['owner', 'admin', 'manager'].includes(caller.role))
    return { error: 'Forbidden' };

  if (!ASSIGNABLE_ROLES.includes(role as AssignableRole))
    return { error: 'Invalid role' };

  const seatCheck = await checkSeatLimit(orgId);
  if (!seatCheck.allowed)
    return { error: seatCheck.message ?? 'Seat limit reached' };

  const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { error: insertErr } = await supabase.from('org_invites').insert({
    org_id: orgId,
    email: email.trim().toLowerCase(),
    role,
    token,
    expires_at: expiresAt.toISOString(),
    created_by: userId,
  });
  if (insertErr) return { error: insertErr.message };

  const base = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const inviteLink = `${base.replace(/\/$/, '')}/app/join-org?token=${encodeURIComponent(token)}`;
  revalidatePath('/app/settings/team');
  return { inviteLink };
}

/** Accept an org invite by token. User must be signed in. */
export async function acceptOrgInvite(token: string): Promise<{ error?: string; orgId?: string }> {
  const supabase = await createClient();
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'You must be signed in to accept this invite.' };

  const { data, error } = await supabase.rpc('accept_org_invite', { p_token: token });
  if (error) return { error: error.message };
  const result = data as { ok?: boolean; error?: string; org_id?: string } | null;
  if (!result || !result.ok) return { error: result?.error ?? 'Invalid or expired invite.' };

  revalidatePath('/app/settings/team');
  revalidatePath('/app/dashboard');
  return { orgId: result.org_id };
}
