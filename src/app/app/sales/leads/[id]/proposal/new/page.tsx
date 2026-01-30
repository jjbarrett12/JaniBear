'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Sparkles, Loader2, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function NewProposalPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [squareFootage, setSquareFootage] = useState('');
  const [flooringTypes, setFlooringTypes] = useState<Array<{ type: string; sqft: string }>>([{ type: '', sqft: '' }]);
  const [cleaningFrequency, setCleaningFrequency] = useState('5');
  const [restrooms, setRestrooms] = useState('');
  const [hourlyRate, setHourlyRate] = useState('25');
  const [notes, setNotes] = useState('');
  const [aiCrewSize, setAiCrewSize] = useState<number | null>(null);
  const [aiHoursPerVisit, setAiHoursPerVisit] = useState<number | null>(null);
  const [aiSpeed, setAiSpeed] = useState<number | null>(null);
  const [aiNotes, setAiNotes] = useState('');
  const [aiLaborEstimate, setAiLaborEstimate] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFlooring = () => setFlooringTypes((prev) => [...prev, { type: '', sqft: '' }]);
  const removeFlooring = (i: number) =>
    setFlooringTypes((prev) => prev.filter((_, idx) => idx !== i));
  const updateFlooring = (i: number, field: 'type' | 'sqft', value: string) =>
    setFlooringTypes((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });

  const totalSqft = flooringTypes.reduce((sum, f) => sum + (parseFloat(f.sqft) || 0), 0);
  const sqftNum = parseFloat(squareFootage) || totalSqft;

  const fetchAISuggestions = async () => {
    if (!sqftNum) return;
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/proposal-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          square_footage: sqftNum,
          flooring_breakdown: flooringTypes.filter((f) => f.type && f.sqft).map((f) => ({ type: f.type, sqft: parseFloat(f.sqft) || 0 })),
          cleaning_frequency: cleaningFrequency,
          restrooms: restrooms ? parseInt(restrooms, 10) : undefined,
          notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || res.statusText);
        return;
      }
      const data = await res.json();
      setAiCrewSize(data.suggested_crew_size ?? null);
      setAiHoursPerVisit(data.estimated_hours_per_visit ?? null);
      setAiSpeed(data.cleaning_speed_sqft_per_hour ?? null);
      setAiNotes(data.notes ?? '');
      setAiLaborEstimate(data.labor_estimate ?? null);
    } catch (e: any) {
      setError(e.message || 'Failed to get AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const crewSize = aiCrewSize ?? 1;
  const hoursPerVisit = aiHoursPerVisit ?? (sqftNum ? Math.ceil(sqftNum / 3000) : 0);
  const rate = parseFloat(hourlyRate) || 25;
  const laborPerVisit = hoursPerVisit * rate * crewSize;
  const daysPerWeek = parseInt(cleaningFrequency, 10) || 5;
  const monthlyLabor = laborPerVisit * daysPerWeek * 4.33;
  const totalAmount = Math.round(monthlyLabor * 100) / 100;

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not signed in.');
      setIsLoading(false);
      return;
    }
    const { data: membership } = await supabase.from('org_members').select('org_id').eq('user_id', user.id).single();
    if (!membership?.org_id) {
      setError('Organization not found.');
      setIsLoading(false);
      return;
    }
    const flooringBreakdown = flooringTypes.filter((f) => f.type && f.sqft).map((f) => ({ type: f.type, sqft: parseFloat(f.sqft) || 0 }));
    const defaultTitle = 'Professional Cleaning Services Proposal';
    const defaultCover = 'Thank you for the opportunity to submit this proposal. We are pleased to present our recommended scope, terms, and pricing for your facility.';
    const defaultScope = `Scope of Work\n\n• Routine cleaning of all common areas, restrooms, and designated spaces per the frequency outlined below.\n• Vacuuming and/or mopping of all applicable flooring; carpet care and hard floor maintenance as specified.\n• Restroom sanitization: toilets, urinals, sinks, mirrors, fixtures; restocking of consumables as agreed.\n• Trash removal and liner replacement in all receptacles.\n• Dusting of horizontal surfaces, ledges, and fixtures.\n• Glass cleaning for interior doors and designated windows.\n• Spot cleaning of walls and high-touch areas as needed.\n• All labor, equipment, and standard supplies included unless otherwise noted.`;
    const defaultContract = `Contract Terms\n\n• Term: This agreement shall commence on the start date set forth in the Order and continue for the initial term specified, with renewal terms unless either party provides written notice of non-renewal.\n• Services: Provider shall perform the services described in the Scope of Work and Pricing sections in a professional manner, in compliance with applicable laws and safety standards.\n• Access: Client shall provide access to the premises at agreed times and ensure safe working conditions.\n• Payment: Invoicing and payment terms as specified on the Pricing page. Late payments may incur fees as permitted by law.\n• Termination: Either party may terminate for material breach upon written notice and cure period, or as otherwise set forth in the agreement.\n• Insurance: Provider shall maintain commercial general liability and workers' compensation insurance as required.\n• Limitation of Liability: Except as required by law, liability shall not exceed the fees paid for the services in the twelve (12) months preceding the claim.`;
    const defaultAcceptance = `Acceptance\n\nBy signing below, the Client agrees to the scope of work, contract terms, and pricing set forth in this proposal. This document, when signed by both parties, constitutes a binding agreement subject to the terms herein.\n\nClient Signature: _________________________  Date: ___________\n\nPrinted Name: _________________________\n\nProvider Signature: _________________________  Date: ___________`;
    const pricingLineItems = [{ description: 'Monthly cleaning services (as described in Scope)', quantity: 1, unit: 'mo', unit_price: totalAmount, amount: totalAmount }];
    const { data: proposal, error: insertError } = await supabase
      .from('proposals')
      .insert({
        org_id: membership.org_id,
        lead_id: leadId,
        square_footage: sqftNum || null,
        flooring_breakdown: flooringBreakdown.length ? flooringBreakdown : null,
        cleaning_frequency: cleaningFrequency || null,
        suggested_crew_size: crewSize,
        ai_notes: aiNotes || null,
        total_amount: totalAmount,
        status: 'draft',
        proposal_title: defaultTitle,
        cover_intro: defaultCover,
        scope_of_work: defaultScope,
        contract_verbiage: defaultContract,
        acceptance_terms: defaultAcceptance,
        pricing_line_items: pricingLineItems,
      })
      .select('id')
      .single();
    setIsLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (proposal?.id) router.push(`/app/sales/proposals/${proposal.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/app/sales/leads/${leadId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Generate Proposal</h1>
          <p className="text-gray-600 mt-1">Square footage, flooring, cleaning frequency & AI suggestions</p>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-red-700">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Site details</CardTitle>
          <CardDescription>Enter square footage, flooring types, and frequency. Use AI to suggest crew size and hours.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Total square footage</Label>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={squareFootage}
                onChange={(e) => setSquareFootage(e.target.value)}
              />
            </div>
            <div>
              <Label>Cleaning frequency (days/week)</Label>
              <Input
                type="number"
                min={1}
                max={7}
                value={cleaningFrequency}
                onChange={(e) => setCleaningFrequency(e.target.value)}
              />
            </div>
            <div>
              <Label>Number of restrooms</Label>
              <Input type="number" min={0} value={restrooms} onChange={(e) => setRestrooms(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Hourly rate ($)</Label>
              <Input type="number" min={0} step={0.5} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Flooring breakdown (optional)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFlooring}>
                <Plus className="h-4 w-4 mr-2" />
                Add type
              </Button>
            </div>
            <div className="space-y-2">
              {flooringTypes.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder="e.g. Carpet"
                    value={f.type}
                    onChange={(e) => updateFlooring(i, 'type', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Sq ft"
                    value={f.sqft}
                    onChange={(e) => updateFlooring(i, 'sqft', e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFlooring(i)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
            {totalSqft > 0 && !squareFootage && <p className="text-xs text-gray-500">Total from flooring: {totalSqft} sq ft</p>}
          </div>

          <div>
            <Label>Notes (for AI)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special requirements, flooring types, access hours..." rows={2} />
          </div>

          <Button variant="outline" onClick={fetchAISuggestions} disabled={aiLoading || !sqftNum}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Get AI suggestions (crew size, hours, cleaning speed)
          </Button>

          {(aiCrewSize != null || aiNotes) && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {aiCrewSize != null && <p><strong>Crew size:</strong> {aiCrewSize}</p>}
                {aiHoursPerVisit != null && <p><strong>Hours per visit:</strong> {aiHoursPerVisit}</p>}
                {aiSpeed != null && <p><strong>Cleaning speed:</strong> {aiSpeed} sq ft/hour</p>}
                {aiLaborEstimate != null && <p><strong>Labor estimate:</strong> ${aiLaborEstimate.toLocaleString()}/mo</p>}
                {aiNotes && <p className="text-gray-600">{aiNotes}</p>}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Proposal summary</CardTitle>
          <CardDescription>Based on your formulas and AI suggestions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Crew size:</strong> {crewSize}</p>
          <p><strong>Hours per visit:</strong> {hoursPerVisit}</p>
          <p><strong>Labor per visit:</strong> ${laborPerVisit.toFixed(2)}</p>
          <p><strong>Monthly total (est.):</strong> ${totalAmount.toLocaleString()}</p>
          <div className="pt-4">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save proposal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
