import { requireOrg } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SiteCreateForm } from '@/components/crm/site-create-form';

export default async function NewSitePage() {
  const org = await requireOrg();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .eq('org_id', org.org_id)
    .order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/app/sites" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New site</h1>
          <p className="text-muted-foreground">Add a site (location). Stored in public.locations only.</p>
        </div>
      </div>
      <SiteCreateForm orgId={org.org_id} clients={clients ?? []} />
    </div>
  );
}
