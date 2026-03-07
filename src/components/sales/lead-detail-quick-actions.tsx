'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Phone, StickyNote, CheckCircle, ArrowRight, Loader2, Calendar } from 'lucide-react';
import { ConvertLeadToOpportunityModal } from '@/components/sales/convert-lead-to-opportunity-modal';
import { setLeadStatusAction } from '@/actions/leads';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LeadDetailQuickActions({
  leadId,
  converted,
  accounts,
  defaultAccountName,
}: {
  leadId: string;
  converted: boolean;
  accounts: { id: string; name: string }[];
  defaultAccountName: string;
}) {
  const router = useRouter();
  const [qualifying, setQualifying] = useState(false);

  const handleMarkQualified = async () => {
    setQualifying(true);
    await setLeadStatusAction(leadId, 'qualified');
    setQualifying(false);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <Phone className="h-4 w-4" />
        Log call
      </Button>
      <Button variant="outline" size="sm" className="gap-2" disabled>
        <StickyNote className="h-4 w-4" />
        Add note
      </Button>
      {!converted && (
        <>
          <Link href={`/app/walkthroughs/new?leadId=${leadId}`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Calendar className="h-4 w-4" />
              Schedule walkthrough
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleMarkQualified}
            disabled={qualifying}
          >
            {qualifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Mark qualified
          </Button>
          <ConvertLeadToOpportunityModal
            leadId={leadId}
            defaultAccountName={defaultAccountName}
            accounts={accounts}
          />
        </>
      )}
      {converted && (
        <Link href="/app/crm/pipeline">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            View in Pipeline
          </Button>
        </Link>
      )}
    </div>
  );
}
