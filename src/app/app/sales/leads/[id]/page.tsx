import { createClient } from '@/lib/supabase/server';
import { requireOrg, getCurrentUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail, Phone, MapPin, Building2, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { LeadDetailClient } from '@/components/sales/lead-detail-client';
import { LeadCadenceActions } from '@/components/sales/lead-cadence-actions';
import { ConvertLeadToOpportunityModal } from '@/components/sales/convert-lead-to-opportunity-modal';

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
  ] = await Promise.all([
    supabase.from('walkthrough_appointments').select('*').eq('lead_id', id).order('scheduled_at', { ascending: true }),
    supabase.from('lead_cadence_enrollments').select('id, current_step, next_touch_at, status, template_id').eq('lead_id', id).maybeSingle(),
    supabase.from('lead_touch_log').select('*', { count: 'exact', head: true }).eq('lead_id', id),
    user ? supabase.from('top_targets').select('id, rank').eq('lead_id', id).eq('user_id', user.id).maybeSingle() : { data: null },
    supabase.from('sales_cadence_templates').select('id').eq('org_id', org.org_id).eq('is_default', true).limit(1).maybeSingle(),
    supabase.from('accounts').select('id, name').eq('org_id', org.org_id).order('name').limit(100),
  ]);

  const enrollmentRow = enrollment ?? null;
  const touchCount = touchLogCount ?? 0;
  const isInTop10 = !!topTarget;
  const topTargetRank = topTarget?.rank ?? null;
  const defaultTemplateId = defaultTemplate?.id ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/app/sales/leads">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{lead.contact_name || lead.company || 'Unnamed Lead'}</h1>
            <p className="text-gray-600 mt-1">
              {lead.company && lead.contact_name ? lead.company : lead.source} • {formatDate(lead.created_at)}
            </p>
          </div>
        </div>
        {!(lead as { converted_opportunity_id?: string | null }).converted_opportunity_id && (
          <ConvertLeadToOpportunityModal
            leadId={lead.id}
            defaultAccountName={lead.company?.trim() || lead.contact_name?.trim() || ''}
            accounts={(accounts ?? []).map((a) => ({ id: a.id, name: a.name }))}
          />
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lead.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span>{lead.contact_name}</span>
              </div>
            )}
            {lead.company && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>{lead.company}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
              </div>
            )}
            {(lead.address || lead.city) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{[lead.address, lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}</span>
              </div>
            )}
            {lead.raw_text && (
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-500 mb-1">Raw / notes</p>
                <p className="text-sm whitespace-pre-wrap">{lead.raw_text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <LeadDetailClient
          leadId={lead.id}
          leadStatus={lead.status}
          appointments={appointments || []}
        />
      </div>

      <LeadCadenceActions
        leadId={lead.id}
        enrollment={enrollmentRow}
        touchLogCount={touchCount}
        isInTop10={isInTop10}
        topTargetRank={topTargetRank}
        defaultTemplateId={defaultTemplateId}
      />
    </div>
  );
}
