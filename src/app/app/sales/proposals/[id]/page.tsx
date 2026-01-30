import { createClient } from '@/lib/supabase/server';
import { requireOrg } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Pencil, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ProposalDocumentView } from '@/components/sales/proposal-document';
import type { ProposalDocumentData } from '@/components/sales/proposal-document';

export default async function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from('proposals')
    .select('*, leads(contact_name, company, email, phone)')
    .eq('id', id)
    .eq('org_id', org.org_id)
    .single();

  if (!proposal) notFound();

  const lead = proposal.leads as { contact_name?: string; company?: string; email?: string; phone?: string } | null;

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

  return (
    <div className="min-h-screen bg-slate-100/60">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/app/sales/leads/${proposal.lead_id}`}>
              <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Proposal
              </h1>
              <p className="text-slate-600 text-sm mt-0.5">
                {lead?.contact_name || lead?.company || 'Lead'} · {formatDate(proposal.created_at)}
                {proposal.status && (
                  <span className="ml-2 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-200/80 text-slate-700 capitalize">
                    {proposal.status}
                  </span>
                )}
              </p>
            </div>
          </div>
          <ProposalActions proposalId={id} />
        </div>

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
