import { redirect } from 'next/navigation';
import { getUserContext, hasModule } from '@/lib/user-context';
import Link from 'next/link';
import { FranchisorKmiTable } from '@/components/kpi/franchisor-kmi-table';
import {
  getMockFranchisorKmiRows,
  getMockFranchisorKmiTotal,
  getMockFranchisorStandaloneKpi,
} from '@/lib/kpi-metrics-mock';

export default async function FranchisorDashboard() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) redirect('/onboarding');

  const kmiRows = getMockFranchisorKmiRows();
  const kmiTotal = getMockFranchisorKmiTotal();
  const standaloneKpi = getMockFranchisorStandaloneKpi();

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Franchisor workspace</h1>
        <p className="text-muted-foreground">
          Outcome review and suggested standards. Data is self-reported by franchisees.
        </p>
      </div>

      <FranchisorKmiTable
        rows={kmiRows}
        kmiTotal={kmiTotal}
        standaloneKpi={standaloneKpi}
        kmiGoal={0}
      />

      <nav className="flex flex-wrap gap-2">
        {hasModule(context, 'sales') && (
          <Link href="/franchisor/sales" className="text-primary underline">Sales</Link>
        )}
        <Link href="/franchisor/brand-ops" className="text-primary underline">Brand / Ops</Link>
        <Link href="/franchisor/franchisees" className="text-primary underline">Franchisees</Link>
        {hasModule(context, 'finance') && (
          <Link href="/franchisor/finance" className="text-primary underline">Finance</Link>
        )}
      </nav>
    </div>
  );
}
