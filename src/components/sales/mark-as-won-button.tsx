'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { markDealWon } from '@/actions/crm';
import { useToast } from '@/hooks/use-toast';

export function MarkAsWonButton({ opportunityId }: { opportunityId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    const { error } = await markDealWon(opportunityId);
    setLoading(false);
    if (error) {
      toast({ title: 'Could not mark as won', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Deal marked as won' });
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1 text-green-700 dark:text-green-400"
      onClick={handleClick}
      disabled={loading}
    >
      <Trophy className="h-3 w-3" />
      {loading ? 'Saving…' : 'Mark as Won'}
    </Button>
  );
}
