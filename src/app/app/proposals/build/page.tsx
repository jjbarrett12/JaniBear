import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Building2,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

type ScopeJson = {
  customer?: { company_name?: string; contact_name?: string };
  site?: { square_footage?: number; address?: string; name?: string };
  service?: { days_per_week?: number };
  pricing?: { estimated_hours?: number; hourly_rate?: number; estimated_crew_size?: number };
};

const PROPOSAL_STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof Clock }> = {
  draft: { label: 'Draft', variant: 'outline', icon: FileText },
  sent: { label: 'Sent', variant: 'default', icon: Send },
  accepted: { label: 'Accepted', variant: 'secondary', icon: CheckCircle2 },
  rejected: { label: 'Rejected', variant: 'destructive', icon: Clock },
};

export default async function ProposalBuildPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const [{ data: walkthroughs }, { data: proposals }] = await Promise.all([
    supabase
      .from('walkthroughs')
      .select(`
        id, status, scheduled_at, completed_at, created_at,
        locations (name, address),
        sites (name, address),
        opportunities (client_id, clients(name)),
        scope_models (id, extracted_json, confidence)
      `)
      .eq('org_id', org.org_id)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('proposals')
      .select('id, proposal_title, status, total_amount, lead_id, opportunity_id, created_at, updated_at')
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false }),
  ]);

  const proposalsByOpp = new Map<string, typeof proposals>();
  for (const p of proposals ?? []) {
    if (p.opportunity_id) {
      const existing = proposalsByOpp.get(p.opportunity_id) ?? [];
      existing.push(p);
      proposalsByOpp.set(p.opportunity_id, existing);
    }
  }

  const completed = (walkthroughs ?? []).filter((w) => w.status === 'completed');
  const needsProposal = completed.filter((w) => {
    const oppId = w.opportunities?.client_id;
    return !oppId || !(proposalsByOpp.get(oppId)?.length);
  });

  const drafts = (proposals ?? []).filter((p) => p.status === 'draft');

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Proposal Builder</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-generate proposals from completed walkthroughs. AI merges site data, scope, and pricing into a ready-to-send document.
        </p>
      </div>

      {needsProposal.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Ready to Generate</h2>
            <Badge variant="secondary" className="ml-1">{needsProposal.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            These completed walkthroughs have scope data but no proposal yet. Click to generate.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {needsProposal.map((w) => {
              const scope = (w.scope_models as { extracted_json?: ScopeJson }[])?.[0]?.extracted_json;
              const clientName = w.opportunities?.clients?.name ?? scope?.customer?.company_name ?? 'Unknown Client';
              const siteName = w.locations?.name ?? w.sites?.name ?? scope?.site?.name ?? 'Site';
              const sqft = scope?.site?.square_footage;
              const confidence = (w.scope_models as { confidence?: number }[])?.[0]?.confidence;

              return (
                <Card key={w.id} className="hover:shadow-md transition-shadow border-amber-200/50 dark:border-amber-900/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary shrink-0" />
                          {clientName}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {siteName}
                        </p>
                      </div>
                      {confidence != null && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {Math.round(confidence * 100)}% scope
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {sqft && (
                        <div>
                          <span className="text-muted-foreground">Sq Ft</span>
                          <p className="font-medium">{sqft.toLocaleString()}</p>
                        </div>
                      )}
                      {scope?.service?.days_per_week && (
                        <div>
                          <span className="text-muted-foreground">Days/Week</span>
                          <p className="font-medium">{scope.service.days_per_week}</p>
                        </div>
                      )}
                      {scope?.pricing?.hourly_rate && (
                        <div>
                          <span className="text-muted-foreground">Hourly Rate</span>
                          <p className="font-medium">${scope.pricing.hourly_rate}</p>
                        </div>
                      )}
                      {scope?.pricing?.estimated_crew_size && (
                        <div>
                          <span className="text-muted-foreground">Crew Size</span>
                          <p className="font-medium">{scope.pricing.estimated_crew_size}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      Walked {formatDate(w.completed_at ?? w.scheduled_at)}
                    </div>
                    <Link href={`/app/walkthroughs/${w.id}`}>
                      <Button className="w-full gap-2" size="sm">
                        <Sparkles className="h-4 w-4" />
                        Generate Proposal
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">All Proposals</h2>
            {drafts.length > 0 && (
              <Badge variant="outline">{drafts.length} draft{drafts.length !== 1 ? 's' : ''}</Badge>
            )}
          </div>
        </div>

        {proposals && proposals.length > 0 ? (
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => {
                  const s = PROPOSAL_STATUS_MAP[p.status ?? 'draft'] ?? PROPOSAL_STATUS_MAP.draft;
                  const Icon = s.icon;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          {p.proposal_title || 'Untitled Proposal'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {p.total_amount != null ? `$${Number(p.total_amount).toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(p.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/app/bids/${p.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground mb-1">No proposals yet</p>
              <p className="text-sm text-muted-foreground">
                Complete a walkthrough to auto-generate your first proposal.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
