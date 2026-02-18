import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { FacilityForm } from '@/components/accounts/facility-form';

export default async function EditFacilityPage({
  params,
}: {
  params: Promise<{ id: string; facilityId: string }>;
}) {
  const { id: accountId, facilityId } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();

  const { data: facility } = await supabase
    .from('facilities')
    .select('*')
    .eq('id', facilityId)
    .eq('account_id', accountId)
    .eq('org_id', org.org_id)
    .single();

  if (!account || !facility) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/app/accounts/${accountId}/facilities/${facilityId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit facility</h1>
          <p className="text-muted-foreground text-sm">{facility.name} · {account.name}</p>
        </div>
      </div>
      <FacilityForm accountId={accountId} initialData={facility} />
    </div>
  );
}
