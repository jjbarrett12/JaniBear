import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './auth';

/**
 * User can access Member Pro Gear if:
 * - Authenticated
 * - profiles.is_paid_member === true OR user is org admin (owner/admin/manager)
 */
export async function requireProGearAccess() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_paid_member')
    .eq('id', user.id)
    .single();

  if (profile?.is_paid_member === true) {
    return { user, isAdmin: false };
  }

  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id);

  const isAdmin = memberships?.some((m) =>
    ['owner', 'admin', 'manager'].includes(m.role)
  );
  if (isAdmin) {
    return { user, isAdmin: true };
  }

  redirect('/app/dashboard?pro_gear=members_only');
}

/**
 * Whether the current user can access Pro Gear admin (product list, import, inquiries).
 */
export async function isProGearAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabase = await createClient();
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', user.id)
    .in('role', ['owner', 'admin', 'manager'])
    .limit(1)
    .maybeSingle();

  return !!data;
}
