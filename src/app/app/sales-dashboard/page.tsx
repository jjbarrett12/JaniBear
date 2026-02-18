import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { getUserContext } from '@/lib/user-context';
import { isSalesRepRole, isSalesAdminOrManager } from '@/types/sales';
import { getSalesCommandCenterData } from '@/lib/sales-dashboard-data';
import { SalesCommandCenter } from '@/components/sales/sales-command-center';

/**
 * Sales Command Center: proposals-driven pipeline for sales_rep.
 * Reps see own numbers + team leaderboard (no other reps' revenue). Admins can see all (scaffolded).
 */
export default async function SalesDashboardPage() {
  const org = await requireOrg();
  const { context } = await getUserContext();
  const userId = await getCurrentUserId();

  const isRep = isSalesRepRole(context.role, context.roleEnum);
  const isAdmin = isSalesAdminOrManager(context.role, context.roleEnum);

  if (!userId || (!isRep && !isAdmin)) {
    redirect('/app/dashboard');
  }

  const repId = userId;
  const [data, profile] = await Promise.all([
    getSalesCommandCenterData(org.org_id, repId),
    (async () => {
      const supabase = await createClient();
      const { data: p } = await supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle();
      return p?.full_name ?? null;
    })(),
  ]);

  return (
    <SalesCommandCenter
      orgId={org.org_id}
      repId={repId}
      data={data}
      isAdmin={isAdmin}
      repName={profile ?? undefined}
    />
  );
}
