import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { PageLayout, PageHeader } from '@/components/enterprise';
import { CrmSubNav } from '@/components/crm/crm-sub-nav';
import { AccountsFilterBar } from '@/components/crm/accounts-filter-bar';
import { AccountsTable } from '@/components/crm/accounts-table';
import { getAccountListData, getCrmOwners } from '@/actions/crm';

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; owner_id?: string; tag?: string; city?: string; zip?: string }>;
}) {
  const org = await requireOrg();
  const params = await searchParams;
  const filters = {
    q: typeof params.q === 'string' ? params.q : undefined,
    status: typeof params.status === 'string' ? params.status : undefined,
    owner_id: typeof params.owner_id === 'string' ? params.owner_id : undefined,
    tag: typeof params.tag === 'string' ? params.tag : undefined,
    city: typeof params.city === 'string' ? params.city : undefined,
    zip: typeof params.zip === 'string' ? params.zip : undefined,
  };

  const [listData, owners] = await Promise.all([
    getAccountListData(org.org_id, filters),
    getCrmOwners(org.org_id),
  ]);

  return (
    <div className="flex flex-col h-full">
      <CrmSubNav />
      <PageLayout className="flex-1 min-h-0">
        <PageHeader
          title="CRM"
          description="Accounts, opportunities, and pipeline"
          actions={
            <Button asChild className="rounded-xl">
              <Link href="/app/crm/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                New Account
              </Link>
            </Button>
          }
        />

        <AccountsFilterBar
          initialQ={filters.q}
          initialStatus={filters.status}
          initialOwner={filters.owner_id}
          initialTag={filters.tag}
          initialCity={filters.city}
          initialZip={filters.zip}
          owners={owners}
        />

        <AccountsTable
          accounts={listData.accounts}
          kpis={listData.kpis}
          orgId={org.org_id}
        />
      </PageLayout>
    </div>
  );
}
