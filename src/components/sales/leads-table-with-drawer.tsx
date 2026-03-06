'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { RightDrawer } from '@/components/sales/right-drawer';
import { getLeadForDrawer, convertLeadToOpportunity, setLeadStatusAction } from '@/actions/leads';
import type { LeadForDrawer } from '@/actions/leads';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { ConvertLeadToOpportunityModal } from '@/components/sales/convert-lead-to-opportunity-modal';
import { Mail, Phone, Building2, Calendar, TrendingUp, PhoneCall, CheckSquare, XCircle } from 'lucide-react';

type LeadRow = {
  id: string;
  contact_name: string | null;
  company: string | null;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
  converted_opportunity_id?: string | null;
  overflow?: boolean;
  overflow_reason?: string | null;
  assigned_user_id?: string | null;
};

export function LeadsTableWithDrawer({
  leads,
  accounts,
  orgId,
  overflowMode = false,
}: {
  leads: LeadRow[];
  accounts: { id: string; name: string }[];
  orgId: string;
  overflowMode?: boolean;
}) {
  const router = useRouter();
  const [drawerLeadId, setDrawerLeadId] = useState<string | null>(null);
  const [drawerData, setDrawerData] = useState<LeadForDrawer | null>(null);
  const [loading, setLoading] = useState(false);
  const [disqualifying, setDisqualifying] = useState(false);

  useEffect(() => {
    if (!drawerLeadId) {
      setDrawerData(null);
      return;
    }
    setLoading(true);
    getLeadForDrawer(orgId, drawerLeadId).then((d) => {
      setDrawerData(d);
      setLoading(false);
    });
  }, [drawerLeadId, orgId]);

  const handleDisqualify = async () => {
    if (!drawerLeadId) return;
    setDisqualifying(true);
    const res = await setLeadStatusAction(drawerLeadId, 'lost');
    setDisqualifying(false);
    if (res.ok) {
      setDrawerLeadId(null);
      router.refresh();
    }
  };

  const lead = drawerData?.lead;
  const title = lead ? (lead.contact_name || lead.company || 'Lead') : 'Lead';

  return (
    <>
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead / Company</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last touch</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Next step</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No leads yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setDrawerLeadId(row.id)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{row.contact_name || '—'}</span>
                      {row.company && <span className="text-xs text-muted-foreground">{row.company}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{row.source?.replace('_', ' ') ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'lost' ? 'secondary' : 'outline'} className="capitalize">
                      {row.status?.replace(/_/g, ' ') ?? 'new'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatRelativeTime(row.updated_at)}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{formatDate(row.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RightDrawer
        open={drawerLeadId != null}
        onClose={() => setDrawerLeadId(null)}
        title={loading ? 'Loading…' : title}
      >
        {loading ? (
          <div className="p-6 text-muted-foreground">Loading…</div>
        ) : drawerData?.lead ? (
          <LeadDrawerContent
            data={drawerData}
            accounts={accounts}
            onConverted={() => { setDrawerLeadId(null); router.refresh(); }}
            onDisqualify={handleDisqualify}
            disqualifying={disqualifying}
            onClose={() => setDrawerLeadId(null)}
          />
        ) : (
          <div className="p-6 text-muted-foreground">Lead not found.</div>
        )}
      </RightDrawer>
    </>
  );
}

function LeadDrawerContent({
  data,
  accounts,
  onDisqualify,
  disqualifying,
}: {
  data: LeadForDrawer;
  accounts: { id: string; name: string }[];
  onConverted: () => void;
  onDisqualify: () => void;
  disqualifying: boolean;
  onClose: () => void;
}) {
  const { lead, touchLog, nextTouchAt } = data;
  if (!lead) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2 text-sm">
        {lead.company && (
          <p className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            {lead.company}
          </p>
        )}
        {lead.email && (
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
          </p>
        )}
        {lead.phone && (
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
          </p>
        )}
        {(lead.address || lead.city) && (
          <p className="flex items-center gap-2 text-muted-foreground">
            {[lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
          </p>
        )}
      </div>

      {lead.notes && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</h3>
          <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
        </div>
      )}

      {nextTouchAt && (
        <p className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          Next touch: {formatDate(nextTouchAt)}
        </p>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Activity</h3>
        {touchLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {touchLog.map((t) => (
              <li key={t.id} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">{formatDate(t.completed_at)}</span>
                <span className="capitalize">{t.channel}</span>
                {t.notes && <span className="text-muted-foreground truncate">· {t.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-4 border-t border-border">
        {!lead.converted_opportunity_id && (
          <div className="flex flex-wrap gap-2 items-center">
            <ConvertLeadToOpportunityModal
              leadId={lead.id}
              defaultAccountName={lead.company?.trim() || lead.contact_name?.trim() || ''}
              accounts={accounts}
            />
            <span className="text-xs text-muted-foreground">Convert creates Account + Opportunity and opens Pipeline.</span>
          </div>
        )}
        {lead.converted_opportunity_id && (
          <Link href={`/app/crm/opportunities/${lead.converted_opportunity_id}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              View in Pipeline
            </Button>
          </Link>
        )}
        <Button variant="outline" size="sm" className="gap-2 justify-start" disabled>
          <PhoneCall className="h-4 w-4" />
          Log Call
          <span className="text-xs text-muted-foreground ml-1">(TODO)</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-2 justify-start" disabled>
          <CheckSquare className="h-4 w-4" />
          Create Task
          <span className="text-xs text-muted-foreground ml-1">(TODO)</span>
        </Button>
        {lead.status !== 'lost' && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2 justify-start text-destructive hover:text-destructive"
            onClick={onDisqualify}
            disabled={disqualifying}
          >
            <XCircle className="h-4 w-4" />
            Disqualify
          </Button>
        )}
      </div>

      <Link href={`/app/sales/leads/${lead.id}`}>
        <Button variant="ghost" size="sm" className="w-full">Open full lead page</Button>
      </Link>
    </div>
  );
}
