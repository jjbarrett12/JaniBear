import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/server';
import { ExecutiveDashboard } from '@/components/executive/ExecutiveDashboard';
import { getDemoExecutiveData } from '@/components/executive/data/demoExecutiveData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Executive Dashboard / Cockpit — premium command center view.
 * Gated by dashboard.exec permission.
 * TODO: Replace getDemoExecutiveData with getExecutiveDashboardData(orgId) from API/server action.
 */
export default async function ExecutivePage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');

  try {
    await requirePermission({
      orgId: org.org_id,
      userId,
      permission: 'dashboard.exec',
    });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    throw e;
  }

  // TODO: Wire real data — e.g. getExecutiveDashboardData(org.org_id)
  const supabase = await createClient();
  const { data: orgRow } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', org.org_id)
    .maybeSingle();
  const orgName = orgRow?.name ?? 'Your Company';

  const { data: settings } = await supabase
    .from('org_settings')
    .select('display_name')
    .eq('org_id', org.org_id)
    .maybeSingle();
  const displayName = settings?.display_name?.trim() || orgName;

  const { data: { user } } = await supabase.auth.getUser();
  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'there';

  const data = getDemoExecutiveData(displayName);
  data.userName = userName;
  data.orgName = displayName;

  return <ExecutiveDashboard data={data} />;
}
