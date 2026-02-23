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
    <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 pb-8">
      <div className="space-y-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Strategic Performance
        </h1>
        <p className="text-sm text-muted-foreground">
          Growth, operations, contracts, crew efficiency.
        </p>
      </div>
      <StrategicTimeframeToggle value={timeframe} onChange={setTimeframe} />
    </header>
  );

  return (
    <div className="kpi-executive-console kpi-command-center -mx-4 -mt-4 px-6 pt-6 pb-8 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 max-w-[1400px] mx-auto">
      <div className="space-y-8">
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
    </div>
  );
}
