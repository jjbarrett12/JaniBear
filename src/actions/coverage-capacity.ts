'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getCurrentUserId } from '@/lib/auth';

export async function upsertSalesCapacitySettings(
  orgId: string,
  settings: {
    enabled?: boolean;
    max_new_leads_per_rep?: number;
    max_working_leads_per_rep?: number;
    overflow_strategy?: 'next_rep' | 'overflow_rep' | 'unassigned_queue';
    overflow_rep_user_id?: string | null;
  }
) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('sales_capacity_settings').upsert(
    {
      org_id: orgId,
      enabled: settings.enabled ?? true,
      max_new_leads_per_rep: settings.max_new_leads_per_rep ?? 80,
      max_working_leads_per_rep: settings.max_working_leads_per_rep ?? 200,
      overflow_strategy: settings.overflow_strategy ?? 'next_rep',
      overflow_rep_user_id: settings.overflow_rep_user_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'org_id' }
  );
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}

export async function upsertRepCapacityOverride(
  orgId: string,
  userId: string,
  overrides: { max_new_leads?: number | null; max_working_leads?: number | null }
) {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId: currentUserId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('rep_capacity_overrides').upsert(
    {
      org_id: orgId,
      user_id: userId,
      max_new_leads: overrides.max_new_leads ?? null,
      max_working_leads: overrides.max_working_leads ?? null,
      active: true,
    },
    { onConflict: 'org_id,user_id' }
  );
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}
