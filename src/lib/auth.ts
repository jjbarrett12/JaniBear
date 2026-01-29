import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';

export async function getCurrentUser() {
  const supabase = await createClient();
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
  
  // Get user's first org membership
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role, organizations(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single();
  
  return membership;
}

export async function requireOrg() {
  const org = await getCurrentOrg();
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
