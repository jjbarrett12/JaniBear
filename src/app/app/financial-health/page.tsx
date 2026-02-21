import { redirect } from 'next/navigation';
import { requireOrg } from '@/lib/auth';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { OperatorFinancialHealthDashboard } from '@/components/financial-health/operator-financial-health-dashboard';
import { getEmployeeLaborSummary } from '@/lib/employee-labor-summary';

/**
 * Financial Health for franchisees and owner/operators only.
 * Layout already ran requireOrg(); use same org so we never redirect to /onboarding here (avoids loop).
 * Franchisors are sent to /franchisor/finance.
 */
export default async function FinancialHealthPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();

  if (isFranchisor(context)) {
    redirect('/franchisor/finance');
  }

  const laborSummary = await getEmployeeLaborSummary(org.org_id);

  return (
    <OperatorFinancialHealthDashboard orgId={org.org_id} laborSummary={laborSummary} />
  );
}
