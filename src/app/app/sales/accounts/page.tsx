import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building2 } from 'lucide-react';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { AccountsListWithFilter } from '@/components/accounts/accounts-list-with-filter';

export default async function SalesAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { q, view } = await searchParams;

  let query = supabase
    .from('accounts')
    .select('*, facilities(id, name, city, state, is_primary)')
    .eq('org_id', org.org_id)
    .order('name');

  if (q?.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }
  if (view === 'prospects') query = query.eq('status', 'inactive');
  if (view === 'customers') query = query.eq('status', 'active');

  const { data: accounts } = await query;

  const withMeta = (accounts ?? []).map((acc) => {
    const facilities = (acc.facilities ?? []) as { id: string; name: string; city: string | null; state: string | null; is_primary: boolean }[];
    const primary = facilities.find((f) => f.is_primary) ?? facilities[0];
    return {
      id: acc.id,
      name: acc.name,
      status: acc.status as 'active' | 'inactive',
      logo_url: (acc as { logo_url?: string | null }).logo_url ?? null,
      facility_count: facilities.length,
      primary_city: primary?.city ?? null,
      primary_state: primary?.state ?? null,
    };
  });

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales <span className="text-foreground/80">/ Accounts</span>
        </span>
      }
    >
      <div className="p-4 md:p-6 space-y-6">
        <PageHeader
          title="Accounts"
          description="Prospects and customers — walkthroughs, scope, and proposals live here."
          primaryCta={
            <Link href="/app/accounts/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Account
              </Button>
            </Link>
          }
          filters={
            <>
              <Link href="/app/sales/accounts"><Button variant={!view ? 'default' : 'outline'} size="sm">All</Button></Link>
              <Link href="/app/sales/accounts?view=prospects"><Button variant={view === 'prospects' ? 'default' : 'outline'} size="sm">Prospects</Button></Link>
              <Link href="/app/sales/accounts?view=customers"><Button variant={view === 'customers' ? 'default' : 'outline'} size="sm">Customers</Button></Link>
            </>
          }
        />
        {withMeta.length > 0 ? (
          <AccountsListWithFilter
            accounts={withMeta}
            hasNewButton={false}
            getAccountHref={(id) => `/app/sales/accounts/${id}`}
          />
        ) : (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No accounts yet</p>
              <Link href="/app/accounts/new">
                <Button>Create Your First Account</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </SalesPageShell>
  );
}
