import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Edit } from 'lucide-react';
import { AccountDetailTabs } from '@/components/accounts/account-detail-tabs';

export default async function AccountDetailPage({
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

  const { data: facilities } = await supabase
    .from('facilities')
    .select('*')
    .eq('account_id', id)
    .eq('org_id', org.org_id)
    .order('is_primary', { ascending: false })
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/app/accounts">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {account.logo_url ? (
              <Image src={account.logo_url} alt="" width={48} height={48} className="h-full w-full object-contain" unoptimized />
            ) : (
              <Building2 className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {account.name}
              </h1>
              <Badge
                className={
                  account.status === 'active'
                    ? 'bg-emerald-600'
                    : 'bg-amber-600/80 text-white'
                }
              >
                {account.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">Account</p>
          </div>
        </div>
        <Link href={`/app/accounts/${account.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit account
          </Button>
        </Link>
      </div>

      <AccountDetailTabs account={account} facilities={facilities ?? []} />
    </div>
  );
}
