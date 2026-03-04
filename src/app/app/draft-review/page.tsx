import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileSearch,
  Calendar,
  Video,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ArrowRight,
  Building2,
  User,
  DollarSign,
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils';

const REVIEW_FLOW_STEPS = [
  { step: 1, label: 'Sales Appointment', description: 'Walkthrough completed', icon: MapPin },
  { step: 2, label: 'Proposal Generated', description: 'AI builds the document', icon: FileSearch },
  { step: 3, label: 'Draft Review Scheduled', description: 'Set meeting with client', icon: Calendar },
  { step: 4, label: 'Present & Send', description: 'Walk through proposal, email it', icon: Send },
];

export default async function DraftReviewPage() {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: proposals } = await supabase
    .from('proposals')
    .select(`
      id, proposal_title, status, total_amount,
      lead_id, opportunity_id, sent_at, accepted_at,
      created_at, updated_at, valid_until_date,
      leads (contact_name, company, email, phone)
    `)
    .eq('org_id', org.org_id)
    .in('status', ['draft', 'sent'])
    .order('created_at', { ascending: false });

  const { data: appointments } = await supabase
    .from('walkthrough_appointments')
    .select('id, lead_id, scheduled_at, status, notes')
    .eq('org_id', org.org_id)
    .in('status', ['scheduled', 'completed'])
    .order('scheduled_at', { ascending: true });

  const appointmentsByLead = new Map<string, (typeof appointments extends (infer T)[] | null ? T : never)[]>();
  for (const apt of appointments ?? []) {
    if (apt.lead_id) {
      const existing = appointmentsByLead.get(apt.lead_id) ?? [];
      existing.push(apt);
      appointmentsByLead.set(apt.lead_id, existing);
    }
  }

  const drafts = (proposals ?? []).filter((p) => p.status === 'draft');
  const sent = (proposals ?? []).filter((p) => p.status === 'sent');

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const upcomingAppointments = (appointments ?? []).filter((a) => {
    if (!a.scheduled_at) return false;
    return a.scheduled_at.slice(0, 10) >= todayStr && a.status === 'scheduled';
  });

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Draft Review</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Schedule review meetings to present proposals to clients — in person or via Zoom.
          The final step of the sales appointment flows here.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REVIEW_FLOW_STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.step} className="relative">
              <Card className="h-full">
                <CardContent className="pt-4 pb-3 px-3 text-center space-y-1.5">
                  <div className="mx-auto w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-semibold">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{s.description}</p>
                </CardContent>
              </Card>
              {i < REVIEW_FLOW_STEPS.length - 1 && (
                <ArrowRight className="hidden md:block absolute top-1/2 -right-3 h-4 w-4 text-muted-foreground/40 -translate-y-1/2 z-10" />
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Upcoming Reviews</h2>
          </div>

          {upcomingAppointments.length > 0 ? (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 10).map((apt) => {
                const leadProposals = drafts.filter((p) => p.lead_id === apt.lead_id);
                return (
                  <Card key={apt.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {apt.notes || 'Draft Review Meeting'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 shrink-0" />
                            {formatDateTime(apt.scheduled_at)}
                          </div>
                          {leadProposals.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <FileSearch className="h-3 w-3 shrink-0" />
                              {leadProposals.length} proposal{leadProposals.length !== 1 ? 's' : ''} to present
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Video className="h-3 w-3" />
                            Zoom
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming review meetings</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Schedule a draft review from a proposal below
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Drafts Awaiting Review</h2>
              {drafts.length > 0 && <Badge variant="secondary">{drafts.length}</Badge>}
            </div>
          </div>

          {drafts.length > 0 ? (
            <div className="space-y-3">
              {drafts.map((p) => {
                const lead = p.leads as { contact_name?: string; company?: string; email?: string; phone?: string } | null;
                const clientName = lead?.company ?? lead?.contact_name ?? 'Unknown Client';
                const contactName = lead?.contact_name;
                const leadApts = p.lead_id ? appointmentsByLead.get(p.lead_id) : undefined;
                const nextApt = leadApts?.find((a) => a.status === 'scheduled' && a.scheduled_at && a.scheduled_at.slice(0, 10) >= todayStr);

                return (
                  <Card key={p.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="py-4 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary shrink-0" />
                            <p className="font-medium truncate">{clientName}</p>
                          </div>
                          {contactName && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {contactName}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground truncate">
                            {p.proposal_title || 'Untitled Proposal'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {p.total_amount != null && (
                              <span className="flex items-center gap-1 font-medium text-foreground">
                                <DollarSign className="h-3 w-3" />
                                {Number(p.total_amount).toLocaleString()}
                              </span>
                            )}
                            <span>Created {formatDate(p.created_at)}</span>
                          </div>
                          {nextApt && (
                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Review scheduled: {formatDateTime(nextApt.scheduled_at)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Link href={`/app/bids/${p.id}`}>
                            <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                              <FileSearch className="h-3 w-3" />
                              Review
                            </Button>
                          </Link>
                          <Button variant="default" size="sm" className="w-full text-xs gap-1">
                            <Send className="h-3 w-3" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No drafts awaiting review</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a proposal from the{' '}
                  <Link href="/app/proposals/build" className="text-primary hover:underline">
                    Proposal Builder
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {sent.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recently Sent
              </h3>
              {sent.slice(0, 5).map((p) => {
                const lead = p.leads as { contact_name?: string; company?: string } | null;
                return (
                  <Card key={p.id} className="opacity-80">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Send className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {lead?.company ?? lead?.contact_name ?? p.proposal_title ?? 'Proposal'}
                          </span>
                          {p.total_amount != null && (
                            <span className="text-sm text-muted-foreground">
                              ${Number(p.total_amount).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          Sent {formatDate(p.sent_at ?? p.updated_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
