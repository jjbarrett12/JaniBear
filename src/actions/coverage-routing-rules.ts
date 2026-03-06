'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getCurrentUserId } from '@/lib/auth';

export interface SalesRoutingRuleForm {
  name: string;
  priority: number;
  territory_id?: string | null;
  coverage_area_id?: string | null;
  vertical_id?: string | null;
  assignee_user_id?: string | null;
  assignment_method: 'primary' | 'round_robin' | 'weighted' | 'manual';
  reason?: string | null;
}

export async function createSalesRoutingRule(orgId: string, form: SalesRoutingRuleForm) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('sales_routing_rules').insert({
    org_id: orgId,
    name: form.name.trim(),
    priority: form.priority,
    territory_id: form.territory_id || null,
    coverage_area_id: form.coverage_area_id || null,
    vertical_id: form.vertical_id || null,
    assignee_user_id: form.assignee_user_id || null,
    assignment_method: form.assignment_method,
    reason: form.reason?.trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}

export async function updateSalesRoutingRule(orgId: string, id: string, form: SalesRoutingRuleForm & { active?: boolean }) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('sales_routing_rules').update({
    name: form.name.trim(),
    priority: form.priority,
    territory_id: form.territory_id || null,
    coverage_area_id: form.coverage_area_id || null,
    vertical_id: form.vertical_id || null,
    assignee_user_id: form.assignee_user_id || null,
    assignment_method: form.assignment_method,
    reason: form.reason?.trim() || null,
    active: form.active ?? true,
  }).eq('id', id).eq('org_id', orgId);
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}

export async function deleteSalesRoutingRule(orgId: string, id: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { error: 'Unauthorized' };
  await requirePermission({ orgId, userId, permission: 'coverage.admin' });
  const supabase = await createClient();
  const { error } = await supabase.from('sales_routing_rules').delete().eq('id', id).eq('org_id', orgId);
  if (error) return { error: error.message };
  revalidatePath('/app/admin/coverage');
  return { error: null };
}
