import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/server';
import { ServiceDeploymentsClient } from '@/components/ops/service-deployments/ServiceDeploymentsClient';
import type { ServiceDeploymentRow } from '@/lib/service-deployments/types';

export const dynamic = 'force-dynamic';

export default async function ServiceDeploymentsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const pathname = (await headers()).get('x-pathname') ?? '/app/ops/service-deployments';
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'dashboard.ops', pathname });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const supabase = await createClient();
  const { data: deployments, error: deploymentsError } = await supabase
    .from('service_deployments')
    .select(`
      id, org_id, account_id, deployment_type, reason, requested_by, requested_at, stage,
      assigned_crew_id, facility_id, notes, go_live_checklist, stabilization_metrics, created_at, updated_at,
      accounts(name),
      crews(name),
      profiles!requested_by(full_name)
    `)
    .eq('org_id', org.org_id)
    .order('requested_at', { ascending: false });

  if (deploymentsError) {
    // Table may not exist yet; return empty list so client can still render
  }

  const rows = ((deployments ?? []) as Record<string, unknown>[]).map((row) => {
    const { accounts, crews, profiles, ...rest } = row;
    return {
      ...rest,
      account: accounts ?? null,
      assigned_crew: crews ?? null,
      requested_by_profile: profiles ?? null,
    } as ServiceDeploymentRow;
  });

  const { data: crews } = await supabase
    .from('crews')
    .select('id, name')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Service Deployments</h1>
        <p className="text-muted-foreground mt-1">
          Track new account activations, crew reassignments, scope changes, franchise transfers, and service restarts.
        </p>
      </div>
      <ServiceDeploymentsClient
        initialDeployments={rows}
        crewOptions={(crews ?? []) as { id: string; name: string }[]}
      />
    </div>
  );
}
