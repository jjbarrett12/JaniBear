import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { AccountEditForm } from '@/components/accounts/account-edit-form';

export default async function AccountEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: account } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!account) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/app/accounts/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit account</h1>
          <p className="text-muted-foreground text-sm">{account.name}</p>
        </div>
      </div>
      <AccountEditForm account={account} />
    </div>
  );
}
