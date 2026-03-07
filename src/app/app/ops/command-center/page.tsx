import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { getOpsCommandCenterData } from '@/lib/ops/getOpsCommandCenterData';
import { OpsCommandCenterPage } from '@/components/ops/ops-command-center';

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const pathname = (await headers()).get('x-pathname') ?? '/app/ops/command-center';
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'ops.read', pathname });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const data = await getOpsCommandCenterData(org.org_id);

  return <OpsCommandCenterPage data={data} />;
}
