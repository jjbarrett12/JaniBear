import { requireOrg } from '@/lib/auth';
import { getDailyCommand } from '@/lib/daily-command-data';
import { DailyCommandOverview } from '@/components/daily/DailyCommandOverview';

export const revalidate = 60;

/**
 * Daily Command Overview — What is happening today. Same view-powered data as Overview.
 * Full-page dark layout.
 */
export default async function DailyCommandPage() {
  const org = await requireOrg();
  const data = await getDailyCommand(org.org_id);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <DailyCommandOverview data={data} embedded={false} />
    </div>
  );
}
