import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/server';
import { RiskSettingsForm } from '@/components/ops/RiskSettingsForm';

export const dynamic = 'force-dynamic';

export default async function OpsRiskSettingsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'ops.read', pathname: '/app/ops/settings/risk' });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const supabase = await createClient();
  const { data: settings } = await supabase
    .from('risk_settings')
    .select('*')
    .eq('org_id', org.org_id)
    .maybeSingle();

  const initial = (settings as Record<string, unknown> | null) ?? {
    enabled: true,
    alert_threshold: 'high',
    min_backup_score: 70,
    require_same_territory: true,
    risk_jump_alert: 15,
  };

  return (
    <div className="p-4 md:p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Risk settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure account-at-risk detection and backup recommendations.
        </p>
      </div>
      <RiskSettingsForm orgId={org.org_id} initial={initial} />
    </div>
  );
}
