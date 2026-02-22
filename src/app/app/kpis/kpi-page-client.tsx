'use client';

import { useKpiData } from '@/contexts/kpi-data-context';
import { StrategicTimeframeToggle } from '@/components/kpi/strategic-timeframe-toggle';
import { WidgetGrid } from '@/components/widgets/WidgetGrid';
import { kpiWidgetRegistry } from '@/lib/widgets/registry/kpi-widgets';

export function KpiPageClient({
  orgId,
  role,
  roleEnum,
  isAdmin,
}: {
  orgId: string;
  role?: string | null;
  roleEnum?: string | null;
  isAdmin?: boolean;
}) {
  const { timeframe, setTimeframe } = useKpiData();
  const header = (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Strategic Performance Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Executive performance: growth, operations, contracts, and crew efficiency.
        </p>
      </div>
      <StrategicTimeframeToggle value={timeframe} onChange={setTimeframe} />
    </div>
  );

  return (
    <div className="space-y-8 pb-8">
      <WidgetGrid
        moduleKey="kpi"
        orgId={orgId}
        widgets={kpiWidgetRegistry}
        header={header}
        role={role}
        roleEnum={roleEnum}
        isAdmin={isAdmin}
      />
    </div>
  );
}
