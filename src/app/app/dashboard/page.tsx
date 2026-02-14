import { redirect } from 'next/navigation';
import { getUserContext, isFranchisor } from '@/lib/user-context';

/**
 * Dashboard router: send users to the dashboard for their account type.
 * - Franchisor → /franchisor
 * - Franchisee → /app/dashboard/franchisee
 * - Owner/Operator (independent) or legacy → /app/dashboard/owner-operator
 */
export default async function DashboardRouter() {
  const { context } = await getUserContext();
  if (!context.activeOrgId) redirect('/onboarding');

  if (isFranchisor(context)) {
    redirect('/franchisor');
  }

  if (context.orgType === 'franchisee') {
    redirect('/app/dashboard/franchisee');
  }

  // independent or null/legacy (e.g. org_type was operator before migration)
  redirect('/app/dashboard/owner-operator');
}
