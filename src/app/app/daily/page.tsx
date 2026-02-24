import { requireOrg } from '@/lib/auth';
import { getDailyCommand } from '@/lib/daily-command-data';
import { DailyCommandContent } from '@/components/daily/DailyCommandContent';

export const revalidate = 60;

/**
 * Daily Command — tactical execution for TODAY (action + urgency).
 * Tiles: buildings, crews, unassigned, inspections due, accounts below health, SLA, revenue, utilization.
 * Then Needs Attention list and Today's Schedule table.
 */
export default async function DailyCommandPage() {
  const org = await requireOrg();
  const data = await getDailyCommand(org.org_id);

  return <DailyCommandContent data={data} />;
}
