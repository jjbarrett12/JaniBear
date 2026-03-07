/**
 * Server-side: build Ops Command Center data from existing APIs + mock fallbacks.
 * Wire real sources: getCommandCenterData (dashboard), getCommandCenterData (ops), service_deployments, crews/schedules.
 */

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getCommandCenterData as getDashboardCommandCenter } from '@/lib/command-center-data';
import { getCommandCenterData as getOpsCommandCenter } from './getCommandCenterData';
import { getOpsCommandCenterMock } from './ops-command-center-mock';
import type { OpsCommandCenterData, OpsCommandCenterKPIs, UrgentActionItem } from './ops-command-center-types';

export async function getOpsCommandCenterData(orgId: string): Promise<OpsCommandCenterData> {
  let userName = 'there';
  let orgName: string | null = null;
  let dashboard: Awaited<ReturnType<typeof getDashboardCommandCenter>> | null = null;
  let ops: Awaited<ReturnType<typeof getOpsCommandCenter>> | null = null;

  try {
    const supabase = await createClient();
    const [dashboardData, opsData, orgRow] = await Promise.all([
      getDashboardCommandCenter(orgId),
      getOpsCommandCenter(orgId, {}).catch(() => null),
      supabase.from('organizations').select('name').eq('id', orgId).single(),
    ]);
    dashboard = dashboardData;
    ops = opsData;
    userName = dashboard.userName ?? userName;
    orgName = (orgRow.data as { name?: string } | null)?.name ?? null;
  } catch {
    // use defaults
  }

  const mock = getOpsCommandCenterMock(userName, orgName);

  if (!dashboard) return { ...mock, userName, orgName };

  const kpis: OpsCommandCenterKPIs = {
    activeAccounts: dashboard.accountHealth?.totalAccounts ?? mock.kpis.activeAccounts,
    crewsScheduledToday: dashboard.crew?.totalCrews ?? mock.kpis.crewsScheduledToday,
    accountsAtRisk: dashboard.accountHealth?.countBelow60 ?? mock.kpis.accountsAtRisk,
    openDeployments: mock.kpis.openDeployments,
    slaBreaches: dashboard.risk?.totalRisk ?? mock.kpis.slaBreaches,
    revenueScheduledToday: dashboard.revenue?.todayTotal ?? mock.kpis.revenueScheduledToday,
  };

  let urgentActions: UrgentActionItem[] = mock.urgentActions;
  if (ops?.recommendedActions?.length) {
    urgentActions = ops.recommendedActions.slice(0, 10).map((a) => ({
      id: a.entity_id,
      type: (a.type === 'coverage_gap' ? 'coverage_gap' : a.type === 'risk_account' ? 'risk_account' : 'sla_breach') as UrgentActionItem['type'],
      title: a.title,
      subtitle: a.subtitle,
      href: a.account_id ? `/app/ops/risk/${a.account_id}` : '/app/ops/command-center',
      priority: a.priority,
    }));
  }

  return {
    ...mock,
    kpis,
    urgentActions,
    userName,
    orgName,
  };
}
