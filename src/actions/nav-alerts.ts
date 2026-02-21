'use server';

import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';

export type NavAlertCounts = {
  /** New hand-offs from sales (launch plans in sales_ready — awaiting ops) */
  handoffsCount: number;
  /** Open issues needing resolution */
  openIssuesCount: number;
  /** Task assignments past due with no completion (missed or no-show — unhappy customer risk) */
  missedTaskCount: number;
};

/**
 * Counts for sidebar alert badges. Used by owner/manager to see:
 * - New hand-offs from sales (Launches)
 * - Open issues (Issues)
 * - Crews who didn't check off tasks after their shift (Schedules / task list)
 */
export async function getNavAlertCounts(): Promise<NavAlertCounts> {
  const org = await requireOrg();
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const [handoffsRes, issuesRes, missedRes] = await Promise.all([
    supabase
      .from('launch_plans')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.org_id)
      .eq('status', 'sales_ready'),
    supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', org.org_id)
      .eq('status', 'open'),
    // Task assignments due in the last 7 days with no completion (missed check-off / no-show risk)
    (async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      const { data: assignments } = await supabase
        .from('task_assignments')
        .select('id')
        .eq('org_id', org.org_id)
        .lt('due_date', today)
        .gte('due_date', cutoffStr);
      if (!assignments?.length) return 0;
      const ids = assignments.map((a) => a.id);
      const { data: completed } = await supabase
        .from('task_completions')
        .select('task_assignment_id')
        .in('task_assignment_id', ids);
      const completedSet = new Set((completed ?? []).map((c) => c.task_assignment_id));
      return assignments.filter((a) => !completedSet.has(a.id)).length;
    })(),
  ]);

  return {
    handoffsCount: (handoffsRes as { count?: number })?.count ?? 0,
    openIssuesCount: (issuesRes as { count?: number })?.count ?? 0,
    missedTaskCount: await missedRes,
  };
}
