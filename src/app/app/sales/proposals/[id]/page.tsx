import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Pencil, CheckCircle2, Clock, Send } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ProposalDocumentView } from '@/components/sales/proposal-document';
import type { ProposalDocumentData } from '@/components/sales/proposal-document';
import { ProposalActions } from '@/components/sales/proposal-actions';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700', icon: Send },
  accepted: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: null },
};

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from('proposals')
    .select(`
      *, 
      leads(full_name, company_name, email, phone)
    `)
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!proposal) notFound();

  const lead = proposal.leads as { 
    full_name?: string; 
    company_name?: string; 
    email?: string; 
    phone?: string;
  } | null;

  const documentData: ProposalDocumentData = {
    proposal_title: proposal.proposal_title ?? null,
    cover_intro: proposal.cover_intro ?? null,
    scope_of_work: proposal.scope_of_work ?? null,
    contract_verbiage: proposal.contract_verbiage ?? null,
    pricing_line_items: proposal.pricing_line_items ?? null,
    acceptance_terms: proposal.acceptance_terms ?? null,
    total_amount: proposal.total_amount != null ? Number(proposal.total_amount) : null,
    valid_until_date: proposal.valid_until_date ?? null,
    square_footage: proposal.square_footage != null ? Number(proposal.square_footage) : null,
    cleaning_frequency: proposal.cleaning_frequency ?? null,
    suggested_crew_size: proposal.suggested_crew_size ?? null,
    flooring_breakdown: proposal.flooring_breakdown ?? null,
    created_at: proposal.created_at,
    lead,
  };

  const status = statusConfig[proposal.status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <div className="min-h-screen bg-slate-100/60">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/app/sales">
              <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {proposal.proposal_title || 'Proposal'}
                </h1>
                <Badge className={status.color}>{status.label}</Badge>
              </div>
              <p className="text-slate-600 text-sm mt-0.5">
                {lead?.company_name || lead?.full_name || 'Lead'} · {formatDate(proposal.created_at)}
                {proposal.sent_at && (
                  <span className="ml-2 text-blue-600">
                    · Sent {formatDate(proposal.sent_at)}
                  </span>
                )}
                {proposal.accepted_at && (
                  <span className="ml-2 text-emerald-600">
                    · Signed {formatDate(proposal.accepted_at)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <ProposalActions 
            proposalId={id}
            proposalTitle={proposal.proposal_title}
            recipientEmail={lead?.email}
            recipientName={lead?.full_name || lead?.company_name}
            status={proposal.status}
          />
        </div>

        {/* Signature Info */}
        {proposal.status === 'accepted' && proposal.client_signer_name && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center gap-4">
            <div className="p-2 rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-emerald-900">Proposal Accepted</p>
              <p className="text-sm text-emerald-700">
                Signed by {proposal.client_signer_name} on {formatDate(proposal.client_signed_at)}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <ProposalDocumentView data={documentData} className="print:shadow-none" forPrint={false} />
        </div>

        <div className="print:hidden flex justify-end pt-2">
          <Link href={`/app/sales/proposals/${id}/edit`}>
            <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50">
              <Pencil className="h-4 w-4 mr-2" />
              Customize scope, contract, and pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
