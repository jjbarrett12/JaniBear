'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSearch, FileText, Calculator, LayoutGrid, Activity } from 'lucide-react';
import { formatDate } from '@/lib/utils';

type Opp = { id: string; stage: string; est_value?: number | null; created_at: string };
type Walkthrough = { id: string; status: string; scheduled_at: string | null; opportunity_id: string | null };
type Bid = { id: string; status: string; total_estimated_cost: number | null; opportunity_id: string | null; created_at: string };
type ActivityRow = { id: string; type: string; subject: string | null; due_at: string | null; completed_at: string | null; created_at: string };

export function AccountSalesTabs({
  accountId,
  accountName: _accountName,
  opportunities,
  walkthroughs,
  bids,
  activities,
  oppMap: _oppMap,
}: {
  accountId: string;
  accountName: string;
  opportunities: Opp[];
  walkthroughs: Walkthrough[];
  bids: Bid[];
  activities: ActivityRow[];
  oppMap: Map<string, Opp>;
}) {
  const [tab, setTab] = useState<'overview' | 'walkthroughs' | 'scope' | 'proposals' | 'activity'>('overview');

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
    { id: 'walkthroughs' as const, label: 'Walkthroughs', icon: FileSearch },
    { id: 'scope' as const, label: 'Scope', icon: FileText },
    { id: 'proposals' as const, label: 'Proposals', icon: Calculator },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Opportunities:</strong> {opportunities.length}
            </p>
            <p>
              <strong>Walkthroughs:</strong> {walkthroughs.length}
            </p>
            <p>
              <strong>Bids / proposals:</strong> {bids.length}
            </p>
            <Link href={`/app/accounts/${accountId}`}>
              <Button variant="outline" size="sm" className="mt-2">
                View full account
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === 'walkthroughs' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Walkthroughs</CardTitle>
            <p className="text-sm text-muted-foreground">Site assessments linked to this account’s opportunities</p>
          </CardHeader>
          <CardContent>
            {walkthroughs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No walkthroughs yet.</p>
            ) : (
              <ul className="space-y-2">
                {walkthroughs.map((w) => (
                  <li key={w.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <Link href={`/app/walkthroughs/${w.id}`} className="font-medium hover:underline">
                      {w.status} {w.scheduled_at ? ` · ${formatDate(w.scheduled_at)}` : ''}
                    </Link>
                    <Link href={`/app/sales/walkthroughs`}>
                      <Button variant="ghost" size="sm">All walkthroughs</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/app/sales/walkthroughs`} className="inline-block mt-2">
              <Button variant="outline" size="sm">View all walkthroughs</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === 'scope' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope Builder</CardTitle>
            <p className="text-sm text-muted-foreground">Build or edit scope from walkthroughs</p>
          </CardHeader>
          <CardContent>
            <Link href="/app/sales/scope">
              <Button variant="outline">Open Scope Builder</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === 'proposals' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proposals</CardTitle>
            <p className="text-sm text-muted-foreground">Bids and proposals for this account</p>
          </CardHeader>
          <CardContent>
            {bids.length === 0 ? (
              <p className="text-muted-foreground text-sm">No proposals yet.</p>
            ) : (
              <ul className="space-y-2">
                {bids.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm">
                      {b.total_estimated_cost != null ? `$${Number(b.total_estimated_cost).toLocaleString()}` : '—'} · {b.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(b.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/app/sales/proposals" className="inline-block mt-2">
              <Button variant="outline" size="sm">View all proposals</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {tab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Calls, tasks, and notes from this account’s opportunities</p>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-muted-foreground text-sm">No activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 text-sm">
                    <span className="capitalize">{a.type}</span>
                    {a.subject && <span className="text-muted-foreground truncate ml-2">{a.subject}</span>}
                    <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.completed_at ?? a.due_at ?? a.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
