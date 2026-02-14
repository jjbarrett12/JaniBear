import { getUserContext, isFranchisor } from '@/lib/user-context';
import { redirect } from 'next/navigation';
import { FranchisorFinancialHealthDashboard } from '@/components/financial-health/franchisor-financial-health-dashboard';

/**
 * Financial Health for franchisors only: franchisee outcomes (leaderboard, at-risk, margin distribution).
 * Operators use /app/financial-health for their own business dashboard.
 */
export default async function FranchisorFinancePage() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) redirect('/onboarding');
  if (!isFranchisor(context)) redirect('/app/financial-health');

  return <FranchisorFinancialHealthDashboard />;
}
