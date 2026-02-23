import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import { createClient } from '@/lib/supabase/server';
import { AiControlCenterPage } from '@/components/ai/AiControlCenterPage';
import type { AiOrgConfigRow, AiModuleStateRow, AiAutomationRuleRow } from '@/app/app/settings/ai/types';

const ADMIN_ROLES = ['owner', 'admin'];

export default async function AiSettingsPage() {
  const org = await requireOrg();
  const orgId = org.org_id;

  const { context } = await getUserContext();
  const role = (context.role ?? context.effectiveRole ?? '').toLowerCase();
  const canManage = ADMIN_ROLES.includes(role) || context.capabilities['ai_settings.manage'];
  if (!canManage) redirect('/app/settings');

  const supabase = await createClient();
  const period = new Date().toISOString().slice(0, 7);

  const [configRes, modulesRes, rulesRes, usageRes] = await Promise.all([
    supabase.from('ai_org_config').select('*').eq('org_id', orgId).maybeSingle(),
    supabase.from('ai_module_state').select('*').eq('org_id', orgId).order('module_key'),
    supabase.from('ai_automation_rules').select('*').eq('org_id', orgId).order('created_at', { ascending: false }),
    supabase
      .from('ai_usage')
      .select('tokens_input, tokens_output, estimated_cost_cents')
      .eq('org_id', orgId)
      .eq('period', period)
      .is('usage_date', null)
      .maybeSingle(),
  ]);

  const config = configRes.data as AiOrgConfigRow | null;
  const modules = (modulesRes.data ?? []) as AiModuleStateRow[];
  const rules = (rulesRes.data ?? []) as AiAutomationRuleRow[];
  const usageRow = usageRes.data as { tokens_input?: number; tokens_output?: number; estimated_cost_cents?: number } | null;
  const tokensUsed = (usageRow?.tokens_input ?? 0) + (usageRow?.tokens_output ?? 0);
  const costCents = usageRow?.estimated_cost_cents ?? 0;
  const budgetCents = config?.budget_limit_cents ?? null;

  return (
    <AiControlCenterPage
      orgId={orgId}
      initialConfig={config}
      initialModules={modules}
      initialRules={rules}
      initialUsage={{
        period,
        tokensUsed,
        costCents,
        budgetCents,
      }}
    />
  );
}
