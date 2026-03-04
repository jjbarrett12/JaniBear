import { requireOrg } from '@/lib/auth';
import { CrmSubNav } from '@/components/crm/crm-sub-nav';

export default async function CrmActivitiesPage() {
  await requireOrg();
  return (
    <div className="flex flex-col h-full">
      <CrmSubNav />
      <div className="p-4 flex-1">
        <h1 className="text-xl font-semibold text-foreground mb-2">Activities</h1>
        <p className="text-muted-foreground">Calls, emails, meetings, site visits, tasks. (Coming soon.)</p>
      </div>
    </div>
  );
}
