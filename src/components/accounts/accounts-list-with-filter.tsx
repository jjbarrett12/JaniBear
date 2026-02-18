'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin } from 'lucide-react';

export type AccountListItem = {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  logo_url?: string | null;
  facility_count: number;
  primary_city: string | null;
  primary_state: string | null;
};

export function AccountsListWithFilter({
  accounts,
  hasNewButton = true,
}: {
  accounts: AccountListItem[];
  hasNewButton?: boolean;
}) {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const filtered =
    filter === 'all'
      ? accounts
      : accounts.filter((a) => a.status === filter);

  const activeCount = accounts.filter((a) => a.status === 'active').length;
  const inactiveCount = accounts.filter((a) => a.status === 'inactive').length;

  return (
    <div className="space-y-4">
      {accounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All ({accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('inactive')}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === 'inactive'
                ? 'bg-amber-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Inactive ({inactiveCount})
          </button>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((account) => {
            const locationLine = [account.primary_city, account.primary_state].filter(Boolean).join(', ');
            return (
              <Link key={account.id} href={`/app/accounts/${account.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-10 w-10 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {account.logo_url ? (
                            <Image src={account.logo_url} alt="" width={40} height={40} className="h-full w-full object-contain" unoptimized />
                          ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <CardTitle className="text-base truncate">{account.name}</CardTitle>
                      </div>
                      <Badge
                        variant={account.status === 'active' ? 'default' : 'secondary'}
                        className={
                          account.status === 'active'
                            ? 'bg-emerald-600 shrink-0'
                            : 'bg-amber-600/80 text-white shrink-0'
                        }
                      >
                        {account.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {account.facility_count} {account.facility_count === 1 ? 'facility' : 'facilities'}
                      {locationLine ? ` · ${locationLine}` : ''}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : accounts.length > 0 ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No {filter === 'active' ? 'active' : 'inactive'} accounts.
            </p>
            <button
              type="button"
              className="mt-2 text-sm font-medium text-primary hover:underline"
              onClick={() => setFilter('all')}
            >
              Show all
            </button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
