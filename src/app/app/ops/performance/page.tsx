import { redirect } from 'next/navigation';
import { requireOrg, getCurrentUserId } from '@/lib/auth';
import { requirePermission } from '@/lib/auth/requirePermission';
import { isAuthzError, isAuthContextError, getAuthContextRedirectPath } from '@/lib/auth/errors';
import { createClient } from '@/lib/supabase/server';
import { PerformanceLeaderboard } from '@/components/ops/PerformanceLeaderboard';

export const dynamic = 'force-dynamic';

export default async function OpsPerformancePage() {
  const org = await requireOrg();
  const userId = await getCurrentUserId();
  if (!userId) redirect('/auth/login');
  try {
    await requirePermission({ orgId: org.org_id, userId, permission: 'ops.read', pathname: '/app/ops/performance' });
  } catch (e) {
    if (isAuthzError(e)) redirect('/app/forbidden');
    if (isAuthContextError(e)) redirect(getAuthContextRedirectPath(e.code));
    redirect('/app/authz-error');
  }

  const supabase = await createClient();
  const [perfRes, crewsRes, territoriesRes] = await Promise.all([
    supabase
      .from('operator_performance')
      .select('operator_type, operator_id, qc_score, complaint_rate, missed_tasks_rate, capacity_score, total_score, score_updated_at')
      .eq('org_id', org.org_id)
      .order('total_score', { ascending: false }),
    supabase.from('crews').select('id, name').eq('org_id', org.org_id).order('name'),
    supabase.from('territories').select('id, name').eq('org_id', org.org_id).eq('mode', 'ops').order('name'),
  ]);

  const performances = (perfRes.data ?? []) as {
    operator_type: string;
    operator_id: string;
    qc_score: number;
    complaint_rate: number;
    missed_tasks_rate: number;
    capacity_score: number;
    total_score: number;
    score_updated_at: string;
  }[];
  const crews = (crewsRes.data ?? []) as { id: string; name: string }[];
  const territories = (territoriesRes.data ?? []) as { id: string; name: string }[];

  const operatorNames = new Map<string, string>();
  for (const c of crews) operatorNames.set(`crew:${c.id}`, c.name);
  const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', performances.filter((p) => p.operator_type === 'franchisee').map((p) => p.operator_id));
  for (const o of orgs ?? []) operatorNames.set(`franchisee:${(o as { id: string; name: string }).id}`, (o as { name: string }).name);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Operator Performance</h1>
        <p className="text-muted-foreground mt-1">
          Leaderboard by QC, complaints, missed tasks, and capacity. Operators below 50 are restricted from auto-assignment.
        </p>
      </div>
      <PerformanceLeaderboard
        performances={performances}
        operatorNames={operatorNames}
        territories={territories}
        crews={crews}
      />
    </div>
  );
}
