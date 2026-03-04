import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

/**
 * Resolve whether a user is a platform admin. Uses RPC is_platform_admin (platform_admins table when 051 applied),
 * with fallback to profiles.is_platform_admin for pre-051 or when RPC fails.
 * Only whitelisted platform admins can access /platform/*; signup does not grant this.
 */
export async function getIsPlatformAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('is_platform_admin', { p_user_id: userId });
  if (!error && data === true) return true;
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', userId)
    .maybeSingle();
  return (profile as { is_platform_admin?: boolean } | null)?.is_platform_admin === true;
}

/**
 * Check if the current user is a platform admin.
 */
export async function isPlatformAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return getIsPlatformAdmin(user.id);
}

/**
 * Require platform admin. Use in /platform/* layout or pages.
 * Redirects to /auth/login if not authenticated, /platform/forbidden if not platform admin.
 */
export async function requirePlatformAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const ok = await getIsPlatformAdmin(user.id);
  if (!ok) redirect('/platform/forbidden');

  return { user };
}
