import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, MapPin, Building2, User, Target, Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { SalesPageShell } from '@/components/sales/page-shell';
import { LeadDetailClient } from '@/components/sales/lead-detail-client';
import { LeadCadenceActions } from '@/components/sales/lead-cadence-actions';
import { LeadDetailQuickActions } from '@/components/sales/lead-detail-quick-actions';
import { LeadDetailCompanyPanel } from '@/components/sales/lead-detail-company-panel';
import { SALES_COPY } from '@/lib/sales-module-copy';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!lead) notFound();

  const [
    { data: appointments },
    { data: enrollment },
    { count: touchLogCount },
    { data: topTarget },
    { data: defaultTemplate },
    { data: accounts },
    { data: activities },
  ] = await Promise.all([
    supabase.from('walkthrough_appointments').select('*').eq('lead_id', id).order('scheduled_at', { ascending: true }),
    supabase.from('lead_cadence_enrollments').select('id, current_step, next_touch_at, status, template_id').eq('lead_id', id).maybeSingle(),
    supabase.from('lead_touch_log').select('*', { count: 'exact', head: true }).eq('lead_id', id),
    user ? supabase.from('top_targets').select('id, rank').eq('lead_id', id).eq('user_id', user.id).maybeSingle() : { data: null },
    supabase.from('sales_cadence_templates').select('id').eq('org_id', org.org_id).eq('is_default', true).limit(1).maybeSingle(),
    supabase.from('accounts').select('id, name').eq('org_id', org.org_id).order('name').limit(100),
    supabase.from('lead_activities').select('id, activity_type, subject, body, created_at').eq('lead_id', id).order('created_at', { ascending: false }).limit(20),
  ]);

  const enrollmentRow = enrollment ?? null;
  const touchCount = touchLogCount ?? 0;
  const isInTop10 = !!topTarget;
  const topTargetRank = topTarget?.rank ?? null;
  const defaultTemplateId = defaultTemplate?.id ?? null;
  const leadActivities = activities ?? [];
  const converted = !!(lead as { converted_opportunity_id?: string | null }).converted_opportunity_id;

  return (
    <SalesPageShell
      breadcrumb={
        <span className="text-muted-foreground">
          Sales / <Link href="/app/sales/leads" className="hover:text-foreground">Leads</Link>{' '}
          <span className="text-foreground/80">/ {lead.contact_name || lead.company || 'Lead'}</span>
        </span>
      }
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-6 space-y-5">
        {/* Sticky action bar: back, title, actions */}
        <div className="sticky top-0 z-10 -mx-4 -mt-5 px-4 pt-5 pb-3 bg-background/95 backdrop-blur border-b border-border sm:-mx-6 sm:px-6 sm:-mt-6 sm:pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/app/sales/leads">
                <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">{lead.contact_name || lead.company || 'Unnamed Lead'}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {lead.company && lead.contact_name ? lead.company : (lead as { source?: string }).source?.replace(/_/g, ' ') ?? ''} · {formatDate(lead.created_at)}
                </p>
              </div>
            </div>
            <LeadDetailQuickActions
              leadId={lead.id}
              converted={converted}
              accounts={(accounts ?? []).map((a) => ({ id: a.id, name: a.name }))}
              defaultAccountName={lead.company?.trim() || lead.contact_name?.trim() || ''}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-5 min-w-0">
            <Card className="rounded-xl border-border bg-card/90 dark:bg-card/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
              {lead.contact_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.contact_name}</span>
                </div>
              )}
              {lead.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
                </div>
              )}
              {(lead.address || lead.city) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{[lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}</span>
                </div>
              )}
              {(lead.notes || lead.raw_text) && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{lead.notes || lead.raw_text}</p>
                </div>
              )}
              </CardContent>
            </Card>

            <LeadDetailCompanyPanel lead={lead} />

            {leadActivities.length > 0 && (
              <Card className="rounded-xl border-border bg-card/90 dark:bg-card/90">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {leadActivities.map((a: { id: string; activity_type: string; subject?: string | null; created_at: string }) => (
                      <li key={a.id} className="flex gap-2 py-1">
                        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{formatDate(a.created_at)}</span>
                        <span className="capitalize">{a.activity_type.replace(/_/g, ' ')}</span>
                        {a.subject && <span className="text-muted-foreground truncate">· {a.subject}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <LeadCadenceActions
              leadId={lead.id}
              enrollment={enrollmentRow}
              touchLogCount={touchCount}
              isInTop10={isInTop10}
              topTargetRank={topTargetRank}
              defaultTemplateId={defaultTemplateId}
            />
          </div>

          {/* Right rail: qualification, next step, convert */}
          <aside className="space-y-5">
            <Card className="rounded-xl border-border bg-card/90 dark:bg-card/90">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="h-3.5 w-3.5" />
                  {SALES_COPY.leadDetail.qualification}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {(lead as { lead_score?: number | null }).lead_score != null && (
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="font-semibold tabular-nums text-foreground">{(lead as { lead_score: number }).lead_score}</span>
                  </p>
                )}
                {(lead as { qualification_score?: number | null }).qualification_score != null && (
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Qualification</span>
                    <span className="font-semibold tabular-nums">{(lead as { qualification_score: number }).qualification_score}</span>
                  </p>
                )}
                {(lead as { next_follow_up_at?: string | null }).next_follow_up_at && (
                  <p className="flex items-center gap-2 pt-1 border-t border-border">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{SALES_COPY.leadDetail.nextStep}:</span>
                    <span className="font-medium tabular-nums">{formatDate((lead as { next_follow_up_at: string }).next_follow_up_at)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
            <LeadDetailClient
              leadId={lead.id}
              leadStatus={lead.status}
              appointments={appointments || []}
            />
          </aside>
        </div>
      </div>
    </SalesPageShell>
  );
}
