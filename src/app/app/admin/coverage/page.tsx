import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { AdminPageLayout } from '@/components/admin/admin-page-layout';
import { CoverageAdminTabs } from '@/components/coverage/CoverageAdminTabs';
import { getCoverageAdminData } from '@/lib/coverage/admin-data';

export const dynamic = 'force-dynamic';

/**
 * Coverage Builder: Sales + Ops territory splits and assignments.
 * Requires coverage.admin. Defines coverage_areas (splits), coverage_assignments, territory_parameters, verticals, sales_routing_rules.
 */
export default async function AdminCoveragePage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'coverage.admin' });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const data = await getCoverageAdminData(org.org_id);

  return (
    <AdminPageLayout title="Coverage" description="Sales and ops territory splits and rep/manager assignments.">
      <CoverageAdminTabs orgId={org.org_id} initialData={data} />
    </AdminPageLayout>
  );
}
