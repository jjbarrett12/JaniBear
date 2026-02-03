'use client';

import Image from 'next/image';
import { Check, User, Wrench, DollarSign, Handshake } from 'lucide-react';

export function ProposalSampleStatic() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-2xl border border-zinc-700/60 bg-white shadow-2xl overflow-hidden text-left">
        {/* Header: Logo */}
        <div className="px-8 pt-6 pb-2 flex justify-start">
          <Image
            src="/janibear-logo.png"
            alt="JaniBear"
            width={200}
            height={68}
            className="h-10 w-auto object-contain bg-transparent"
            unoptimized
          />
        </div>

        {/* Banner: Commercial Cleaning Proposal */}
        <div className="mx-6 mt-2 h-14 rounded-lg bg-gradient-to-r from-blue-900 via-blue-700 to-emerald-600 flex items-center justify-center">
          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide uppercase">
            Commercial Cleaning Proposal
          </h3>
        </div>

        {/* Hero image placeholder */}
        <div className="mx-6 mt-4 h-40 md:h-52 rounded-lg bg-gradient-to-br from-slate-200 via-slate-100 to-zinc-200 flex items-center justify-center">
          <p className="text-slate-500 text-sm font-medium">Professional cleaning · Your branding</p>
        </div>

        {/* Two columns: Prepared For | Prepared By */}
        <div className="grid md:grid-cols-2 gap-6 px-8 py-6">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prepared For</p>
              <p className="font-bold text-slate-900">ABC Corporation</p>
              <p className="text-sm text-slate-600 mt-0.5">1234 Business Lane, Suite 200</p>
              <p className="text-sm text-slate-600">Cityville, State 12345</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prepared By</p>
              <div className="flex items-center gap-2">
                <Image src="/janibear-logo.png" alt="" width={80} height={28} className="h-5 w-auto" unoptimized />
              </div>
              <p className="text-sm text-slate-700 mt-1">John Smith, Account Manager</p>
              <p className="text-sm text-slate-600">info@janibear.com · www.janibear.com</p>
              <p className="text-sm text-slate-600">(555) 123-4567</p>
            </div>
          </div>
        </div>

        {/* Scope of Services + Pricing Summary */}
        <div className="grid md:grid-cols-2 gap-6 px-8 pb-6">
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-emerald-600 px-4 py-2.5 flex items-center gap-2">
              <Check className="h-4 w-4 text-white" />
              <span className="font-semibold text-white text-sm">Scope of Services</span>
            </div>
            <ul className="p-4 space-y-2 text-sm text-slate-700">
              {['Daily Office Cleaning', 'Carpet & Floor Care', 'Restroom Sanitization', 'Window Cleaning'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-orange-500 px-4 py-2.5 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-white" />
              <span className="font-semibold text-white text-sm">Pricing Summary</span>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-700">
                <span>Monthly Cleaning Cost</span>
                <span className="font-semibold">$3,200.00</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Additional Services</span>
                <span className="font-semibold">$500.00</span>
              </div>
              <div className="flex justify-between bg-blue-600 text-white px-3 py-2 rounded mt-2 -mx-1">
                <span className="font-semibold">Total Estimated Cost</span>
                <span className="font-bold">$3,700.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="px-8 pb-6">
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-blue-900 px-4 py-2.5 flex items-center gap-2">
              <Handshake className="h-4 w-4 text-white" />
              <span className="font-semibold text-white text-sm">Terms & Conditions</span>
            </div>
            <ul className="p-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                Contract Duration: 12 Months
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                Cancellation Policy: 30 Days Notice
              </li>
            </ul>
          </div>
        </div>

        {/* Signatures */}
        <div className="px-8 pb-6 grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-slate-600 mb-1">Client Signature: _________________________ Date: ________</p>
          </div>
          <div>
            <p className="text-slate-600 mb-1">JaniBear Representative: _________________________ Date: ________</p>
          </div>
        </div>

        {/* Footer strip */}
        <div className="h-2 bg-gradient-to-r from-blue-900 via-blue-700 to-orange-500" />
      </div>
      <p className="text-center text-sm text-zinc-500 mt-6">
        Branded to your company. Your template + our merge = one proposal per customer, in minutes.
      </p>
    </div>
  );
}
