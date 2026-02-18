import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { NewTicketForm } from '@/components/tickets/new-ticket-form';

export default async function NewTicketPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: facilities } = await supabase
    .from('facilities')
    .select('id, name')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">New service ticket</h1>
        <p className="text-muted-foreground mt-1">Create a ticket manually (e.g. from a phone call or email)</p>
      </div>
      <NewTicketForm orgId={org.org_id} facilities={facilities ?? []} />
    </div>
  );
}
