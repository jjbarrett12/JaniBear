'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  Plus,
  Star,
  Users,
} from 'lucide-react';
import type { Database } from '@/lib/types/database';
import { AccountTeamTab } from '@/components/accounts/account-team-tab';

type Account = Database['public']['Tables']['accounts']['Row'];
type Facility = Database['public']['Tables']['facilities']['Row'];

function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value?: string | number | null;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm mt-0.5">{String(value)}</p>
      </div>
    </div>
  );
}

export function AccountDetailTabs({
  account,
  facilities,
}: {
  account: Account;
  facilities: Facility[];
}) {
  const [tab, setTab] = useState<'overview' | 'facilities' | 'team'>('overview');

  const primaryFacility = facilities.find((f) => f.is_primary) ?? facilities[0];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setTab('facilities')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'facilities'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Facilities ({facilities.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('team')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'team'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Team
        </button>
      </div>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Account info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Name" value={account.name} />
              <InfoRow label="Status" value={account.status} />
              <InfoRow label="Notes" value={account.notes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <InfoRow label="Contact" value={account.billing_contact_name} icon={Building2} />
              <InfoRow label="Email" value={account.billing_email} icon={Mail} />
              <InfoRow label="Phone" value={account.billing_phone} icon={Phone} />
              <InfoRow label="Terms" value={account.billing_terms} />
              <InfoRow
                label="Contract value (monthly)"
                value={account.contract_value_monthly != null ? `$${Number(account.contract_value_monthly).toLocaleString()}` : undefined}
              />
            </CardContent>
          </Card>

          {primaryFacility && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Primary facility
                </CardTitle>
                <CardDescription>{primaryFacility.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-0">
                <InfoRow
                  label="Address"
                  value={
                    [primaryFacility.address_line1, primaryFacility.city, primaryFacility.state, primaryFacility.zip]
                      .filter(Boolean)
                      .join(', ') || undefined
                  }
                />
                <InfoRow label="Access notes" value={primaryFacility.access_notes} />
                <InfoRow label="Service notes" value={primaryFacility.service_notes} />
                <Link href={`/app/accounts/${account.id}/facilities/${primaryFacility.id}`}>
                  <Button variant="outline" size="sm" className="mt-2">
                    View facility
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'team' && <AccountTeamTab account={account} />}

      {tab === 'facilities' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Facilities</CardTitle>
              <CardDescription>Service locations under this account</CardDescription>
            </div>
            <Link href={`/app/accounts/${account.id}/facilities/new`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add facility
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {facilities.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center">
                No facilities yet. Add one to get started.
              </p>
            ) : (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Address</th>
                      <th className="text-left p-3 font-medium w-24">Primary</th>
                      <th className="w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {facilities.map((fac) => {
                      const addr = [fac.address_line1, fac.city, fac.state, fac.zip]
                        .filter(Boolean)
                        .join(', ') || '—';
                      return (
                        <tr key={fac.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3">
                            <Link
                              href={`/app/accounts/${account.id}/facilities/${fac.id}`}
                              className="font-medium hover:underline"
                            >
                              {fac.name}
                            </Link>
                          </td>
                          <td className="p-3 text-muted-foreground">{addr}</td>
                          <td className="p-3">
                            {fac.is_primary ? (
                              <Badge variant="secondary" className="gap-1">
                                <Star className="h-3 w-3" />
                                Primary
                              </Badge>
                            ) : (
                              <SetPrimaryButton accountId={account.id} facilityId={fac.id} />
                            )}
                          </td>
                          <td className="p-3">
                            <Link href={`/app/accounts/${account.id}/facilities/${fac.id}/edit`}>
                              <Button variant="ghost" size="sm">Edit</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SetPrimaryButton({ accountId, facilityId }: { accountId: string; facilityId: string }) {
  const [loading, setLoading] = useState(false);
  return (
    <form
      action={async () => {
        setLoading(true);
        const { setPrimaryFacility } = await import('@/actions/accounts');
        await setPrimaryFacility(accountId, facilityId);
        setLoading(false);
        window.location.reload();
      }}
    >
      <Button type="submit" variant="outline" size="sm" disabled={loading}>
        {loading ? 'Setting…' : 'Set primary'}
      </Button>
    </form>
  );
}
