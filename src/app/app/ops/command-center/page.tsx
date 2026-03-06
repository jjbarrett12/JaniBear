import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { getCommandCenterData } from '@/lib/ops/getCommandCenterData';
import { CommandCenterView } from '@/components/ops/CommandCenterView';
import type { CommandCenterData as CommandCenterDataShape } from '@/lib/ops/command-center-types';

export const dynamic = 'force-dynamic';

export default async function CommandCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; territoryId?: string; verticalId?: string; riskLevel?: string; search?: string }>;
}) {
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

  let canWrite = false;
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'ops.write', pathname });
    canWrite = true;
  } catch {
    // read-only view
  }

  const params = await searchParams;
  const data: CommandCenterDataShape = await getCommandCenterData(org.org_id, {
    date: params.date ?? undefined,
    territoryId: params.territoryId ?? null,
    verticalId: params.verticalId ?? null,
    riskLevel: params.riskLevel ?? null,
    search: params.search ?? null,
  });

  return (
    <CommandCenterView
      initialData={data}
      orgId={org.org_id}
      canWrite={canWrite}
      searchParams={params}
    />
  );
}
