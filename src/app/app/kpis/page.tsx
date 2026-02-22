import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import { KpiDataProvider } from '@/contexts/kpi-data-context';
import { KpiPageClient } from './kpi-page-client';

export default async function KpiDashboardPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();
  return (
    <KpiDataProvider>
      <KpiPageClient orgId={org.org_id} role={context.role} roleEnum={context.roleEnum} isAdmin={['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase())} />
    </KpiDataProvider>
  );
}
