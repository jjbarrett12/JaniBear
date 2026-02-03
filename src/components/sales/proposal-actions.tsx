'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Printer, Pencil } from 'lucide-react';
import { SendProposalDialog } from '@/components/proposals/send-proposal-dialog';

interface ProposalActionsProps {
  proposalId: string;
  proposalTitle?: string;
  recipientEmail?: string;
  recipientName?: string;
  status?: string;
}

export function ProposalActions({ 
  proposalId, 
  proposalTitle,
  recipientEmail,
  recipientName,
  status,
}: ProposalActionsProps) {
  const canSend = status !== 'accepted';

  return (
    <div className="flex items-center gap-2 print:hidden">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.print()}
      >
        <Printer className="h-4 w-4 mr-2" />
        Print / PDF
      </Button>
      <Link href={`/app/sales/proposals/${proposalId}/edit`}>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </Link>
      {canSend && (
        <SendProposalDialog
          proposalId={proposalId}
          proposalTitle={proposalTitle}
          defaultEmail={recipientEmail}
          defaultName={recipientName}
        />
      )}
    </div>
  );
}
