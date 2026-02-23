import { requireOrg } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import { KpiDataProvider } from '@/contexts/kpi-data-context';
import { KpiPageSwitcher } from './kpi-page-switcher';

// V2 is the default KPI dashboard (Executive Snapshot, Performance, etc.). Set NEXT_PUBLIC_KPI_DASHBOARD_V2=false to use the legacy widget grid.
const useKpiDashboardV2 = process.env.NEXT_PUBLIC_KPI_DASHBOARD_V2 !== 'false';

export default async function KpiDashboardPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();
  const isAdmin = ['owner', 'admin', 'manager'].includes((context.role ?? '').toLowerCase());
  return (
    <KpiDataProvider>
      <KpiPageSwitcher
        useV2={useKpiDashboardV2}
        orgId={org.org_id}
        role={context.role}
        roleEnum={context.roleEnum}
        isAdmin={isAdmin}
      />
    </KpiDataProvider>
  );
}
