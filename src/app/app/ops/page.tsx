import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';

export default async function OpsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const pathname = (await headers()).get('x-pathname') ?? '/app/ops';
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'dashboard.ops', pathname });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Operations</h1>
      <p className="text-muted-foreground mt-1">allowed</p>
    </div>
  );
}
