'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LaunchPacketRecord } from '@/components/launch/launch-packet-detail';

type Props = {
  packet: LaunchPacketRecord;
  submitSlot?: React.ReactNode;
};

export function ContractLaunchThreeColumn({ packet, submitSlot }: Props) {
  const payload = (packet.payload_jsonb ?? {}) as {
    locations?: unknown[];
    scope?: unknown;
    schedule_draft?: unknown;
    sla?: unknown;
    staffing?: unknown;
    supplies?: unknown;
    docs_refs?: unknown[];
    contacts?: unknown[];
    start_date?: string;
    price?: number | string;
    access_notes?: string;
  };

  const checklist = {
    contract_signed: payload.scope != null,
    scope_locked: payload.scope != null,
    schedule_confirmed: payload.schedule_draft != null && (Array.isArray(payload.schedule_draft) ? (payload.schedule_draft as unknown[]).length > 0 : true),
    access_notes: (payload.access_notes ?? '') !== '' || (payload.locations ?? []).length > 0,
    primary_contacts: Array.isArray(payload.contacts) && payload.contacts.length > 0,
    supplies_plan: payload.supplies != null,
    slas: payload.sla != null,
  };
  const checklistEntries = [
    { key: 'contract_signed', label: 'Contract signed upload', done: checklist.contract_signed },
    { key: 'scope_locked', label: 'Scope locked', done: checklist.scope_locked },
    { key: 'schedule_confirmed', label: 'Schedule confirmed', done: checklist.schedule_confirmed },
    { key: 'access_notes', label: 'Access notes', done: checklist.access_notes },
    { key: 'primary_contacts', label: 'Primary contacts', done: checklist.primary_contacts },
    { key: 'supplies_plan', label: 'Supplies plan', done: checklist.supplies_plan },
    { key: 'slas', label: 'SLAs', done: checklist.slas },
  ];
  const doneCount = checklistEntries.filter((e) => e.done).length;
  const totalCount = checklistEntries.length;

  const statusLabel =
    packet.status === 'sent_to_ops'
      ? 'Submitted'
      : packet.status === 'ready'
        ? 'Ready'
        : packet.status === 'review'
          ? 'Review'
          : packet.status;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            packet.status === 'accepted' ? 'default' : packet.status === 'rejected' ? 'destructive' : 'secondary'
          }
        >
          {statusLabel.replace(/_/g, ' ')}
        </Badge>
        {packet.account && (
          <span className="text-sm text-muted-foreground">Account: {packet.account.name}</span>
        )}
        {submitSlot && <div className="ml-auto">{submitSlot}</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Deal summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><span className="text-muted-foreground">Account:</span> {packet.account?.name ?? '—'}</p>
            <p><span className="text-muted-foreground">Contacts:</span>{' '}
              {Array.isArray(payload.contacts) && payload.contacts.length > 0
                ? `${payload.contacts.length} contact(s)`
                : '—'}
            </p>
            <p><span className="text-muted-foreground">Start date:</span> {payload.start_date ?? '—'}</p>
            <p><span className="text-muted-foreground">Schedule:</span>{' '}
              {payload.schedule_draft != null ? (Array.isArray(payload.schedule_draft) ? `${(payload.schedule_draft as unknown[]).length} item(s)` : 'Set') : '—'}
            </p>
            <p><span className="text-muted-foreground">Price:</span>{' '}
              {payload.price != null ? (typeof payload.price === 'number' ? `$${payload.price}` : String(payload.price)) : '—'}
            </p>
            <p className="text-muted-foreground text-xs pt-1">Proposal snapshot: linked to account/opportunity</p>
          </CardContent>
        </Card>

        {/* Column 2: Required checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Required checklist</CardTitle>
            <p className="text-xs text-muted-foreground">{doneCount} of {totalCount} complete</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {checklistEntries.map((e) => (
                <li key={e.key} className={e.done ? 'text-muted-foreground' : ''}>
                  {e.done ? '✓' : '○'} {e.label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Column 3: Ops preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ops preview</CardTitle>
            <p className="text-xs text-muted-foreground">What Ops will receive</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Handoff:</span> Account activation, locations from payload, scope & schedule.
            </p>
            {Array.isArray(payload.locations) && payload.locations.length > 0 && (
              <p className="text-muted-foreground">{payload.locations.length} location(s) in payload.</p>
            )}
            <p className="text-muted-foreground pt-1">Crew estimate: (from scope when accepted)</p>
            <p className="text-muted-foreground">First week plan: (created on Accept)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
