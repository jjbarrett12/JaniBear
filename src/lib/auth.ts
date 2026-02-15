import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getActiveOrgIdFromCookie } from './user-context';

const ACTIVE_ORG_COOKIE = 'active_org_id';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function getCurrentUser() {
  const supabase = await createClient();
  
  // Try getSession first (reads from cookies, faster)
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    return session.user;
  }
  
  // Fallback to getUser (makes API call to validate)
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
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
      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_ORG_COOKIE, firstMembership.org_id, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
      });
      org = firstMembership;
    }
  }
  if (!org) {
    redirect('/onboarding');
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
