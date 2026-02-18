import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { FacilityForm } from '@/components/accounts/facility-form';

export default async function NewFacilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: accountId } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('id', accountId)
    .eq('org_id', org.org_id)
    .single();

  if (!account) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/app/accounts/${accountId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add facility</h1>
          <p className="text-muted-foreground text-sm">Account: {account.name}</p>
        </div>
      </div>
      <FacilityForm accountId={accountId} />
    </div>
  );
}
