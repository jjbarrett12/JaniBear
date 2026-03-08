import Link from 'next/link';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { headers } from 'next/headers';
import { getSettingsPermissions } from '@/lib/auth/permission-helpers';
import { createClient } from '@/lib/supabase/server';
import { AiControlCenterPage } from '@/components/ai/AiControlCenterPage';
import type { AiOrgConfigRow, AiModuleStateRow, AiAutomationRuleRow } from '@/app/app/settings/ai/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export default async function AiSettingsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const pathname = (await headers()).get('x-pathname') ?? '/app/settings/ai';
  const permissions = await getSettingsPermissions(org.org_id, userId, pathname);
  const canManageAi = permissions['settings.ai'] ?? permissions['settings.org.edit'] ?? false;

  if (!canManageAi) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground">You don&apos;t have access to this section</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              AI Control Center is restricted. Ask an owner or admin to grant you access.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link href="/app/settings">Back to Settings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orgId = org.org_id;
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
