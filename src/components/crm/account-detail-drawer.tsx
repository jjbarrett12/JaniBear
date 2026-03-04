'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getClientDetail } from '@/actions/crm';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { ClientDetail } from '@/actions/crm';

export function AccountDetailDrawer({
  accountId,
  orgId,
  onClose,
}: {
  accountId: string | null;
  orgId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    getClientDetail(orgId, accountId).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  }, [accountId, orgId]);

  if (!accountId) return null;

  const client = detail?.client;
  const locations = detail?.locations ?? [];
  const contacts = detail?.contacts ?? [];
  const opportunities = detail?.opportunities ?? [];
  const activities = detail?.recentActivities ?? [];

  return (
    <aside className="fixed top-0 right-0 z-50 h-full w-[40%] min-w-[320px] max-w-[560px] flex flex-col bg-card border-l border-border shadow-xl">
      <div className="flex items-center justify-between border-b border-border p-4 shrink-0">
        <h2 className="text-lg font-semibold truncate">{loading ? 'Loading…' : client?.name ?? 'Account'}</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">Loading…</div>
        ) : (
          <AccountDrawerTabs client={client} locations={locations} contacts={contacts} opportunities={opportunities} activities={activities} accountId={accountId} />
        )}
      </div>
    </aside>
  );
}

type TabId = 'overview' | 'contacts' | 'pipeline' | 'activity' | 'notes';

function AccountDrawerTabs({
  client,
  locations,
  contacts,
  opportunities,
  activities,
  accountId,
}: {
  client: ClientDetail['client'];
  locations: ClientDetail['locations'];
  contacts: ClientDetail['contacts'];
  opportunities: ClientDetail['opportunities'];
  activities: ClientDetail['recentActivities'];
  accountId: string;
}) {
  const [tab, setTab] = useState<TabId>('overview');
  const address = locations[0] ? [locations[0].address, locations[0].city, locations[0].state, locations[0].zip].filter(Boolean).join(', ') : null;
  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'pipeline', label: 'Pipeline' },
    { id: 'activity', label: 'Activity' },
    { id: 'notes', label: 'Notes & Files' },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border px-2">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {tab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status & tags</p>
                  <p className="font-medium capitalize">{client?.status ?? '—'}</p>
                  {client?.industry && <span className="inline-block mt-1 text-xs rounded-full bg-muted px-2 py-0.5">{client.industry}</span>}
                </div>
                {address && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                    <p className="text-sm">{address}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{locations.length} site{locations.length !== 1 ? 's' : ''} linked</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quick actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild><Link href={`/app/crm?account=${accountId}&action=activity`}>Log Activity</Link></Button>
                    <Button variant="outline" size="sm" asChild><Link href={`/app/crm/clients/${accountId}`}>Add Contact</Link></Button>
                    <Button variant="outline" size="sm" asChild><Link href="/app/crm/pipeline">Create Opportunity</Link></Button>
                    <Button variant="outline" size="sm" asChild><Link href="/app/walkthroughs">Schedule Walkthrough</Link></Button>
                    <Button variant="outline" size="sm" asChild><Link href="/app/proposals/build">Create Proposal</Link></Button>
                  </div>
                </div>
              </div>
        )}
        {tab === 'contacts' && (
          <ul className="space-y-3">
            {contacts.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</span>
                  {c.is_primary && <span className="text-xs rounded bg-primary/20 text-primary px-2 py-0.5">Primary</span>}
                </div>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">{c.contact_type?.replace('_', ' ') ?? '—'}</p>
                {c.email && <p className="text-sm">{c.email}</p>}
                {c.phone && <p className="text-sm">{c.phone}</p>}
              </li>
            ))}
            {contacts.length === 0 && <p className="text-sm text-muted-foreground">No contacts yet.</p>}
          </ul>
        )}
        {tab === 'pipeline' && (
          <>
            <ul className="space-y-2">
              {opportunities.map((opp) => (
                <li key={opp.id} className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
                  <Link href={`/app/crm/opportunities/${opp.id}`} className="font-medium hover:underline">{opp.stage}</Link>
                  <span className="tabular-nums">{formatCurrency(opp.est_mrr ?? 0)}</span>
                </li>
              ))}
              {opportunities.length === 0 && <p className="text-sm text-muted-foreground">No opportunities.</p>}
            </ul>
            <Button variant="outline" size="sm" className="mt-3" asChild><Link href="/app/crm/pipeline">Open in Pipeline</Link></Button>
          </>
        )}
        {tab === 'activity' && (
          <ul className="space-y-2">
            {activities.map((a) => (
              <li key={a.id} className="text-sm border-b border-border/50 pb-2">
                <span className="capitalize font-medium">{a.type}</span>
                {a.subject && <span> · {a.subject}</span>}
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
              </li>
            ))}
            {activities.length === 0 && <p className="text-sm text-muted-foreground">No activity yet.</p>}
          </ul>
        )}
        {tab === 'notes' && (
          <p className="text-sm text-muted-foreground">Freeform notes and attachments. (Placeholder)</p>
        )}
      </div>
    </div>
  );
}
