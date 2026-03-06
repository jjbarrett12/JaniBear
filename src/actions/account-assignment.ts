'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';

/**
 * Set recommended operator on account and log assignment event.
 * When assignedBySystem is true, also set assigned_by_system on account.
 */
export async function assignRecommendedOperator(
  orgId: string,
  accountId: string,
  operatorType: 'crew' | 'franchisee',
  operatorId: string,
  assignedBySystem: boolean
): Promise<{ error: string | null }> {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'accounts.write' });

  const supabase = await createClient();
  const { error: updateErr } = await supabase
    .from('accounts')
    .update({
      recommended_operator_type: operatorType,
      recommended_operator_id: operatorId,
      assigned_by_system: assignedBySystem,
      updated_at: new Date().toISOString(),
    })
    .eq('id', accountId)
    .eq('org_id', orgId);
  if (updateErr) return { error: updateErr.message };

  await supabase.from('account_assignment_events').insert({
    org_id: orgId,
    account_id: accountId,
    action: 'assigned',
    operator_type: operatorType,
    operator_id: operatorId,
    assigned_by_system: assignedBySystem,
    assigned_by_user_id: assignedBySystem ? null : userId,
    meta: {},
  });
  revalidatePath(`/app/accounts/${accountId}`);
  revalidatePath('/app/accounts');
  return { error: null };
}
