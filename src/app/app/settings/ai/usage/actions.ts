'use server';

import { createClient } from '@/lib/supabase/server';
import { getUserContext } from '@/lib/user-context';
import type { AiUsageRow } from '../types';

export async function getAiUsageMonth(orgId: string, period: string): Promise<{ tokensUsed: number; costCents: number; budgetCents: number | null }> {
  const { context } = await getUserContext();
  if (!context.activeOrgId || context.activeOrgId !== orgId) {
    return { tokensUsed: 0, costCents: 0, budgetCents: null };
  }
  const supabase = await createClient();
  const { data: monthRow } = await supabase
    .from('ai_usage')
    .select('tokens_input, tokens_output, estimated_cost_cents')
    .eq('org_id', orgId)
    .eq('period', period)
    .is('usage_date', null)
    .maybeSingle();
  const { data: config } = await supabase
    .from('ai_org_config')
    .select('budget_limit_cents')
    .eq('org_id', orgId)
    .maybeSingle();
  const tokensUsed = (monthRow?.tokens_input ?? 0) + (monthRow?.tokens_output ?? 0);
  const costCents = monthRow?.estimated_cost_cents ?? 0;
  const budgetCents = config?.budget_limit_cents ?? null;
  return { tokensUsed, costCents, budgetCents };
}

export async function listAiUsageDaily(orgId: string, period: string): Promise<AiUsageRow[]> {
  const { context } = await getUserContext();
  if (!context.activeOrgId || context.activeOrgId !== orgId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('ai_usage')
    .select('*')
    .eq('org_id', orgId)
    .eq('period', period)
    .not('usage_date', 'is', null)
    .order('usage_date', { ascending: false });
  return (data ?? []) as AiUsageRow[];
}
