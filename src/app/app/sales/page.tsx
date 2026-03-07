import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { getSalesCommandData } from '@/lib/sales/sales-command-data';
import { SalesPageShell } from '@/components/sales/page-shell';
import { SalesCommandView } from '@/components/sales/sales-command-view';

export default async function SalesPage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  const pathname = (await headers()).get('x-pathname') ?? '/app/sales';
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'dashboard.sales', pathname });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const data = await getSalesCommandData(org.org_id, userId);

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Command</span>
        </span>
      }
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        <SalesCommandView data={data} />
      </div>
    </SalesPageShell>
  );
}
