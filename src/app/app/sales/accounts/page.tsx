import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building2 } from 'lucide-react';
import { SalesPageShell } from '@/components/sales/page-shell';
import { PageHeader } from '@/components/sales/page-header';
import { AccountsListWithFilter } from '@/components/accounts/accounts-list-with-filter';
import { SALES_COPY } from '@/lib/sales-module-copy';

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
      <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        <PageHeader
          title={SALES_COPY.accounts.title}
          description={SALES_COPY.accounts.description}
          strap={SALES_COPY.accounts.strap}
          primaryCta={
            <Link href="/app/accounts/new">
              <Button size="sm" className="gap-2 h-9">
                <Plus className="h-4 w-4" />
                {SALES_COPY.accounts.newAccount}
              </Button>
            </Link>
          }
          filters={
            <>
              <Link href="/app/sales/accounts"><Button variant={!view ? 'default' : 'outline'} size="sm" className="h-8 text-xs">{SALES_COPY.accounts.all}</Button></Link>
              <Link href="/app/sales/accounts?view=prospects"><Button variant={view === 'prospects' ? 'default' : 'outline'} size="sm" className="h-8 text-xs">{SALES_COPY.accounts.prospects}</Button></Link>
              <Link href="/app/sales/accounts?view=customers"><Button variant={view === 'customers' ? 'default' : 'outline'} size="sm" className="h-8 text-xs">{SALES_COPY.accounts.customers}</Button></Link>
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
          <Card className="rounded-xl border-border bg-card/80 dark:bg-card/90">
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">{SALES_COPY.accounts.noAccounts}</p>
              <Link href="/app/accounts/new">
                <Button size="sm" className="h-9">New account</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </SalesPageShell>
  );
}
