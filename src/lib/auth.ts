import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getActiveOrgIdFromCookie } from './user-context';

const MIDDLEWARE_USER_ID_HEADER = 'x-middleware-user-id';

const AUTH_DEBUG = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_AUTH_DEBUG === '1';
const GUARD_DEBUG = process.env.NODE_ENV === 'development' && (process.env.NEXT_PUBLIC_AUTH_DEBUG === '1' || process.env.NEXT_PUBLIC_GUARD_DEBUG === '1');

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

/** Get org membership for a user id (used when layout trusts middleware via header). */
export async function getOrgForUserId(userId: string) {
  const supabase = await createClient();
  const activeOrgId = await getActiveOrgIdFromCookie();
  if (activeOrgId) {
    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(*)')
      .eq('user_id', userId)
      .eq('org_id', activeOrgId)
      .maybeSingle();
    if (membership) return membership;
  }
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return membership;
}

export async function getCurrentOrg() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  
  if (!user) return null;

  return getOrgForUserId(user.id);
}

/**
 * Returns current user's org membership and org details (includes org_type for JANIBEAR OS gating).
 * Shape: { org_id, role, organizations: { name, org_type: 'franchisor' | 'franchisee' | 'independent', ... } }
 * Only redirects to /onboarding when the user has zero org memberships (initial signup). Once they have an org, always dashboard.
 */
export async function requireOrg() {
  const headersList = await headers();
  const middlewareUserId = headersList.get(MIDDLEWARE_USER_ID_HEADER);
  if (middlewareUserId) {
    const org = await getOrgForUserId(middlewareUserId);
    if (org) {
      if (GUARD_DEBUG) console.log('[GUARD] requireOrg path=layout session=true org_id=' + org.org_id + ' reason=header+getOrgForUserId');
      return org;
    }
    // Fallback: resolve first membership by userId so layout works when cookie not yet on request (e.g. first load of /app/financial-health).
    const supabase = await createClient();
    const { data: firstByUserId } = await supabase
      .from('org_members')
      .select('org_id, role, organizations(*)')
      .eq('user_id', middlewareUserId)
      .limit(1)
      .maybeSingle();
    if (firstByUserId) {
      if (GUARD_DEBUG) console.log('[GUARD] requireOrg path=layout session=true org_id=' + firstByUserId.org_id + ' reason=header+firstMembership fallback');
      return firstByUserId;
    }
  }

  const user = await getCurrentUser();
  if (!user) {
    if (GUARD_DEBUG) console.log('[GUARD] requireOrg path=layout session=false org_id=null reason=no user redirect=login');
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
    if (GUARD_DEBUG) console.log('[GUARD] requireOrg path=layout session=true org_id=null onboarded=false reason=no org redirect=landing');
    redirect('/api/auth/landing');
  }
  if (GUARD_DEBUG) console.log('[GUARD] requireOrg path=layout session=true org_id=' + org.org_id + ' reason=currentUser+getCurrentOrg');
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
