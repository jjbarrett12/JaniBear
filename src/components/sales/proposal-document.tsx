'use client';

import { formatDate } from '@/lib/utils';

export interface PricingLineItem {
  description: string;
  quantity?: number;
  unit?: string;
  unit_price?: number;
  amount: number;
}

export interface ProposalDocumentData {
  proposal_title: string | null;
  cover_intro: string | null;
  scope_of_work: string | null;
  contract_verbiage: string | null;
  pricing_line_items: PricingLineItem[] | null;
  acceptance_terms: string | null;
  total_amount: number | null;
  valid_until_date: string | null;
  square_footage: number | null;
  cleaning_frequency: string | null;
  suggested_crew_size: number | null;
  flooring_breakdown: Array<{ type: string; sqft: number }> | null;
  created_at: string;
  lead?: { contact_name?: string; company?: string; email?: string; phone?: string } | null;
}

const DEFAULT_TITLE = 'Professional Cleaning Services Proposal';
const DEFAULT_COVER = 'Thank you for the opportunity to submit this proposal. We are pleased to present our recommended scope, terms, and pricing for your facility.';
const DEFAULT_SCOPE = `Scope of Work

• Routine cleaning of all common areas, restrooms, and designated spaces per the frequency outlined below.
• Vacuuming and/or mopping of all applicable flooring; carpet care and hard floor maintenance as specified.
• Restroom sanitization: toilets, urinals, sinks, mirrors, fixtures; restocking of consumables as agreed.
• Trash removal and liner replacement in all receptacles.
• Dusting of horizontal surfaces, ledges, and fixtures.
• Glass cleaning for interior doors and designated windows.
• Spot cleaning of walls and high-touch areas as needed.
• All labor, equipment, and standard supplies included unless otherwise noted.`;
const DEFAULT_CONTRACT = `Contract Terms

• Term: This agreement shall commence on the start date set forth in the Order and continue for the initial term specified, with renewal terms unless either party provides written notice of non-renewal.
• Services: Provider shall perform the services described in the Scope of Work and Pricing sections in a professional manner, in compliance with applicable laws and safety standards.
• Access: Client shall provide access to the premises at agreed times and ensure safe working conditions.
• Payment: Invoicing and payment terms as specified on the Pricing page. Late payments may incur fees as permitted by law.
• Termination: Either party may terminate for material breach upon written notice and cure period, or as otherwise set forth in the agreement.
• Insurance: Provider shall maintain commercial general liability and workers' compensation insurance as required.
• Limitation of Liability: Except as required by law, liability shall not exceed the fees paid for the services in the twelve (12) months preceding the claim.`;
const DEFAULT_ACCEPTANCE = `Acceptance

By signing below, the Client agrees to the scope of work, contract terms, and pricing set forth in this proposal. This document, when signed by both parties, constitutes a binding agreement subject to the terms herein.

Client Signature: _________________________  Date: ___________

Printed Name: _________________________

Provider Signature: _________________________  Date: ___________`;

interface ProposalDocumentViewProps {
  data: ProposalDocumentData;
  className?: string;
  forPrint?: boolean;
}

function SectionTitle({ number, title }: { number: number; title: string }) {
  return (
    <div className="mb-8">
      <span className="text-xs font-semibold tracking-[0.2em] uppercase text-primary/80">
        Section {number}
      </span>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800 border-b-2 border-primary/20 pb-2">
        {title}
      </h2>
    </div>
  );
}

function parseBulletContent(text: string) {
  const lines = text.trim().split('\n');
  const blocks: { type: 'paragraph' | 'bullet'; content: string }[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const bulletMatch = trimmed.match(/^[•\-*]\s+(.+)/);
    if (bulletMatch) {
      blocks.push({ type: 'bullet', content: bulletMatch[1] });
    } else {
      blocks.push({ type: 'paragraph', content: trimmed });
    }
  }
  return blocks;
}

