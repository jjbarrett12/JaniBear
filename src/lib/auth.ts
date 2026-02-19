import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';
import { getActiveOrgIdFromCookie } from './user-context';

const AUTH_DEBUG = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_AUTH_DEBUG === '1';

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (user) return user;
  // Fallback: on client-side nav the RSC request can have cookies but getUser() may fail (validation/network).
  // Use getSession() so we don't kick to login when the session exists in the cookie.
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) return session.user;
  if (process.env.NODE_ENV === 'development' && (error || !session?.user)) {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const authNames = store.getAll().map((c) => c.name).filter((n) => n.startsWith('sb-'));
    console.log('[REDIRECT] [B] getCurrentUser null in layout', { error: error?.message ?? null, authCookieCount: authNames.length });
  }
  if (AUTH_DEBUG) {
    const { cookies } = await import('next/headers');
    const store = await cookies();
    const authNames = store.getAll().map((c) => c.name).filter((n) => n.startsWith('sb-'));
    console.log('[auth getCurrentUser]', { error: error?.message ?? null, authCookieCount: authNames.length, authCookies: authNames });
  }
  return null;
}

/** Returns current user id or null. Use in admin/role checks to avoid duplicate getUser() and undefined. */
export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    if (process.env.NODE_ENV === 'development') console.log('[REDIRECT] origin=layout (requireAuth)');
    redirect('/auth/login');
  }
  return user;
}

export async function getCurrentOrg() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  
  if (!user) return null;

  const activeOrgId = await getActiveOrgIdFromCookie();
  if (activeOrgId) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(*)')
      .eq('user_id', user.id)
      .eq('org_id', activeOrgId)
      .maybeSingle();
    if (membership) return membership;
  }

  // Fallback: first org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  
  return membership;
}

/**
 * Returns current user's org membership and org details (includes org_type for JANIBEAR OS gating).
 * Shape: { org_id, role, organizations: { name, org_type: 'franchisor' | 'franchisee' | 'independent', ... } }
 * Only redirects to /onboarding when the user has zero org memberships (initial signup). Once they have an org, always dashboard.
 */
export async function requireOrg() {
  const user = await getCurrentUser();
  if (!user) {
    if (process.env.NODE_ENV === 'development') console.log('[REDIRECT] origin=layout (requireOrg getCurrentUser null)');
    redirect('/auth/login');
  }

  let org = await getCurrentOrg();
  if (!org) {
    const supabase = await createClient();
    const { data: firstMembership } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(*)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    if (firstMembership) {
      org = firstMembership;
    }
  }
  if (!org) {
    redirect('/api/auth/landing');
  }
  return org;
}

export async function canWriteOrg(orgId: string) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  
  if (!user) return false;
  
  const { data } = await supabase
    .from('org_members')
    .select('role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single();
  
  return data?.role === 'owner' || data?.role === 'manager' || data?.role === 'inspector';
}
