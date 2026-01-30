'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from 'lucide-react';
import type { PricingLineItem } from '@/components/sales/proposal-document';

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
• Insurance: Provider shall maintain commercial general liability and workers’ compensation insurance as required.
• Limitation of Liability: Except as required by law, liability shall not exceed the fees paid for the services in the twelve (12) months preceding the claim.`;
const DEFAULT_ACCEPTANCE = `Acceptance

By signing below, the Client agrees to the scope of work, contract terms, and pricing set forth in this proposal. This document, when signed by both parties, constitutes a binding agreement subject to the terms herein.

Client Signature: _________________________  Date: ___________

Printed Name: _________________________

Provider Signature: _________________________  Date: ___________`;

export default function ProposalEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposalTitle, setProposalTitle] = useState(DEFAULT_TITLE);
  const [coverIntro, setCoverIntro] = useState(DEFAULT_COVER);
  const [scopeOfWork, setScopeOfWork] = useState(DEFAULT_SCOPE);
  const [contractVerbiage, setContractVerbiage] = useState(DEFAULT_CONTRACT);
  const [acceptanceTerms, setAcceptanceTerms] = useState(DEFAULT_ACCEPTANCE);
  const [totalAmount, setTotalAmount] = useState('');
  const [validUntilDate, setValidUntilDate] = useState('');
  const [lineItems, setLineItems] = useState<PricingLineItem[]>([{ description: 'Monthly cleaning services', amount: 0 }]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: p } = await supabase.from('proposals').select('*').eq('id', id).single();
      if (p) {
        setProposalTitle(p.proposal_title || DEFAULT_TITLE);
        setCoverIntro(p.cover_intro || DEFAULT_COVER);
        setScopeOfWork(p.scope_of_work || DEFAULT_SCOPE);
        setContractVerbiage(p.contract_verbiage || DEFAULT_CONTRACT);
        setAcceptanceTerms(p.acceptance_terms || DEFAULT_ACCEPTANCE);
        setTotalAmount(p.total_amount != null ? String(p.total_amount) : '');
        setValidUntilDate(p.valid_until_date || '');
        const items = (p.pricing_line_items || []) as PricingLineItem[];
        setLineItems(items.length ? items : [{ description: 'Monthly cleaning services', amount: p.total_amount || 0 }]);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const addLineItem = () => setLineItems((prev) => [...prev, { description: '', amount: 0 }]);
  const removeLineItem = (i: number) => setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateLineItem = (i: number, field: keyof PricingLineItem, value: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const q = Number(next[i].quantity ?? 1);
        const up = Number(next[i].unit_price ?? 0);
        next[i].amount = Math.round(q * up * 100) / 100;
      }
      return next;
    });
  };

  const computedTotal = lineItems.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalToSave = totalAmount ? parseFloat(totalAmount) : computedTotal;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('proposals')
      .update({
        proposal_title: proposalTitle || null,
        cover_intro: coverIntro || null,
        scope_of_work: scopeOfWork || null,
        contract_verbiage: contractVerbiage || null,
        acceptance_terms: acceptanceTerms || null,
        pricing_line_items: lineItems,
        total_amount: totalToSave,
        valid_until_date: validUntilDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push(`/app/sales/proposals/${id}`);
    router.refresh();
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/sales/proposals/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customize Proposal</h1>
            <p className="text-gray-600 mt-1">Edit scope, contract terms, and pricing</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Page 1 – Cover</CardTitle>
          <CardDescription>Title and introduction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Proposal title</Label>
            <Input value={proposalTitle} onChange={(e) => setProposalTitle(e.target.value)} placeholder="Professional Cleaning Services Proposal" />
          </div>
          <div>
            <Label>Introduction</Label>
            <Textarea value={coverIntro} onChange={(e) => setCoverIntro(e.target.value)} rows={4} className="font-sans" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page 2 – Scope of Work</CardTitle>
          <CardDescription>Customize the scope description</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Scope of work</Label>
          <Textarea value={scopeOfWork} onChange={(e) => setScopeOfWork(e.target.value)} rows={14} className="mt-2 font-sans" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page 3 – Contract Terms</CardTitle>
          <CardDescription>Contract verbiage (terms and conditions)</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Contract terms</Label>
          <Textarea value={contractVerbiage} onChange={(e) => setContractVerbiage(e.target.value)} rows={14} className="mt-2 font-sans" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Page 4 – Pricing</CardTitle>
            <CardDescription>Line items and total</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add line
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {lineItems.map((item, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-12 items-end border rounded-lg p-3 bg-gray-50/50">
                <div className="sm:col-span-4">
                  <Label className="text-xs">Description</Label>
                  <Input
                    value={item.description}
                    onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                    placeholder="e.g. Monthly cleaning services"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    min={0}
                    value={item.quantity ?? ''}
                    onChange={(e) => updateLineItem(i, 'quantity', e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Unit</Label>
                  <Input value={item.unit ?? ''} onChange={(e) => updateLineItem(i, 'unit', e.target.value)} placeholder="mo" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs">Unit price</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.unit_price ?? ''}
                    onChange={(e) => updateLineItem(i, 'unit_price', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.amount ?? ''}
                    onChange={(e) => updateLineItem(i, 'amount', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeLineItem(i)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div>
              <Label>Total (monthly) – override if needed</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder={String(computedTotal)}
              />
            </div>
            <p className="text-sm text-gray-500">Computed from lines: ${computedTotal.toLocaleString()}</p>
          </div>
          <div>
            <Label>Valid until (optional)</Label>
            <Input type="date" value={validUntilDate} onChange={(e) => setValidUntilDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page 5 – Acceptance</CardTitle>
          <CardDescription>Signature and acceptance terms</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Acceptance terms</Label>
          <Textarea value={acceptanceTerms} onChange={(e) => setAcceptanceTerms(e.target.value)} rows={10} className="mt-2 font-sans" />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href={`/app/sales/proposals/${id}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
