'use client';

import { KpiPageClient } from './kpi-page-client';
import { KpiDashboardPageV2 } from '@/components/kpi/KpiDashboardPageV2';

export function KpiPageSwitcher({
  useV2,
  orgId,
  role,
  roleEnum,
  isAdmin,
}: {
  useV2: boolean;
  orgId: string;
  role?: string | null;
  roleEnum?: string | null;
  isAdmin?: boolean;
}) {
  if (useV2) {
    return <KpiDashboardPageV2 />;
  }
  return (
    <KpiPageClient
      orgId={orgId}
      role={role}
      roleEnum={roleEnum}
      isAdmin={isAdmin}
    />
  );
}
