import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError } from '@/lib/auth/errors';

export default async function OpsPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'dashboard.ops' });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    throw e;
  }
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Operations</h1>
      <p className="text-muted-foreground mt-1">allowed</p>
    </div>
  );
}
