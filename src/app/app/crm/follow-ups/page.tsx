import { requireOrg } from '@/lib/auth';
import { CrmSubNav } from '@/components/crm/crm-sub-nav';

export default async function CrmFollowUpsPage() {
  await requireOrg();
  return (
    <div className="flex flex-col h-full">
      <CrmSubNav />
      <div className="p-4 flex-1">
        <h1 className="text-xl font-semibold text-foreground mb-2">Follow-ups</h1>
        <p className="text-muted-foreground">Today’s worklist: Due Today, Overdue, Upcoming. (Coming soon.)</p>
      </div>
    </div>
  );
}
