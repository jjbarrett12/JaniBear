import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AcceptProposalForm } from '@/components/proposals/accept-proposal-form';
import { CheckCircle2, FileText, DollarSign, Calendar, Building2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// Public route - no auth required
export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = await params;
  const supabase = await createClient();

  // Fetch proposal by public token
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      leads (full_name, company_name, email, phone)
    `)
    .eq('id', id)
    .eq('public_token', token)
    .single();

  if (error || !proposal) {
    notFound();
  }

  const lead = proposal.leads as {
    full_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
  } | null;

  const signedAt = proposal.client_signed_at as string | null;
  const signerName = proposal.client_signer_name as string | null;

  // Parse pricing line items
  const pricingItems = (proposal.pricing_line_items as Array<{
    description: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    total: number;
  }>) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8" />
            <span className="text-lg font-semibold opacity-90">Service Proposal</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            {proposal.proposal_title || 'Janitorial Services Proposal'}
          </h1>
          <p className="mt-2 opacity-90 text-lg">
            Prepared for {lead?.company_name || lead?.full_name || 'Customer'}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Quick Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {proposal.square_footage && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Square Footage</p>
                  <p className="font-semibold">{proposal.square_footage.toLocaleString()} sq ft</p>
                </div>
              </div>
            </div>
          )}
          {proposal.cleaning_frequency && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-100">
                  <Calendar className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Service Frequency</p>
                  <p className="font-semibold">{proposal.cleaning_frequency}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 shadow-sm border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-emerald-600">Monthly Investment</p>
                <p className="font-bold text-emerald-700 text-xl">
                  {formatCurrency(proposal.total_amount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cover Intro */}
        {proposal.cover_intro && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <p className="text-slate-700 leading-relaxed">{proposal.cover_intro}</p>
          </div>
        )}

        {/* Scope of Work */}
        {proposal.scope_of_work && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Scope of Work</h2>
            <div className="prose prose-slate max-w-none">
              {proposal.scope_of_work.split('\n').map((line: string, i: number) => {
                if (line.startsWith('## ')) {
                  return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('### ')) {
                  return <h4 key={i} className="text-base font-semibold mt-3 mb-2">{line.replace('### ', '')}</h4>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4 text-slate-700">{line.replace('- ', '')}</li>;
                }
                if (line.trim()) {
                  return <p key={i} className="text-slate-700 mb-2">{line}</p>;
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Pricing</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {pricingItems.map((item, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-3 px-4 text-slate-700">{item.description}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50">
                  <td className="py-4 px-4 font-bold text-slate-900">Monthly Total</td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-600 text-xl">
                    {formatCurrency(proposal.total_amount || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Contract Terms */}
        {proposal.contract_verbiage && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Terms & Conditions</h2>
            <div className="prose prose-slate prose-sm max-w-none">
              {proposal.contract_verbiage.split('\n').map((line: string, i: number) => {
                if (line.startsWith('## ')) {
                  return <h3 key={i} className="text-base font-semibold mt-4 mb-2">{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('### ')) {
                  return <h4 key={i} className="text-sm font-semibold mt-3 mb-2">{line.replace('### ', '')}</h4>;
                }
                if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4 text-sm text-slate-600">{line.replace('- ', '')}</li>;
                }
                if (line.trim()) {
                  return <p key={i} className="text-sm text-slate-600 mb-2">{line}</p>;
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Signature Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Acceptance & Signature</h2>
          
          {proposal.acceptance_terms && (
            <p className="text-slate-600 text-sm mb-6">{proposal.acceptance_terms}</p>
          )}

          {signedAt ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-emerald-800">
                    This proposal has been accepted
                  </h3>
                  <p className="text-emerald-700 text-sm mt-1">
                    Signed by {signerName || 'Client'} on{' '}
                    {new Date(signedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  {proposal.client_signature_data && (
                    <div className="mt-4 p-3 bg-white rounded border border-emerald-100 inline-block">
                      <p className="text-xs text-slate-500 mb-2">Signature on file</p>
                      <img
                        src={proposal.client_signature_data}
                        alt="Signature"
                        className="h-16 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <AcceptProposalForm token={token} />
          )}
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-500 text-sm py-6">
          <p>This proposal was sent via JANIBEAR</p>
          {proposal.valid_until_date && (
            <p className="mt-1">
              Valid until {formatDate(proposal.valid_until_date)}
            </p>
          )}
        </footer>
      </div>
    </div>
  );
}
