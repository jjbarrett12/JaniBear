import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building2, MapPin } from 'lucide-react';
import { AccountsListWithFilter } from '@/components/accounts/accounts-list-with-filter';

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const org = await requireOrg();
  const supabase = await createClient();
  const { q } = await searchParams;

  let query = supabase
    .from('accounts')
    .select('*, facilities(id, name, city, state, is_primary)')
    .eq('org_id', org.org_id)
    .order('name');

  if (q?.trim()) {
    query = query.ilike('name', `%${q.trim()}%`);
  }

  const { data: accounts } = await query;

  const withMeta = (accounts ?? []).map((acc) => {
    const facilities = (acc.facilities ?? []) as { id: string; name: string; city: string | null; state: string | null; is_primary: boolean }[];
    const primary = facilities.find((f) => f.is_primary) ?? facilities[0];
    return {
      id: acc.id,
      name: acc.name,
      status: acc.status,
      logo_url: (acc as { logo_url?: string | null }).logo_url ?? null,
      facility_count: facilities.length,
      primary_city: primary?.city ?? null,
      primary_state: primary?.state ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage accounts and their facilities (active & inactive)
          </p>
        </div>
        <Link href="/app/accounts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Account
          </Button>
        </Link>
      </div>

      {withMeta.length > 0 ? (
        <AccountsListWithFilter accounts={withMeta} hasNewButton />
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
  );
}
