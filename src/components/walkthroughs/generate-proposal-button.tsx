'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface ScopeData {
  site?: {
    name?: string;
    address?: string;
    square_footage?: number;
    flooring?: { hard_surface?: number; carpet?: number; tile?: number };
    restroom_count?: number;
  };
  service?: {
    days_per_week?: number;
    time_of_day?: string;
    special_requirements?: string;
  };
  pricing?: {
    hourly_rate?: number;
    estimated_crew_size?: number;
    estimated_hours?: number;
  };
  customer?: {
    company_name?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
  };
  salesperson?: {
    name?: string;
    user_id?: string;
  };
}

interface GenerateProposalButtonProps {
  walkthroughId: string;
  opportunityId: string;
  scopeData: ScopeData | null;
  orgId: string;
}

export function GenerateProposalButton({ 
  walkthroughId, 
  opportunityId, 
  scopeData,
  orgId 
}: GenerateProposalButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateProposal = async () => {
    if (!scopeData) {
      alert('No scope data available. Please complete the walkthrough first.');
      return;
    }

    setIsGenerating(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Calculate pricing
      const hourlyRate = scopeData.pricing?.hourly_rate || 25;
      const crewSize = scopeData.pricing?.estimated_crew_size || 2;
      const hoursPerVisit = scopeData.pricing?.estimated_hours || 2;
      const daysPerWeek = scopeData.service?.days_per_week || 5;
      const monthlyAmount = hourlyRate * crewSize * hoursPerVisit * daysPerWeek * 4.33;

      // Generate default scope of work
      const scopeOfWork = generateScopeOfWork(scopeData);
      
      // Generate pricing line items
      const pricingLineItems = [
        {
          description: `Janitorial Services (${daysPerWeek}x per week)`,
          quantity: 1,
          unit: 'month',
          unitPrice: monthlyAmount,
          total: monthlyAmount,
        }
      ];

      // Create the proposal
      const { data: proposal, error } = await supabase
        .from('proposals')
        .insert({
          org_id: orgId,
          opportunity_id: opportunityId,
          proposal_title: `Janitorial Services Proposal - ${scopeData.customer?.company_name || 'Client'}`,
          cover_intro: `Thank you for the opportunity to present our proposal for janitorial services at your ${scopeData.site?.square_footage?.toLocaleString() || ''} square foot facility. We are committed to providing exceptional cleaning services that meet your specific needs.`,
          scope_of_work: scopeOfWork,
          contract_verbiage: getDefaultContractTerms(),
          pricing_line_items: pricingLineItems,
          acceptance_terms: getDefaultAcceptanceTerms(),
          total_amount: monthlyAmount,
          status: 'draft',
          square_footage: scopeData.site?.square_footage,
          flooring_breakdown: scopeData.site?.flooring,
          cleaning_frequency: `${daysPerWeek}x per week, ${scopeData.service?.time_of_day || 'evening'}`,
          suggested_crew_size: crewSize,
          ai_notes: scopeData.service?.special_requirements,
          scope_json: scopeData,
          pricing_json: {
            hourly_rate: hourlyRate,
            crew_size: crewSize,
            hours_per_visit: hoursPerVisit,
            days_per_week: daysPerWeek,
            monthly_total: monthlyAmount,
          },
          created_by: user.id,
          version: 1,
        })
        .select()
        .single();

      if (error) throw error;

      // Create a lead record if needed
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .single();

      if (!existingLead && scopeData.customer) {
        await supabase.from('leads').insert({
          org_id: orgId,
          full_name: scopeData.customer.contact_name || scopeData.customer.company_name,
          company_name: scopeData.customer.company_name,
          email: scopeData.customer.contact_email,
          phone: scopeData.customer.contact_phone,
          status: 'proposal_sent',
          opportunity_id: opportunityId,
          created_by: user.id,
        });
      }

      // Navigate to the proposal
      router.push(`/app/sales/proposals/${proposal.id}`);
    } catch (err) {
      console.error('Failed to generate proposal:', err);
      alert('Failed to generate proposal. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={generateProposal} disabled={isGenerating || !scopeData}>
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Proposal
        </>
      )}
    </Button>
  );
}

function generateScopeOfWork(scope: ScopeData): string {
  const parts: string[] = [];
  
  parts.push(`## Daily Cleaning Services\n`);
  parts.push(`Our professional cleaning team will provide comprehensive janitorial services ${scope.service?.days_per_week || 5} days per week during ${scope.service?.time_of_day || 'evening'} hours.\n`);
  
  parts.push(`### General Cleaning\n`);
  parts.push(`- Empty all trash receptacles and replace liners`);
  parts.push(`- Dust all horizontal surfaces, desks, and furniture`);
  parts.push(`- Vacuum all carpeted areas (${scope.site?.flooring?.carpet?.toLocaleString() || 0} sq ft)`);
  parts.push(`- Mop and sanitize hard surface floors (${scope.site?.flooring?.hard_surface?.toLocaleString() || 0} sq ft)`);
  parts.push(`- Clean and sanitize all glass entry doors`);
  parts.push(`- Spot clean walls and light switches\n`);
  
  if (scope.site?.restroom_count && scope.site.restroom_count > 0) {
    parts.push(`### Restroom Cleaning (${scope.site.restroom_count} restrooms)\n`);
    parts.push(`- Clean and sanitize all toilets, urinals, and sinks`);
    parts.push(`- Clean and polish mirrors and chrome fixtures`);
    parts.push(`- Refill paper products and soap dispensers`);
    parts.push(`- Mop and sanitize floors`);
    parts.push(`- Empty trash and sanitary receptacles\n`);
  }
  
  parts.push(`### Break Room / Kitchen Areas\n`);
  parts.push(`- Clean and sanitize countertops and tables`);
  parts.push(`- Clean exterior of appliances`);
  parts.push(`- Empty trash receptacles`);
  parts.push(`- Mop floors\n`);
  
  if (scope.service?.special_requirements) {
    parts.push(`### Special Requirements\n`);
    parts.push(scope.service.special_requirements);
  }
  
  return parts.join('\n');
}

function getDefaultContractTerms(): string {
  return `## Terms and Conditions

### Service Agreement
This proposal, upon acceptance, constitutes a service agreement between the parties for the janitorial services described herein.

### Payment Terms
- Payment is due within 30 days of invoice date
- Services are billed monthly in advance
- A late fee of 1.5% per month applies to overdue balances

### Service Guarantee
We guarantee your satisfaction with our services. If you are not completely satisfied, we will re-clean the affected areas at no additional charge.

### Insurance and Bonding
Our company maintains comprehensive general liability insurance and is fully bonded for your protection.

### Termination
Either party may terminate this agreement with 30 days written notice.`;
}

function getDefaultAcceptanceTerms(): string {
  return `By signing below, I accept this proposal and authorize the commencement of services as described above. I understand that this creates a binding agreement for the services and pricing outlined in this proposal.`;
}
