'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Merge } from 'lucide-react';

const PAGE_HEIGHT = 420;
const SCROLL_INTERVAL_MS = 4500;
const TOTAL_PAGES = 8;

export function ProposalSampleScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const id = setInterval(() => {
      setPage((p) => {
        const next = p + 1 >= TOTAL_PAGES ? 0 : p + 1;
        el.scrollTo({ top: next * PAGE_HEIGHT, behavior: 'smooth' });
        return next;
      });
    }, SCROLL_INTERVAL_MS);

    return () => clearInterval(id);
  }, []);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / PAGE_HEIGHT);
    setPage(Math.min(index, TOTAL_PAGES - 1));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Callout: custom template + merge */}
      <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Merge className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-white">Custom proposal template</span>
        </div>
        <p className="text-sm text-zinc-400 w-full md:w-auto md:flex-1">
          Insert your own template into the Proposal Builder. We merge in customer name, scope, pricing, and dates for every bid—one template, any customer.
        </p>
      </div>

      {/* Document frame + auto-scroll label */}
      <div className="relative rounded-2xl border border-zinc-700/60 bg-zinc-800/40 shadow-2xl overflow-hidden">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/95 border border-zinc-600/50 text-xs text-zinc-400">
          <FileText className="h-3.5 w-3.5" />
          <span>Sample proposal · auto-scrolling</span>
        </div>

        <div
          ref={containerRef}
          onScroll={onScroll}
          className="overflow-y-auto overflow-x-hidden scroll-smooth h-[420px] snap-y snap-mandatory hide-scrollbar"
          style={{ scrollSnapType: 'y mandatory' }}
        >
          {/* Page 1: Cover */}
          <section
            className="min-h-[420px] snap-start snap-always flex flex-col bg-white text-left px-8 md:px-12 py-10 border-b border-zinc-200"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">Proposal</span>
              <span className="text-xs text-slate-400">Valid through March 15, 2026</span>
            </div>
            <div className="flex-1 flex flex-col justify-center mt-4">
              <div className="w-14 h-0.5 bg-emerald-500 rounded-full mb-6" />
              <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                Professional Cleaning Services Proposal
              </h3>
              <div className="mt-10 p-5 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-xs font-medium tracking-wider uppercase text-slate-500 mb-2">Prepared for</p>
                <p className="text-lg font-semibold text-slate-900">Acme Corporation</p>
                <p className="text-slate-600 text-sm mt-0.5">123 Main Street · Suite 400</p>
              </div>
              <p className="mt-8 text-slate-600 text-[15px] leading-relaxed">
                Thank you for the opportunity to submit this proposal. We are pleased to present our recommended scope, terms, and pricing for your facility.
              </p>
            </div>
          </section>

          {/* Page 2: Scope of Work */}
          <section
            className="min-h-[420px] snap-start snap-always bg-white text-left px-8 md:px-12 py-10 border-b border-zinc-200"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">Section 1</p>
            <h4 className="text-xl font-semibold text-slate-800 border-b-2 border-emerald-500/20 pb-2 mb-6">Scope of Work</h4>
            <div className="mb-6 p-4 rounded-lg bg-slate-50 border-l-4 border-emerald-500/40 text-sm text-slate-700 space-y-1">
              <p><span className="font-medium text-slate-800">Square footage:</span> 13,200 sq ft</p>
              <p><span className="font-medium text-slate-800">Cleaning frequency:</span> 5 days per week</p>
              <p><span className="font-medium text-slate-800">Crew size:</span> 2 person(s)</p>
            </div>
            <ul className="text-sm text-slate-700 space-y-2">
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Routine cleaning of all common areas, restrooms, and designated spaces.</li>
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Vacuuming and mopping of all applicable flooring.</li>
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Restroom sanitization and restocking of consumables.</li>
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Trash removal, dusting, and glass cleaning.</li>
            </ul>
          </section>

          {/* Page 3: Area Schedule Table */}
          <section
            className="min-h-[420px] snap-start snap-always bg-white text-left px-8 md:px-12 py-10 border-b border-zinc-200"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">Section 1 (continued)</p>
            <h4 className="text-xl font-semibold text-slate-800 border-b-2 border-emerald-500/20 pb-2 mb-6">Area Schedule</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left py-3 px-4 font-semibold">Area</th>
                    <th className="text-right py-3 px-4 font-semibold">Sq Ft</th>
                    <th className="text-left py-3 px-4 font-semibold">Floor Type</th>
                    <th className="text-right py-3 px-4 font-semibold">Frequency</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-100"><td className="py-2.5 px-4">Lobby & corridors</td><td className="py-2.5 px-4 text-right">4,200</td><td className="py-2.5 px-4">Tile / LVT</td><td className="py-2.5 px-4 text-right">5×/week</td></tr>
                  <tr className="border-b border-slate-100 bg-slate-50/50"><td className="py-2.5 px-4">Restrooms (4)</td><td className="py-2.5 px-4 text-right">—</td><td className="py-2.5 px-4">Tile</td><td className="py-2.5 px-4 text-right">5×/week</td></tr>
                  <tr className="border-b border-slate-100"><td className="py-2.5 px-4">Office areas</td><td className="py-2.5 px-4 text-right">8,400</td><td className="py-2.5 px-4">Carpet</td><td className="py-2.5 px-4 text-right">2×/week</td></tr>
                  <tr className="border-b border-slate-100 bg-slate-50/50"><td className="py-2.5 px-4">Break room</td><td className="py-2.5 px-4 text-right">600</td><td className="py-2.5 px-4">Tile</td><td className="py-2.5 px-4 text-right">5×/week</td></tr>
                  <tr><td className="py-2.5 px-4">Entry glass</td><td className="py-2.5 px-4 text-right">—</td><td className="py-2.5 px-4">Glass</td><td className="py-2.5 px-4 text-right">2×/week</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 mt-4">All labor, equipment, and standard supplies included unless otherwise noted.</p>
          </section>

          {/* Page 4: Contract Terms */}
          <section
            className="min-h-[420px] snap-start snap-always bg-white text-left px-8 md:px-12 py-10 border-b border-zinc-200"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">Section 2</p>
            <h4 className="text-xl font-semibold text-slate-800 border-b-2 border-emerald-500/20 pb-2 mb-6">Contract Terms</h4>
            <ul className="text-sm text-slate-700 space-y-2">
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Term: Commence on start date; renewal unless either party provides written notice.</li>
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Services: Performed in a professional manner, in compliance with applicable laws.</li>
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Access: Client shall provide access at agreed times and ensure safe working conditions.</li>
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Payment: Invoicing and payment terms as specified. Late payments may incur fees.</li>
              <li className="flex gap-2"><span className="text-emerald-500 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500/70" />Insurance: Provider maintains commercial general liability and workers&apos; compensation.</li>
            </ul>
          </section>

          {/* Page 5: Pricing */}
          <section
            className="min-h-[420px] snap-start snap-always bg-white text-left px-8 md:px-12 py-10 border-b border-zinc-200"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">Section 3</p>
            <h4 className="text-xl font-semibold text-slate-800 border-b-2 border-emerald-500/20 pb-2 mb-6">Pricing</h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-right py-3 px-4 font-semibold">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold">Unit</th>
                    <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  <tr className="border-b border-slate-100"><td className="py-3 px-4">Recurring cleaning — common areas</td><td className="py-3 px-4 text-right">1</td><td className="py-3 px-4 text-right">mo</td><td className="py-3 px-4 text-right">$1,847.00</td><td className="py-3 px-4 text-right font-semibold">$1,847.00</td></tr>
                  <tr className="border-b border-slate-100 bg-slate-50/50"><td className="py-3 px-4">Restroom & break room service</td><td className="py-3 px-4 text-right">1</td><td className="py-3 px-4 text-right">mo</td><td className="py-3 px-4 text-right">$620.00</td><td className="py-3 px-4 text-right font-semibold">$620.00</td></tr>
                  <tr><td className="py-3 px-4">Office carpet care (2×/week)</td><td className="py-3 px-4 text-right">1</td><td className="py-3 px-4 text-right">mo</td><td className="py-3 px-4 text-right">$380.00</td><td className="py-3 px-4 text-right font-semibold">$380.00</td></tr>
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="min-w-[200px] rounded-lg bg-slate-800 px-6 py-4 text-right text-white">
                <p className="text-xs font-medium tracking-wider uppercase text-slate-300 mb-1">Total (monthly estimate)</p>
                <p className="text-2xl font-bold tabular-nums">$2,847.00</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">This proposal is valid until March 15, 2026. Billed monthly. No long-term contract required.</p>
          </section>

          {/* Page 6: Assumptions & Exclusions */}
          <section
            className="min-h-[420px] snap-start snap-always bg-white text-left px-8 md:px-12 py-10 border-b border-zinc-200"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">Section 4</p>
            <h4 className="text-xl font-semibold text-slate-800 border-b-2 border-emerald-500/20 pb-2 mb-6">Assumptions & Exclusions</h4>
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="font-medium text-slate-800 mb-1">Assumptions</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Square footage as provided by client; subject to site confirmation.</li>
                  <li>Pricing based on standard frequencies and access during agreed hours.</li>
                  <li>Standard supplies (paper, soap, liners) included; specialty products may be quoted separately.</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-slate-800 mb-1">Exclusions</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Carpet extraction, strip & wax, window washing (exterior).</li>
                  <li>Hazardous waste, biohazard cleanup, or specialty disinfecting beyond routine.</li>
                  <li>Repairs or maintenance of client-owned equipment.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Page 7: Acceptance */}
          <section
            className="min-h-[420px] snap-start snap-always bg-white text-left px-8 md:px-12 py-10 border-b border-zinc-200"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">Section 5</p>
            <h4 className="text-xl font-semibold text-slate-800 border-b-2 border-emerald-500/20 pb-2 mb-6">Acceptance</h4>
            <p className="text-sm text-slate-700 leading-relaxed mb-6">
              By signing below, the Client agrees to the scope of work, contract terms, and pricing set forth in this proposal. This document, when signed by both parties, constitutes a binding agreement.
            </p>
            <div className="space-y-6 text-sm">
              <div><p className="text-slate-500 mb-1">Client Signature</p><div className="border-b border-slate-300 h-8" /></div>
              <div><p className="text-slate-500 mb-1">Printed Name</p><div className="border-b border-slate-300 h-8" /></div>
              <div><p className="text-slate-500 mb-1">Date</p><div className="border-b border-slate-300 h-8 w-32" /></div>
              <div className="pt-4"><p className="text-slate-500 mb-1">Provider Signature</p><div className="border-b border-slate-300 h-8" /></div>
            </div>
          </section>

          {/* Page 8: Contact / Footer */}
          <section
            className="min-h-[420px] snap-start snap-always bg-white text-left px-8 md:px-12 py-10"
            style={{ minHeight: PAGE_HEIGHT }}
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-slate-400 mb-1">Contact</p>
            <h4 className="text-xl font-semibold text-slate-800 border-b-2 border-emerald-500/20 pb-2 mb-6">Thank You</h4>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
              We look forward to serving you. Questions about this proposal? Reach out anytime.
            </p>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
              <p className="font-semibold text-slate-900">[Your Company Name]</p>
              <p className="text-sm text-slate-600 mt-1">(555) 123-4567 · contact@yourcompany.com</p>
              <p className="text-xs text-slate-500 mt-3">This document constitutes a formal proposal. Execution by both parties indicates acceptance of the terms herein.</p>
            </div>
          </section>
        </div>

        {/* Page indicators */}
        <div className="flex items-center justify-center gap-1.5 py-4 bg-zinc-800/60 border-t border-zinc-700/50">
          {Array.from({ length: TOTAL_PAGES }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Page ${i + 1}`}
              onClick={() => {
                containerRef.current?.scrollTo({ top: i * PAGE_HEIGHT, behavior: 'smooth' });
                setPage(i);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === page ? 'bg-emerald-500 scale-125' : 'bg-zinc-500 hover:bg-zinc-400'
              }`}
            />
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-zinc-500 mt-6">
        Branded to your company. Your template + our merge = one proposal per customer, in minutes.
      </p>
    </div>
  );
}
