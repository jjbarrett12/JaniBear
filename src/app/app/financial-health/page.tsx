import { redirect } from 'next/navigation';
import { getUserContext, isFranchisor } from '@/lib/user-context';
import { OperatorFinancialHealthDashboard } from '@/components/financial-health/operator-financial-health-dashboard';
import { getEmployeeLaborSummary } from '@/lib/employee-labor-summary';

/**
 * Financial Health for franchisees and owner/operators only.
 * Franchisors are sent to /franchisor/finance for their outcomes dashboard.
 * Uses real employee pay (hourly + salary) for labor and cashflow when available.
 */
export default async function FinancialHealthPage() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) redirect('/onboarding');

  if (isFranchisor(context)) {
    redirect('/franchisor/finance');
  }

  const laborSummary = await getEmployeeLaborSummary(context.activeOrgId);

  return <OperatorFinancialHealthDashboard laborSummary={laborSummary} />;
}
