'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AccountDetailDrawer } from '@/components/crm/account-detail-drawer';
import { formatCurrency } from '@/lib/utils';
import type { AccountRow, AccountListKpis } from '@/actions/crm';
import { MoreHorizontal, Plus, FileDown } from 'lucide-react';

export function AccountsTable({
  accounts,
  kpis,
  orgId,
}: {
  accounts: AccountRow[];
  kpis: AccountListKpis;
  orgId: string;
}) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {/* KPI strip */}
      <div className="flex flex-wrap gap-2">
        <KpiChip label="Accounts" value={String(kpis.accountsCount)} />
        <KpiChip label="Open opportunities" value={`${kpis.openOppsCount} · ${formatCurrency(kpis.openOppsValue)}`} />
        <KpiChip label="Follow-ups due" value={String(kpis.followUpsDueCount)} />
        <KpiChip label="At-risk accounts" value={String(kpis.atRiskCount)} />
      </div>

      {accounts.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border sticky top-0 z-10">
                  <TableHead className="font-semibold">Account</TableHead>
                  <TableHead className="font-semibold">Primary Contact</TableHead>
                  <TableHead className="font-semibold">Health</TableHead>
                  <TableHead className="font-semibold">Open Opps</TableHead>
                  <TableHead className="font-semibold">Last Activity</TableHead>
                  <TableHead className="font-semibold">Next Step</TableHead>
                  <TableHead className="font-semibold">Owner</TableHead>
                  <TableHead className="font-semibold">Created</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedAccountId(row.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex flex-col gap-0.5">
                        <span>{row.name}</span>
                        {(row.industry || row.city) && (
                          <span className="text-xs text-muted-foreground">
                            {[row.industry, row.city].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span>{row.primary_contact_name ?? '—'}</span>
                        {row.primary_contact_role && (
                          <span className="text-xs text-muted-foreground capitalize">{row.primary_contact_role.replace('_', ' ')}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress value={row.health} className="h-2 w-16" />
                        <span className="text-xs rounded-full bg-muted px-2 py-0.5 whitespace-nowrap">{row.health_label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {row.open_opps_count > 0 ? `${row.open_opps_count} · ${formatCurrency(row.open_opps_value)}` : '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{row.last_activity_text ?? '—'}</TableCell>
                    <TableCell className="text-sm">{row.next_step_text ?? '—'}</TableCell>
                    <TableCell>
                      {row.owner_initials ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                          {row.owner_initials}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(row.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <KebabMenu accountId={row.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <AccountDetailDrawer
        accountId={selectedAccountId}
        orgId={orgId}
        onClose={() => setSelectedAccountId(null)}
      />
    </div>
  );
}

function KpiChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 min-w-0">
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      <p className="text-sm font-semibold tabular-nums truncate">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-border bg-card flex flex-col items-center justify-center py-16 px-6 text-center">
      <h3 className="text-lg font-semibold text-foreground">No accounts yet</h3>
      <p className="text-muted-foreground mt-1 max-w-sm">Add your first client or import from CSV.</p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button asChild>
          <Link href="/app/crm/clients/new">
            <Plus className="mr-2 h-4 w-4" />
            New Account
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/crm?import=csv">
            <FileDown className="mr-2 h-4 w-4" />
            Import CSV
          </Link>
        </Button>
      </div>
      <Link href="/app/crm?sample=csv" className="text-sm text-primary hover:underline mt-3">
        See sample format
      </Link>
    </div>
  );
}

function KebabMenu({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-card py-1 shadow-lg">
            <Link
              href={`/app/crm/clients/${accountId}`}
              className="block px-3 py-2 text-sm hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              Open full page
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
