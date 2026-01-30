'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Printer, Pencil } from 'lucide-react';

interface ProposalActionsProps {
  proposalId: string;
}

export function ProposalActions({ proposalId }: ProposalActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.print()}
        className="print:hidden"
      >
        <Printer className="h-4 w-4 mr-2" />
        Print / PDF
      </Button>
      <Link href={`/app/sales/proposals/${proposalId}/edit`}>
        <Button size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </Link>
    </div>
  );
}
