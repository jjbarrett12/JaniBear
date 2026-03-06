'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getCurrentUserId } from '@/lib/auth';

export async function createVertical(orgId: string, key: string, label: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('verticals').insert({ org_id: orgId, key: key.trim(), label: label.trim() });
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}

export async function updateVertical(orgId: string, id: string, key: string, label: string, active: boolean) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('verticals').update({ key: key.trim(), label: label.trim(), active }).eq('id', id).eq('org_id', orgId);
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}

export async function deleteVertical(orgId: string, id: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('verticals').delete().eq('id', id).eq('org_id', orgId);
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}