export function ProposalDocumentView({ data, className = '', forPrint }: ProposalDocumentViewProps) {
  const title = data.proposal_title || DEFAULT_TITLE;
  const clientName = data.lead?.contact_name || data.lead?.company || 'Client';
  const company = data.lead?.company || '';
  const coverIntro = data.cover_intro || DEFAULT_COVER;
  const scope = data.scope_of_work || DEFAULT_SCOPE;
  const contract = data.contract_verbiage || DEFAULT_CONTRACT;
  const acceptance = data.acceptance_terms || DEFAULT_ACCEPTANCE;
  const lineItems = (data.pricing_line_items || []) as PricingLineItem[];
  const total = data.total_amount ?? (lineItems.length ? lineItems.reduce((s, i) => s + (i.amount || 0), 0) : 0);
  const validUntil = data.valid_until_date;

  const pageBase =
    'min-h-[70vh] bg-white rounded-xl overflow-hidden';
  const pagePadding = forPrint
    ? 'px-10 py-12 md:px-16 md:py-14'
    : 'px-8 py-10 md:px-14 md:py-12';
  const pageShadow = forPrint ? '' : 'shadow-lg shadow-slate-200/60 border border-slate-100';
  const pageClass = `${pageBase} ${pagePadding} ${pageShadow} break-after-page`;

  return (
    <div className={`proposal-document bg-slate-100/80 rounded-2xl overflow-hidden ${className}`}>
      <div className="space-y-6 md:space-y-8">
      {/* Page 1: Cover */}
      <section className={pageClass}>
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          <div className="flex justify-between items-start mb-12">
            <span className="text-[10px] font-medium tracking-[0.25em] uppercase text-slate-400">
              Proposal
            </span>
            <span className="text-xs text-slate-400 tabular-nums">
              {formatDate(data.created_at)}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-12 h-0.5 bg-primary rounded-full mb-6" aria-hidden />
            <h1 className="text-2xl md:text-3xl lg:text-[2rem] font-semibold text-slate-900 tracking-tight leading-tight max-w-xl">
              {title}
            </h1>
            <div className="mt-12 p-6 rounded-lg bg-slate-50/80 border border-slate-100">
              <p className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-3">
                Prepared for
              </p>
              <p className="text-lg font-semibold text-slate-900">{clientName}</p>
              {company && clientName !== company && (
                <p className="text-slate-600 mt-0.5">{company}</p>
              )}
            </div>
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-slate-600 leading-relaxed text-[15px]">
                {coverIntro}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Page 2: Scope of Work */}
      <section className={pageClass}>
        <div className="max-w-2xl mx-auto">
          <SectionTitle number={1} title="Scope of Work" />
          {(data.square_footage != null || data.cleaning_frequency || data.suggested_crew_size != null) && (
            <div className="mb-8 p-5 rounded-lg bg-slate-50 border-l-4 border-primary/40 space-y-2 text-sm text-slate-700">
              {data.square_footage != null && (
                <p><span className="font-medium text-slate-800">Square footage:</span> {Number(data.square_footage).toLocaleString()} sq ft</p>
              )}
              {data.cleaning_frequency && (
                <p><span className="font-medium text-slate-800">Cleaning frequency:</span> {data.cleaning_frequency} days per week</p>
              )}
              {data.suggested_crew_size != null && (
                <p><span className="font-medium text-slate-800">Crew size:</span> {data.suggested_crew_size} person(s)</p>
              )}
              {data.flooring_breakdown && Array.isArray(data.flooring_breakdown) && data.flooring_breakdown.length > 0 && (
                <p>
                  <span className="font-medium text-slate-800">Flooring:</span>{' '}
                  {(data.flooring_breakdown as Array<{ type: string; sqft: number }>).map(f => `${f.type} (${f.sqft.toLocaleString()} sq ft)`).join('; ')}
                </p>
              )}
            </div>
          )}
          <div className="space-y-3 text-slate-700 leading-relaxed text-[15px]">
            {parseBulletContent(scope).map((block, i) =>
              block.type === 'bullet' ? (
                <div key={i} className="flex gap-3">
                  <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/70" />
                  <span>{block.content}</span>
                </div>
              ) : (
                <p key={i} className="font-medium text-slate-800">{block.content}</p>
              )
            )}
          </div>
        </div>
      </section>

      {/* Page 3: Contract Terms */}
      <section className={pageClass}>
        <div className="max-w-2xl mx-auto">
          <SectionTitle number={2} title="Contract Terms" />
          <div className="space-y-3 text-slate-700 leading-relaxed text-[15px]">
            {parseBulletContent(contract).map((block, i) =>
              block.type === 'bullet' ? (
                <div key={i} className="flex gap-3">
                  <span className="text-primary mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/70" />
                  <span>{block.content}</span>
                </div>
              ) : (
                <p key={i} className="font-medium text-slate-800">{block.content}</p>
              )
            )}
          </div>
        </div>
      </section>

      {/* Page 4: Pricing */}
      <section className={pageClass}>
        <div className="max-w-2xl mx-auto">
          <SectionTitle number={3} title="Pricing" />
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="text-left py-4 px-5 font-semibold">Description</th>
                  <th className="text-right py-4 px-5 font-semibold w-20">Qty</th>
                  <th className="text-right py-4 px-5 font-semibold w-16">Unit</th>
                  <th className="text-right py-4 px-5 font-semibold w-28">Unit Price</th>
                  <th className="text-right py-4 px-5 font-semibold w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? (
                  lineItems.map((item, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                    >
                      <td className="py-4 px-5 text-slate-800">{item.description}</td>
                      <td className="py-4 px-5 text-right text-slate-600 tabular-nums">{item.quantity ?? '—'}</td>
                      <td className="py-4 px-5 text-right text-slate-600">{item.unit ?? '—'}</td>
                      <td className="py-4 px-5 text-right text-slate-600 tabular-nums">
                        {item.unit_price != null ? `$${Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                      </td>
                      <td className="py-4 px-5 text-right font-semibold text-slate-900 tabular-nums">
                        ${Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-slate-100">
                    <td className="py-4 px-5 text-slate-800">Monthly cleaning services (as described in Scope)</td>
                    <td className="py-4 px-5 text-right text-slate-500">—</td>
                    <td className="py-4 px-5 text-right text-slate-500">—</td>
                    <td className="py-4 px-5 text-right text-slate-500">—</td>
                    <td className="py-4 px-5 text-right font-semibold text-slate-900 tabular-nums">
                      ${Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex justify-end">
            <div className="min-w-[200px] rounded-lg bg-slate-800 px-6 py-4 text-right text-white">
              <p className="text-xs font-medium tracking-wider uppercase text-slate-300 mb-1">
                Total (monthly estimate)
              </p>
              <p className="text-2xl font-bold tabular-nums">
                ${Number(total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          {validUntil && (
            <p className="mt-6 text-xs text-slate-500">
              This proposal is valid until {formatDate(validUntil)}.
            </p>
          )}
        </div>
      </section>

      {/* Page 5: Acceptance */}
      <section className={pageClass}>
        <div className="max-w-2xl mx-auto">
          <SectionTitle number={4} title="Acceptance" />
          <div className="text-slate-700 leading-relaxed text-[15px] whitespace-pre-wrap font-[inherit]">
            {acceptance}
          </div>
          <div className="mt-10 pt-8 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              This document constitutes a formal proposal. Execution by both parties indicates acceptance of the terms herein.
            </p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
