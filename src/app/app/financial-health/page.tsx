import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { requireOrg } from '@/lib/auth';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { OperatorFinancialHealthDashboard } from '@/components/financial-health/operator-financial-health-dashboard';
import { getEmployeeLaborSummary } from '@/lib/employee-labor-summary';
import { getARSnapshotForOrg } from '@/lib/command-center-data';

/**
 * Financial Health for franchisees and owner/operators only.
 * AR (Overview + AR tab) is filled from real invoices via getARSnapshotForOrg.
 * QuickBooks connection: Connect on this page when Accounting Sync is not connected.
 * Layout already ran requireOrg(); use same org so we never redirect to /onboarding here (avoids loop).
 * Franchisors are sent to /franchisor/finance.
 */
export default async function FinancialHealthPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();

  if (isFranchisor(context)) {
    redirect('/franchisor/finance');
  }

  const [laborSummary, arSnapshot] = await Promise.all([
    getEmployeeLaborSummary(org.org_id),
    getARSnapshotForOrg(org.org_id),
  ]);

  return (
    <Suspense fallback={<div className="animate-pulse h-24 bg-muted/30 rounded-lg" />}>
      <OperatorFinancialHealthDashboard orgId={org.org_id} laborSummary={laborSummary} arSnapshot={arSnapshot} />
    </Suspense>
  );
}
